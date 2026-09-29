# DHAMS

DHAMS (Domain and Hosting Assets Management System) is a secure single-admin CRUD system for managing domain and hosting assets.

## Features

- JWT-protected admin login
- Domain + hosting asset CRUD operations
- Expiry highlighting when an asset is within 30 days of expiry or already expired
- PostgreSQL-ready relational database schema
- React frontend using the supplied Bootstrap theme

## Project structure

- `client/` React frontend
- `server/` Express + PostgreSQL API
- `bootstrap-theme/` static theme source used for design reference

## Database design

### `users`
- `id` (UUID primary key)
- `username`
- `password_hash`
- `full_name`
- `created_at`
- `updated_at`

### `domain_hosting_assets`
- `id` (UUID primary key)
- `domain_name`
- `domain_expiry_date`
- `domain_provider_name`
- `hosting_expiry_date`
- `hosting_provider_name`
- `owner_name`
- `owner_contact_no`
- `hosting_url`
- `hosting_username`
- `hosting_password`
- `created_at`
- `updated_at`

## Run locally

1. Create PostgreSQL database named `DHAMS`.
2. Copy `server/.env.example` to `server/.env` and update values.
3. Import schema file from `server/src/db/schema.sql`.
4. Run:
   - `npm install`
   - `npm --prefix server install`
   - `npm --prefix client install`
   - `npm --prefix server run init-db`
   - `npm --prefix server run seed-admin`
   - `npm run dev`

## Admin login

Default login uses the environment credentials from `server/.env`.
