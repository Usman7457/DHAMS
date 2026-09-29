import dotenv from 'dotenv';
import { query } from '../config/db.js';
import { encryptPassword } from '../utils/crypto.js';

dotenv.config();

const migrate = async () => {
  try {
    console.log('Running safe database migration for domain_providers and hosting_providers...');

    // 1. Create domain_providers table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS domain_providers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        website_url VARCHAR(500),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Create hosting_providers table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS hosting_providers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        website_url VARCHAR(500),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Provider tables created or verified.');

    // 3. Seed domain providers from existing DB entries & popular list
    const defaultDomainProviders = [
      { name: 'HosterPK', url: 'https://www.hosterpk.com/' },
      { name: 'HostNext', url: 'https://www.hostnext.com/' },
      { name: 'Namesilo', url: 'https://www.namesilo.com/' },
      { name: 'GoDaddy', url: 'https://sso.godaddy.com/' },
      { name: 'Namecheap', url: 'https://www.namecheap.com/' },
      { name: 'PKNIC', url: 'https://www.pknic.net.pk/' },
      { name: 'Cloudflare', url: 'https://dash.cloudflare.com/' },
      { name: 'Hostinger', url: 'https://hpanel.hostinger.com/' },
    ];

    // Check existing domain providers from domains table
    const existingDomProvs = await query('SELECT DISTINCT provider_name, provider_url FROM domains');
    for (const row of existingDomProvs.rows) {
      if (row.provider_name && row.provider_name.trim()) {
        defaultDomainProviders.push({
          name: row.provider_name.trim(),
          url: row.provider_url || '',
        });
      }
    }

    for (const dp of defaultDomainProviders) {
      await query(
        `INSERT INTO domain_providers (name, website_url)
         VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING`,
        [dp.name, dp.url || null]
      );
    }
    console.log('Domain providers list populated.');

    // 4. Seed hosting providers from existing DB entries & popular list
    const defaultHostingProviders = [
      { name: 'HosterPK', url: 'https://www.hosterpk.com/' },
      { name: 'HostNext', url: 'https://www.hostnext.com/' },
      { name: 'Hostinger Premium', url: 'https://hpanel.hostinger.com/' },
      { name: 'cPanel HostGator', url: 'https://portal.hostgator.com/' },
      { name: 'AWS EC2 Cloud', url: 'https://console.aws.amazon.com/' },
      { name: 'Bluehost', url: 'https://www.bluehost.com/' },
      { name: 'Namecheap Hosting', url: 'https://www.namecheap.com/' },
    ];

    const existingHostProvs = await query('SELECT DISTINCT hosting_provider, provider_url FROM hostings');
    for (const row of existingHostProvs.rows) {
      if (row.hosting_provider && row.hosting_provider.trim()) {
        defaultHostingProviders.push({
          name: row.hosting_provider.trim(),
          url: row.provider_url || '',
        });
      }
    }

    for (const hp of defaultHostingProviders) {
      await query(
        `INSERT INTO hosting_providers (name, website_url)
         VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING`,
        [hp.name, hp.url || null]
      );
    }
    console.log('Hosting providers list populated.');

    // 5. Encrypt existing plain text passwords in domains table
    const allDomains = await query('SELECT id, provider_password FROM domains');
    for (const dom of allDomains.rows) {
      if (dom.provider_password && !dom.provider_password.startsWith('enc:v1:')) {
        const encrypted = encryptPassword(dom.provider_password);
        await query('UPDATE domains SET provider_password = $1 WHERE id = $2', [encrypted, dom.id]);
      }
    }

    // 6. Encrypt existing plain text passwords in hostings table
    const allHostings = await query('SELECT id, provider_password, password FROM hostings');
    for (const host of allHostings.rows) {
      let updatedProvPass = host.provider_password;
      let updatedPanelPass = host.password;

      if (host.provider_password && !host.provider_password.startsWith('enc:v1:')) {
        updatedProvPass = encryptPassword(host.provider_password);
      }
      if (host.password && !host.password.startsWith('enc:v1:')) {
        updatedPanelPass = encryptPassword(host.password);
      }

      await query(
        'UPDATE hostings SET provider_password = $1, password = $2 WHERE id = $3',
        [updatedProvPass, updatedPanelPass, host.id]
      );
    }

    console.log('Existing DB passwords successfully encrypted.');
    console.log('Safe migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
};

migrate();
