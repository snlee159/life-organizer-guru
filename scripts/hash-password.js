#!/usr/bin/env node

/**
 * PBKDF2 Password Hash Utility
 * 
 * Usage: node scripts/hash-password.js "YourPassword"
 * 
 * Generates a secure PBKDF2-HMAC-SHA256 hash with the following format:
 * iterations$salt(base64)$hash(base64)
 * 
 * Example output:
 * 100000$aGVsbG93b3JsZA==$5K8n7N3M9P2Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G==
 */

import crypto from 'crypto';

const ITERATIONS = 100000; // OWASP/NIST recommended minimum
const HASH_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16; // 128 bits

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    crypto.pbkdf2(password, salt, ITERATIONS, HASH_LENGTH, 'sha256', (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      
      const saltBase64 = salt.toString('base64');
      const hashBase64 = derivedKey.toString('base64');
      const finalHash = `${ITERATIONS}$${saltBase64}$${hashBase64}`;
      
      resolve(finalHash);
    });
  });
}

// Main execution
const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.js "YourPassword"');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/hash-password.js "MySecurePassword123"');
  process.exit(1);
}

console.log('Hashing password with PBKDF2-HMAC-SHA256...');
console.log(`Iterations: ${ITERATIONS}`);
console.log('');

hashPassword(password)
  .then(hash => {
    console.log('✓ Hash generated successfully!');
    console.log('');
    console.log('Copy this hash to your database or Supabase secrets:');
    console.log('');
    console.log(hash);
    console.log('');
    console.log('To set as Supabase secret:');
    console.log(`supabase secrets set ADMIN_PASSWORD_HASH="${hash}"`);
    console.log('');
    console.log('For database update (SQL):');
    console.log(`UPDATE admin_password SET password_hash = '${hash}' WHERE id = 1;`);
  })
  .catch(error => {
    console.error('Error generating hash:', error);
    process.exit(1);
  });
