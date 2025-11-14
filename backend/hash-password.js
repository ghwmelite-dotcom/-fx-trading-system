// Simple script to hash a password for the FX Trading System
const crypto = require('crypto');

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.error('Usage: node hash-password.js <password>');
  process.exit(1);
}

// Hash the password using SHA-256 (matching the backend logic)
const hash = crypto.createHash('sha256').update(password).digest('hex');

console.log('\n======================');
console.log('Password Hash Generated');
console.log('======================');
console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);
console.log('\n');
console.log('To update your admin password, run this SQL command in your D1 database:');
console.log(`\nUPDATE users SET password_hash = '${hash}' WHERE username = 'admin';\n`);
