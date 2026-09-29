import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { query } from './config/db.js';
import { signToken } from './utils/jwt.js';
import { authenticate } from './middleware/auth.js';
import { encryptPassword, decryptPassword } from './utils/crypto.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Admin / User Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const result = await query(
      'SELECT id, username, password_hash, full_name, email, role, client_id FROM users WHERE username = $1',
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid login credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid login credentials' });
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      clientId: user.client_id,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        clientId: user.client_id,
      },
    });
  } catch (error) {
    console.error('LOGIN_ERROR:', error.message);
    return res.status(500).json({ message: 'Login failed', detail: error.message });
  }
});

// Current User Profile
app.get('/api/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, full_name, email, role, client_id FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// ==================== USERS MANAGEMENT ROUTES (Admin Only) ====================
app.get('/api/users', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin rights required.' });
  }

  try {
    const result = await query(`
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.email,
        u.role,
        u.client_id,
        u.is_system_default,
        u.created_at,
        c.name as client_name
      FROM users u
      LEFT JOIN clients c ON u.client_id = c.id
      ORDER BY u.id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('GET_USERS_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.post('/api/users', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin rights required.' });
  }

  const { username, password, full_name, email, role, client_id } = req.body;
  if (!username || !password || !full_name) {
    return res.status(400).json({ message: 'Username, password, and full name are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (username, password_hash, full_name, email, role, client_id, is_system_default)
       VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING id, username, full_name, email, role, client_id, created_at`,
      [
        username.trim().toLowerCase(),
        passwordHash,
        full_name,
        email || null,
        role || 'viewer',
        client_id ? parseInt(client_id, 10) : null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('ADD_USER_ERROR:', error.message);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Failed to create user' });
  }
});

app.put('/api/users/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin rights required.' });
  }

  const { id } = req.params;
  const { username, password, full_name, email, role, client_id } = req.body;

  try {
    const userCheck = await query('SELECT is_system_default FROM users WHERE id = $1', [parseInt(id, 10)]);
    if (userCheck.rowCount === 0) return res.status(404).json({ message: 'User not found' });

    let result;
    if (password && password.trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 10);
      result = await query(
        `UPDATE users 
         SET username = $1, password_hash = $2, full_name = $3, email = $4, role = $5, client_id = $6, updated_at = NOW()
         WHERE id = $7 RETURNING id, username, full_name, email, role, client_id`,
        [
          username.trim().toLowerCase(),
          passwordHash,
          full_name,
          email || null,
          userCheck.rows[0].is_system_default ? 'admin' : (role || 'viewer'),
          client_id ? parseInt(client_id, 10) : null,
          parseInt(id, 10),
        ]
      );
    } else {
      result = await query(
        `UPDATE users 
         SET username = $1, full_name = $2, email = $3, role = $4, client_id = $5, updated_at = NOW()
         WHERE id = $6 RETURNING id, username, full_name, email, role, client_id`,
        [
          username.trim().toLowerCase(),
          full_name,
          email || null,
          userCheck.rows[0].is_system_default ? 'admin' : (role || 'viewer'),
          client_id ? parseInt(client_id, 10) : null,
          parseInt(id, 10),
        ]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('UPDATE_USER_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin rights required.' });
  }

  const { id } = req.params;
  try {
    const userCheck = await query('SELECT is_system_default FROM users WHERE id = $1', [parseInt(id, 10)]);
    if (userCheck.rowCount === 0) return res.status(404).json({ message: 'User not found' });
    if (userCheck.rows[0].is_system_default) {
      return res.status(400).json({ message: 'Default System Admin user cannot be deleted.' });
    }

    await query('DELETE FROM users WHERE id = $1', [parseInt(id, 10)]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('DELETE_USER_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// ==================== DOMAIN PROVIDERS ROUTES ====================
app.get('/api/domain-providers', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM domain_providers ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('GET_DOMAIN_PROVIDERS_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to fetch domain providers' });
  }
});

app.post('/api/domain-providers', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can manage providers' });
  }
  const { name, website_url, notes } = req.body;
  if (!name) return res.status(400).json({ message: 'Provider name is required' });

  try {
    const result = await query(
      `INSERT INTO domain_providers (name, website_url, notes) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), website_url || null, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ message: 'Provider already exists' });
    res.status(500).json({ message: 'Failed to create domain provider' });
  }
});

app.put('/api/domain-providers/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can manage providers' });
  }
  const { id } = req.params;
  const { name, website_url, notes } = req.body;

  try {
    const result = await query(
      `UPDATE domain_providers SET name = $1, website_url = $2, notes = $3 WHERE id = $4 RETURNING *`,
      [name.trim(), website_url || null, notes || null, parseInt(id, 10)]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Provider not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update domain provider' });
  }
});

app.delete('/api/domain-providers/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can manage providers' });
  }
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM domain_providers WHERE id = $1 RETURNING *', [parseInt(id, 10)]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Provider not found' });
    res.json({ message: 'Domain provider deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete domain provider' });
  }
});

// ==================== HOSTING PROVIDERS ROUTES ====================
app.get('/api/hosting-providers', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM hosting_providers ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('GET_HOSTING_PROVIDERS_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to fetch hosting providers' });
  }
});

app.post('/api/hosting-providers', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can manage providers' });
  }
  const { name, website_url, notes } = req.body;
  if (!name) return res.status(400).json({ message: 'Provider name is required' });

  try {
    const result = await query(
      `INSERT INTO hosting_providers (name, website_url, notes) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), website_url || null, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ message: 'Provider already exists' });
    res.status(500).json({ message: 'Failed to create hosting provider' });
  }
});

app.put('/api/hosting-providers/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can manage providers' });
  }
  const { id } = req.params;
  const { name, website_url, notes } = req.body;

  try {
    const result = await query(
      `UPDATE hosting_providers SET name = $1, website_url = $2, notes = $3 WHERE id = $4 RETURNING *`,
      [name.trim(), website_url || null, notes || null, parseInt(id, 10)]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Provider not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update hosting provider' });
  }
});

app.delete('/api/hosting-providers/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can manage providers' });
  }
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM hosting_providers WHERE id = $1 RETURNING *', [parseInt(id, 10)]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Provider not found' });
    res.json({ message: 'Hosting provider deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete hosting provider' });
  }
});

// ==================== CLIENTS ROUTES ====================
app.get('/api/clients', authenticate, async (req, res) => {
  try {
    let sql = `
      SELECT 
        c.*,
        COUNT(DISTINCT d.id)::int as domain_count,
        COUNT(DISTINCT h.id)::int as hosting_count
      FROM clients c
      LEFT JOIN domains d ON d.client_id = c.id
      LEFT JOIN hostings h ON h.client_id = c.id
    `;
    const params = [];

    if (req.user.role === 'viewer' && req.user.clientId) {
      sql += ` WHERE c.id = $1`;
      params.push(req.user.clientId);
    }

    sql += ` GROUP BY c.id ORDER BY c.id ASC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('GET_CLIENTS_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to fetch clients' });
  }
});

app.post('/api/clients', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can add clients' });
  }

  const { name, email, phone, company, notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ message: 'Client name and phone number are required' });
  }

  try {
    const result = await query(
      `INSERT INTO clients (name, email, phone, company, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email || null, phone, company || null, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('ADD_CLIENT_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to create client' });
  }
});

app.put('/api/clients/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can update clients' });
  }

  const { id } = req.params;
  const { name, email, phone, company, notes } = req.body;

  try {
    const result = await query(
      `UPDATE clients 
       SET name = $1, email = $2, phone = $3, company = $4, notes = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, email || null, phone, company || null, notes || null, parseInt(id, 10)]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('UPDATE_CLIENT_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to update client' });
  }
});

app.delete('/api/clients/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can delete clients' });
  }

  const { id } = req.params;
  try {
    const result = await query('DELETE FROM clients WHERE id = $1 RETURNING *', [parseInt(id, 10)]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('DELETE_CLIENT_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to delete client' });
  }
});

// ==================== DOMAINS ROUTES (With Password Encryption/Decryption) ====================
app.get('/api/domains', authenticate, async (req, res) => {
  try {
    let sql = `
      SELECT 
        d.id,
        d.client_id,
        d.domain_name,
        d.provider_name,
        d.provider_url,
        d.provider_username,
        d.provider_password,
        d.registration_date,
        d.expiry_date,
        d.auto_renew,
        d.notes,
        d.created_at,
        d.updated_at,
        c.name as client_name,
        c.phone as client_phone,
        c.email as client_email,
        c.company as client_company
      FROM domains d
      LEFT JOIN clients c ON d.client_id = c.id
    `;
    const params = [];

    if (req.user.role === 'viewer' && req.user.clientId) {
      sql += ` WHERE d.client_id = $1`;
      params.push(req.user.clientId);
    }

    sql += ` ORDER BY d.id ASC`;

    const result = await query(sql, params);
    
    // Decrypt passwords before returning to frontend
    const decryptedRows = result.rows.map((row) => ({
      ...row,
      provider_password: decryptPassword(row.provider_password),
    }));

    res.json(decryptedRows);
  } catch (error) {
    console.error('GET_DOMAINS_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to fetch domains' });
  }
});

app.post('/api/domains', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can add domains' });
  }

  const {
    client_id,
    domain_name,
    provider_name,
    provider_url,
    provider_username,
    provider_password,
    registration_date,
    expiry_date,
    auto_renew,
    notes,
  } = req.body;

  if (!domain_name || !provider_name || !expiry_date) {
    return res.status(400).json({ message: 'Domain name, provider, and expiry date are required' });
  }

  try {
    const cleanDomain = domain_name.trim().toLowerCase();
    const existing = await query('SELECT id FROM domains WHERE LOWER(domain_name) = $1', [cleanDomain]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ message: `Domain "${cleanDomain}" already exists in the system!` });
    }

    const encryptedProvPass = encryptPassword(provider_password);

    const result = await query(
      `INSERT INTO domains (
        client_id, domain_name, provider_name, provider_url, provider_username, provider_password,
        registration_date, expiry_date, auto_renew, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        client_id ? parseInt(client_id, 10) : null,
        cleanDomain,
        provider_name,
        provider_url || null,
        provider_username || null,
        encryptedProvPass || null,
        registration_date || null,
        expiry_date,
        Boolean(auto_renew),
        notes || null,
      ]
    );

    const row = result.rows[0];
    row.provider_password = decryptPassword(row.provider_password);
    res.status(201).json(row);
  } catch (error) {
    console.error('ADD_DOMAIN_ERROR:', error.message);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Domain name already exists in the system!' });
    }
    res.status(500).json({ message: 'Failed to add domain' });
  }
});

app.put('/api/domains/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can update domains' });
  }

  const { id } = req.params;
  const {
    client_id,
    domain_name,
    provider_name,
    provider_url,
    provider_username,
    provider_password,
    registration_date,
    expiry_date,
    auto_renew,
    notes,
  } = req.body;

  try {
    const cleanDomain = (domain_name || '').trim().toLowerCase();
    const existing = await query('SELECT id FROM domains WHERE LOWER(domain_name) = $1 AND id != $2', [cleanDomain, parseInt(id, 10)]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ message: `Domain "${cleanDomain}" already exists in the system!` });
    }

    const encryptedProvPass = encryptPassword(provider_password);

    const result = await query(
      `UPDATE domains SET
        client_id = $1,
        domain_name = $2,
        provider_name = $3,
        provider_url = $4,
        provider_username = $5,
        provider_password = $6,
        registration_date = $7,
        expiry_date = $8,
        auto_renew = $9,
        notes = $10,
        updated_at = NOW()
       WHERE id = $11 RETURNING *`,
      [
        client_id ? parseInt(client_id, 10) : null,
        cleanDomain,
        provider_name,
        provider_url || null,
        provider_username || null,
        encryptedProvPass || null,
        registration_date || null,
        expiry_date,
        Boolean(auto_renew),
        notes || null,
        parseInt(id, 10),
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Domain record not found' });
    }

    const row = result.rows[0];
    row.provider_password = decryptPassword(row.provider_password);
    res.json(row);
  } catch (error) {
    console.error('UPDATE_DOMAIN_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to update domain' });
  }
});

app.delete('/api/domains/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can delete domains' });
  }

  const { id } = req.params;
  try {
    const result = await query('DELETE FROM domains WHERE id = $1 RETURNING *', [parseInt(id, 10)]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Domain record not found' });
    }
    res.json({ message: 'Domain deleted successfully' });
  } catch (error) {
    console.error('DELETE_DOMAIN_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to delete domain' });
  }
});

// ==================== HOSTINGS ROUTES (With Password Encryption/Decryption) ====================
app.get('/api/hostings', authenticate, async (req, res) => {
  try {
    let sql = `
      SELECT 
        h.id,
        h.client_id,
        h.domain_id,
        h.hosting_provider,
        h.provider_url,
        h.provider_username,
        h.provider_password,
        h.server_ip,
        h.panel_url,
        h.username,
        h.password,
        h.expiry_date,
        h.notes,
        h.created_at,
        h.updated_at,
        c.name as client_name,
        c.phone as client_phone,
        c.email as client_email,
        d.domain_name as linked_domain_name
      FROM hostings h
      LEFT JOIN clients c ON h.client_id = c.id
      LEFT JOIN domains d ON h.domain_id = d.id
    `;
    const params = [];

    if (req.user.role === 'viewer' && req.user.clientId) {
      sql += ` WHERE h.client_id = $1`;
      params.push(req.user.clientId);
    }

    sql += ` ORDER BY h.id ASC`;

    const result = await query(sql, params);

    // Decrypt passwords before returning to frontend
    const decryptedRows = result.rows.map((row) => ({
      ...row,
      provider_password: decryptPassword(row.provider_password),
      password: decryptPassword(row.password),
    }));

    res.json(decryptedRows);
  } catch (error) {
    console.error('GET_HOSTINGS_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to fetch hosting records' });
  }
});

app.post('/api/hostings', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can add hosting records' });
  }

  const {
    client_id,
    domain_id,
    hosting_provider,
    provider_url,
    provider_username,
    provider_password,
    server_ip,
    panel_url,
    username,
    password,
    expiry_date,
    notes,
  } = req.body;

  if (!hosting_provider || !panel_url || !username || !password || !expiry_date) {
    return res.status(400).json({
      message: 'Hosting provider, login panel URL, username, password, and expiry date are required',
    });
  }

  try {
    if (domain_id) {
      const dupDom = await query('SELECT id FROM hostings WHERE domain_id = $1', [parseInt(domain_id, 10)]);
      if (dupDom.rowCount > 0) {
        return res.status(400).json({ message: 'Hosting record for this linked domain already exists in the system!' });
      }
    }
    const dupPanel = await query('SELECT id FROM hostings WHERE LOWER(panel_url) = $1 AND LOWER(username) = $2', [
      panel_url.trim().toLowerCase(),
      username.trim().toLowerCase(),
    ]);
    if (dupPanel.rowCount > 0) {
      return res.status(400).json({ message: `Hosting account for username "${username}" already exists on this panel!` });
    }

    const encryptedProvPass = encryptPassword(provider_password);
    const encryptedPanelPass = encryptPassword(password);

    const result = await query(
      `INSERT INTO hostings (
        client_id, domain_id, hosting_provider, provider_url, provider_username, provider_password,
        server_ip, panel_url, username, password, expiry_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        client_id ? parseInt(client_id, 10) : null,
        domain_id ? parseInt(domain_id, 10) : null,
        hosting_provider,
        provider_url || null,
        provider_username || null,
        encryptedProvPass || null,
        server_ip || null,
        panel_url,
        username,
        encryptedPanelPass,
        expiry_date,
        notes || null,
      ]
    );

    const row = result.rows[0];
    row.provider_password = decryptPassword(row.provider_password);
    row.password = decryptPassword(row.password);
    res.status(201).json(row);
  } catch (error) {
    console.error('ADD_HOSTING_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to add hosting record' });
  }
});

app.put('/api/hostings/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can update hosting records' });
  }

  const { id } = req.params;
  const {
    client_id,
    domain_id,
    hosting_provider,
    provider_url,
    provider_username,
    provider_password,
    server_ip,
    panel_url,
    username,
    password,
    expiry_date,
    notes,
  } = req.body;

  try {
    if (domain_id) {
      const dupDom = await query('SELECT id FROM hostings WHERE domain_id = $1 AND id != $2', [parseInt(domain_id, 10), parseInt(id, 10)]);
      if (dupDom.rowCount > 0) {
        return res.status(400).json({ message: 'Hosting record for this linked domain already exists in the system!' });
      }
    }
    const dupPanel = await query('SELECT id FROM hostings WHERE LOWER(panel_url) = $1 AND LOWER(username) = $2 AND id != $3', [
      panel_url.trim().toLowerCase(),
      username.trim().toLowerCase(),
      parseInt(id, 10),
    ]);
    if (dupPanel.rowCount > 0) {
      return res.status(400).json({ message: `Hosting account for username "${username}" already exists on this panel!` });
    }

    const encryptedProvPass = encryptPassword(provider_password);
    const encryptedPanelPass = encryptPassword(password);

    const result = await query(
      `UPDATE hostings SET
        client_id = $1,
        domain_id = $2,
        hosting_provider = $3,
        provider_url = $4,
        provider_username = $5,
        provider_password = $6,
        server_ip = $7,
        panel_url = $8,
        username = $9,
        password = $10,
        expiry_date = $11,
        notes = $12,
        updated_at = NOW()
       WHERE id = $13 RETURNING *`,
      [
        client_id ? parseInt(client_id, 10) : null,
        domain_id ? parseInt(domain_id, 10) : null,
        hosting_provider,
        provider_url || null,
        provider_username || null,
        encryptedProvPass || null,
        server_ip || null,
        panel_url,
        username,
        encryptedPanelPass,
        expiry_date,
        notes || null,
        parseInt(id, 10),
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Hosting record not found' });
    }

    const row = result.rows[0];
    row.provider_password = decryptPassword(row.provider_password);
    row.password = decryptPassword(row.password);
    res.json(row);
  } catch (error) {
    console.error('UPDATE_HOSTING_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to update hosting record' });
  }
});

app.delete('/api/hostings/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can delete hosting records' });
  }

  const { id } = req.params;
  try {
    const result = await query('DELETE FROM hostings WHERE id = $1 RETURNING *', [parseInt(id, 10)]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Hosting record not found' });
    }
    res.json({ message: 'Hosting record deleted successfully' });
  } catch (error) {
    console.error('DELETE_HOSTING_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to delete hosting record' });
  }
});

// ==================== NOTIFICATIONS & EXPIRATIONS ====================
app.get('/api/notifications/expiring', authenticate, async (req, res) => {
  try {
    const isViewer = req.user.role === 'viewer' && req.user.clientId;
    const clientFilter = isViewer ? `AND d.client_id = ${parseInt(req.user.clientId, 10)}` : '';
    const hClientFilter = isViewer ? `AND h.client_id = ${parseInt(req.user.clientId, 10)}` : '';

    const expiringDomains = await query(`
      SELECT 
        d.id,
        'domain' as asset_type,
        d.domain_name as title,
        d.provider_name as provider,
        d.expiry_date,
        c.name as client_name,
        c.phone as client_phone,
        (d.expiry_date - CURRENT_DATE) as days_left
      FROM domains d
      LEFT JOIN clients c ON d.client_id = c.id
      WHERE d.expiry_date <= (CURRENT_DATE + INTERVAL '30 days') ${clientFilter}
      ORDER BY d.expiry_date ASC
    `);

    const expiringHostings = await query(`
      SELECT 
        h.id,
        'hosting' as asset_type,
        COALESCE(d.domain_name, h.hosting_provider) as title,
        h.hosting_provider as provider,
        h.expiry_date,
        c.name as client_name,
        c.phone as client_phone,
        (h.expiry_date - CURRENT_DATE) as days_left
      FROM hostings h
      LEFT JOIN clients c ON h.client_id = c.id
      LEFT JOIN domains d ON h.domain_id = d.id
      WHERE h.expiry_date <= (CURRENT_DATE + INTERVAL '30 days') ${hClientFilter}
      ORDER BY h.expiry_date ASC
    `);

    const combined = [...expiringDomains.rows, ...expiringHostings.rows].sort(
      (a, b) => new Date(a.expiry_date) - new Date(b.expiry_date)
    );

    res.json({
      total_notifications: combined.length,
      items: combined,
    });
  } catch (error) {
    console.error('GET_NOTIFICATIONS_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to fetch expiration notifications' });
  }
});

// ==================== DASHBOARD STATS ====================
app.get('/api/dashboard/stats', authenticate, async (req, res) => {
  try {
    const isViewer = req.user.role === 'viewer' && req.user.clientId;
    const cId = isViewer ? parseInt(req.user.clientId, 10) : null;

    const clientsQuery = isViewer
      ? `SELECT COUNT(*)::int as count FROM clients WHERE id = ${cId}`
      : `SELECT COUNT(*)::int as count FROM clients`;
    const domainsQuery = isViewer
      ? `SELECT COUNT(*)::int as count FROM domains WHERE client_id = ${cId}`
      : `SELECT COUNT(*)::int as count FROM domains`;
    const hostingsQuery = isViewer
      ? `SELECT COUNT(*)::int as count FROM hostings WHERE client_id = ${cId}`
      : `SELECT COUNT(*)::int as count FROM hostings`;

    const expDomQuery = isViewer
      ? `SELECT COUNT(*)::int as count FROM domains WHERE client_id = ${cId} AND expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')`
      : `SELECT COUNT(*)::int as count FROM domains WHERE expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')`;
    const expdDomQuery = isViewer
      ? `SELECT COUNT(*)::int as count FROM domains WHERE client_id = ${cId} AND expiry_date < CURRENT_DATE`
      : `SELECT COUNT(*)::int as count FROM domains WHERE expiry_date < CURRENT_DATE`;

    const expHostQuery = isViewer
      ? `SELECT COUNT(*)::int as count FROM hostings WHERE client_id = ${cId} AND expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')`
      : `SELECT COUNT(*)::int as count FROM hostings WHERE expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')`;
    const expdHostQuery = isViewer
      ? `SELECT COUNT(*)::int as count FROM hostings WHERE client_id = ${cId} AND expiry_date < CURRENT_DATE`
      : `SELECT COUNT(*)::int as count FROM hostings WHERE expiry_date < CURRENT_DATE`;

    const [clientsRes, domainsRes, hostingsRes, expDomRes, expdDomRes, expHostRes, expdHostRes] = await Promise.all([
      query(clientsQuery),
      query(domainsQuery),
      query(hostingsQuery),
      query(expDomQuery),
      query(expdDomQuery),
      query(expHostQuery),
      query(expdHostQuery),
    ]);

    res.json({
      total_clients: clientsRes.rows[0].count,
      total_domains: domainsRes.rows[0].count,
      total_hostings: hostingsRes.rows[0].count,
      expiring_domains: expDomRes.rows[0].count,
      expired_domains: expdDomRes.rows[0].count,
      expiring_hostings: expHostRes.rows[0].count,
      expired_hostings: expdHostRes.rows[0].count,
      total_alerts:
        expDomRes.rows[0].count +
        expdDomRes.rows[0].count +
        expHostRes.rows[0].count +
        expdHostRes.rows[0].count,
    });
  } catch (error) {
    console.error('DASHBOARD_STATS_ERROR:', error.message);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database target: ${process.env.DB_NAME || 'DHAMS'}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other service or set a different PORT in server/.env.`);
  } else {
    console.error('Server startup error:', error);
  }
  process.exit(1);
});
