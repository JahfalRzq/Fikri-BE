// Test database connection with multiple hosts
const mysql = require('mysql2');

// Replace these with your actual credentials
const credentials = {
  port: 3306,
  user: 'YOUR_USERNAME',      // Replace with actual username
  password: 'YOUR_PASSWORD',  // Replace with actual password
  database: 'YOUR_DATABASE'   // Replace with actual database
};

// Common database hosts to try
const hostsToTry = [
  'localhost',
  'expertindo-training.com',
  'mysql.expertindo-training.com',
  '103.247.8.60'
];

async function testConnection(host) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing connection to: ${host}`);
    
    const connection = mysql.createConnection({
      ...credentials,
      host: host,
      connectTimeout: 10000, // 10 second timeout
    });

    const timeout = setTimeout(() => {
      connection.destroy();
      resolve({ host, success: false, error: 'Connection timeout' });
    }, 10000);

    connection.connect((err) => {
      clearTimeout(timeout);
      
      if (err) {
        console.log(`❌ ${host}: ${err.message}`);
        connection.destroy();
        resolve({ host, success: false, error: err.message });
        return;
      }

      console.log(`✅ ${host}: Connected successfully!`);
      
      connection.query('SELECT 1 as test', (queryErr, results) => {
        if (queryErr) {
          console.log(`❌ ${host}: Query failed - ${queryErr.message}`);
          resolve({ host, success: false, error: queryErr.message });
        } else {
          console.log(`✅ ${host}: Query successful!`);
          resolve({ host, success: true, results });
        }
        connection.end();
      });
    });
  });
}

async function testAllHosts() {
  console.log('🚀 Testing database connections...\n');
  
  for (const host of hostsToTry) {
    const result = await testConnection(host);
    if (result.success) {
      console.log(`\n🎉 SUCCESS! Use this host: ${result.host}`);
      console.log(`DB_HOST=${result.host}`);
      break;
    }
  }
  
  console.log('\n📝 Make sure to:');
  console.log('1. Replace YOUR_USERNAME, YOUR_PASSWORD, YOUR_DATABASE with actual values');
  console.log('2. Add remote access hosts in cPanel when it\'s accessible');
  console.log('3. Contact hosting provider if none work');
}

testAllHosts().catch(console.error);