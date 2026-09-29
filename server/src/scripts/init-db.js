import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, '../db/schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

const initDb = async () => {
  try {
    console.log('Resetting and Initializing PostgreSQL Database Schema with Users RBAC & Credentials...');

    // Drop tables if they exist
    await query(`
      DROP TABLE IF EXISTS hostings CASCADE;
      DROP TABLE IF EXISTS domains CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS clients CASCADE;
      DROP TABLE IF EXISTS domain_hosting_assets CASCADE;
    `);

    await query(schemaSql);
    console.log('Database tables created successfully.');

    // Seed Default System Admin User
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await query(
      `INSERT INTO users (username, password_hash, full_name, email, role, is_system_default)
       VALUES ($1, $2, $3, $4, 'admin', true)
       ON CONFLICT (username) DO NOTHING`,
      [adminUsername, passwordHash, 'System Administrator', 'admin@dhams.com']
    );
    console.log(`Default System Admin user '${adminUsername}' seeded.`);

    // Seed Sample Clients
    const c1 = await query(
      `INSERT INTO clients (name, email, phone, company, notes) 
       VALUES ('Sheikh Usman', 'usman@techcorp.com', '+92 300 1234567', 'TechCorp Solutions', 'VIP Corporate Client') RETURNING id`
    );
    const c1Id = c1.rows[0].id; // 1

    const c2 = await query(
      `INSERT INTO clients (name, email, phone, company, notes) 
       VALUES ('Faisal Raza', 'faisal@designhub.pk', '+92 321 7654321', 'DesignHub Digital', 'Web Design Client') RETURNING id`
    );
    const c2Id = c2.rows[0].id; // 2

    const c3 = await query(
      `INSERT INTO clients (name, email, phone, company, notes) 
       VALUES ('Sarah Khan', 'sarah@innovate.net', '+92 333 9988776', 'Innovate Soft', 'Enterprise Client') RETURNING id`
    );
    const c3Id = c3.rows[0].id; // 3

    // Seed Viewer User 'faisal' linked to Client #2
    const faisalPasswordHash = await bcrypt.hash('Faisal@123', 10);
    await query(
      `INSERT INTO users (username, password_hash, full_name, email, role, client_id, is_system_default)
       VALUES ('faisal', $1, 'Faisal Raza', 'faisal@designhub.pk', 'viewer', $2, false)`,
      [faisalPasswordHash, c2Id]
    );
    console.log(`Sample Viewer user 'faisal' seeded (linked to Client #${c2Id}).`);

    // Dates for notifications testing
    const now = new Date();
    const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expiredDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Seed Sample Domains with Registrar Account Credentials
    const d1 = await query(
      `INSERT INTO domains (client_id, domain_name, provider_name, provider_url, provider_username, provider_password, registration_date, expiry_date, auto_renew, notes)
       VALUES ($1, 'techcorp-solutions.com', 'Namecheap', 'https://www.namecheap.com/myaccount/login/', 'techcorp_nc', 'NcPass#2026', '2023-10-15', $2, true, 'Primary Corporate Domain') RETURNING id`,
      [c1Id, in15Days]
    );
    const d1Id = d1.rows[0].id; // 1

    const d2 = await query(
      `INSERT INTO domains (client_id, domain_name, provider_name, provider_url, provider_username, provider_password, registration_date, expiry_date, auto_renew, notes)
       VALUES ($1, 'designhub.pk', 'GoDaddy', 'https://sso.godaddy.com', 'faisal_godaddy', 'GoDaddy#9988', '2022-05-10', $2, false, 'Main Agency Domain') RETURNING id`,
      [c2Id, in60Days]
    );
    const d2Id = d2.rows[0].id; // 2

    const d3 = await query(
      `INSERT INTO domains (client_id, domain_name, provider_name, provider_url, provider_username, provider_password, registration_date, expiry_date, auto_renew, notes)
       VALUES ($1, 'urgent-expiry-portal.net', 'Cloudflare', 'https://dash.cloudflare.com/login', 'usman_cf', 'CfSecret#77', '2023-01-01', $2, false, 'Staging Portal') RETURNING id`,
      [c1Id, expiredDate]
    );

    const d4 = await query(
      `INSERT INTO domains (client_id, domain_name, provider_name, provider_url, provider_username, provider_password, registration_date, expiry_date, auto_renew, notes)
       VALUES ($1, 'innovate-soft.org', 'Hostinger', 'https://hpanel.hostinger.com', 'sarah_hostinger', 'HostPass#33', '2024-02-14', $2, true, 'Non-profit Arm') RETURNING id`,
      [c3Id, in5Days]
    );
    const d4Id = d4.rows[0].id; // 4

    // Seed Sample Hostings with Provider & Panel Credentials
    await query(
      `INSERT INTO hostings (client_id, domain_id, hosting_provider, provider_url, provider_username, provider_password, server_ip, panel_url, username, password, expiry_date, notes)
       VALUES ($1, $2, 'Hostinger Premium', 'https://hpanel.hostinger.com', 'usman_hostinger_acc', 'AccPass#123', '185.199.108.153', 'https://hpanel.hostinger.com', 'usman_admin', 'Pass@9988#$', $3, 'High Performance VPS')`,
      [c1Id, d1Id, in5Days]
    );

    await query(
      `INSERT INTO hostings (client_id, domain_id, hosting_provider, provider_url, provider_username, provider_password, server_ip, panel_url, username, password, expiry_date, notes)
       VALUES ($1, $2, 'cPanel HostGator', 'https://portal.hostgator.com', 'faisal_hg_acc', 'HgPortalPass#456', '192.185.225.10', 'https://cpanel.designhub.pk:2083', 'designhub_cpanel', 'SecurePass2026!', $3, 'Shared Business Hosting')`,
      [c2Id, d2Id, in60Days]
    );

    await query(
      `INSERT INTO hostings (client_id, domain_id, hosting_provider, provider_url, provider_username, provider_password, server_ip, panel_url, username, password, expiry_date, notes)
       VALUES ($1, $2, 'AWS EC2 Cloud', 'https://console.aws.amazon.com', 'sarah_aws_root', 'AwsRootPass#789', '54.210.12.88', 'https://aws.amazon.com/console', 'innovate_aws', 'AwsCloud#2026!', $3, 'Dedicated App Instance')`,
      [c3Id, d4Id, in15Days]
    );

    console.log('Database initialized and seeded successfully.');
  } catch (error) {
    console.error('Database init error:', error.message);
  }
};

initDb();
