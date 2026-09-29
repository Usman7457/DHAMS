-- Database Schema for DHAMS (Domain & Hosting Asset Management System)
-- Auto-Incrementing Integer IDs (1, 2, 3...) & Role-Based Access Control

-- 1. Clients Table (Client Details / Owner Information)
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  company VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users Table (Admin & Viewer Accounts)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'admin', -- 'admin' or 'viewer'
  client_id INT REFERENCES clients(id) ON DELETE SET NULL, -- Optional link for viewer users to their client record
  is_system_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Domains Table (With Registrar Portal Credentials e.g. GoDaddy)
CREATE TABLE IF NOT EXISTS domains (
  id SERIAL PRIMARY KEY,
  client_id INT REFERENCES clients(id) ON DELETE SET NULL,
  domain_name VARCHAR(255) NOT NULL UNIQUE,
  provider_name VARCHAR(255) NOT NULL, -- e.g. GoDaddy, Namecheap
  provider_url VARCHAR(500), -- Login URL to Registrar portal
  provider_username VARCHAR(255), -- Username for GoDaddy/Registrar account
  provider_password TEXT, -- Password for GoDaddy/Registrar account
  registration_date DATE,
  expiry_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Hostings Table (With Hosting Account & Server cPanel Credentials)
CREATE TABLE IF NOT EXISTS hostings (
  id SERIAL PRIMARY KEY,
  client_id INT REFERENCES clients(id) ON DELETE SET NULL,
  domain_id INT REFERENCES domains(id) ON DELETE SET NULL,
  hosting_provider VARCHAR(255) NOT NULL, -- e.g. Hostinger, AWS
  provider_url VARCHAR(500), -- Portal Login URL where hosting was bought
  provider_username VARCHAR(255), -- Username for hosting provider account
  provider_password TEXT, -- Password for hosting provider account
  server_ip VARCHAR(100),
  panel_url VARCHAR(500) NOT NULL, -- cPanel / Admin URL
  username VARCHAR(255) NOT NULL, -- cPanel Username
  password TEXT NOT NULL, -- cPanel Password
  expiry_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_expiry_date ON domains(expiry_date);
CREATE INDEX IF NOT EXISTS idx_hostings_expiry_date ON hostings(expiry_date);
CREATE INDEX IF NOT EXISTS idx_domains_client_id ON domains(client_id);
CREATE INDEX IF NOT EXISTS idx_hostings_client_id ON hostings(client_id);
CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);
