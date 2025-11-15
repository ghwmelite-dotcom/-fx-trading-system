// Script to generate PBKDF2 password hash for updating admin password
// Usage: node update-admin-password.js <password>

const crypto = require('crypto');

function hashPassword(password) {
  // Generate salt
  const salt = crypto.randomBytes(16);

  // Create PBKDF2 hash with 100,000 iterations
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    100000,
    32,
    'sha256'
  );

  // Convert to hex and base64
  const hashHex = hash.toString('hex');
  const saltBase64 = salt.toString('base64');

  // Return in salt:hash format
  return `${saltBase64}:${hashHex}`;
}

const password = process.argv[2] || 'admin123';
const hashedPassword = hashPassword(password);

console.log('\n========================================');
console.log('Password Hash Generated');
console.log('========================================');
console.log('Password:', password);
console.log('Hash:', hashedPassword);
console.log('========================================\n');
console.log('SQL Command to update admin password:');
console.log('========================================');
console.log(`UPDATE users SET password_hash = '${hashedPassword}' WHERE username = 'admin';`);
console.log('========================================\n');
