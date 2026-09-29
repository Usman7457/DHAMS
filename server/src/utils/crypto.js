import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Secret key for encryption (32 bytes derived from JWT_SECRET or default)
const SECRET = process.env.JWT_SECRET || 'dhams_secure_encryption_secret_key_2026';
const KEY = crypto.createHash('sha256').update(SECRET).digest(); // 32 bytes key

/**
 * Encrypt a plain text password using AES-256-CBC
 */
export function encryptPassword(text) {
  if (!text || typeof text !== 'string') return text;
  // If already encrypted, return as is
  if (text.startsWith('enc:v1:')) return text;

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `enc:v1:${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err.message);
    return text;
  }
}

/**
 * Decrypt an encrypted password.
 * If text is plain text (legacy DB data), return text as-is!
 */
export function decryptPassword(text) {
  if (!text || typeof text !== 'string') return text;
  if (!text.startsWith('enc:v1:')) return text; // Plaintext fallback for legacy data

  try {
    const parts = text.split(':');
    if (parts.length !== 4) return text;
    const iv = Buffer.from(parts[2], 'hex');
    const encryptedText = parts[3];
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err.message);
    return text;
  }
}
