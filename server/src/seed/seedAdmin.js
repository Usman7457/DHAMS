import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { query } from '../config/db.js';

dotenv.config();

const seedAdmin = async () => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const hash = await bcrypt.hash(password, 10);

  try {
    await query(
      `INSERT INTO users (username, password_hash, full_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name`,
      [username, hash, 'System Admin']
    );
    console.log('Admin seeded successfully');
  } catch (error) {
    console.error('Seed failed', error.message);
  }
};

seedAdmin();
