// Test login functionality
const crypto = require('crypto');

// Your credentials
const username = 'admin';
const password = 'angels2G9@';

// Generate hash to verify
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log('\n=== Password Hash Verification ===');
console.log('Username:', username);
console.log('Password:', password);
console.log('Generated Hash:', hash);
console.log('Expected Hash: 6956b8027a8ec96b29b10500e038ca6368a815e3b1b63784e2da096da754256f');
console.log('Match:', hash === '6956b8027a8ec96b29b10500e038ca6368a815e3b1b63784e2da096da754256f');

// Test API endpoints
console.log('\n=== Testing API Connection ===');

const testApis = [
  'https://fx-dashboard-api.ghwmelite.workers.dev/api/auth/login',
  'https://fx-dashboard-api.workers.dev/api/auth/login',
];

async function testLogin() {
  for (const apiUrl of testApis) {
    console.log(`\nTesting: ${apiUrl}`);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      console.log('Status:', response.status, response.statusText);

      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));

      if (response.ok) {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('Token received:', data.token ? 'Yes' : 'No');
        console.log('User:', data.user);
        return true;
      } else {
        console.log('❌ LOGIN FAILED');
        console.log('Error:', data.error);
      }
    } catch (error) {
      console.log('❌ CONNECTION ERROR:', error.message);
    }
  }

  return false;
}

// Run the test
testLogin().then(success => {
  if (!success) {
    console.log('\n=== Troubleshooting ===');
    console.log('1. Check if backend is deployed: https://fx-dashboard-api.ghwmelite.workers.dev');
    console.log('2. Verify database has correct password hash');
    console.log('3. Check CORS settings');
    console.log('4. Verify frontend is pointing to correct API URL');
  }
  process.exit(success ? 0 : 1);
});
