const dotenv = require('dotenv');
// Import fetch dynamically
let fetch;
import('node-fetch').then(module => {
  fetch = module.default;
  // Run the function after fetch is loaded
  testLoginEndpoint();
}).catch(err => {
  console.error('Error importing node-fetch:', err);
});

// Load environment variables
dotenv.config();

// Test login endpoint
async function testLoginEndpoint() {
  try {
    console.log('Testing login endpoint...');
    
    // Get email and password from command line or use default
    const email = process.argv[2] || 'mark@betterview.nl';
    const password = process.argv[3] || 'admin123';
    
    console.log(`Attempting to login with email: ${email} and password: ${password}`);
    
    // Make the request to the login endpoint
    const response = await fetch(`${process.env.CLIENT_URL || 'http://localhost:5001'}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    // Parse the response
    const data = await response.json();
    
    if (response.ok) {
      console.log('Login successful!');
      console.log('Token:', data.token);
      console.log('User:', data.user);
    } else {
      console.log('Login failed!');
      console.log('Status:', response.status);
      console.log('Error:', data.message);
    }
  } catch (err) {
    console.error('Error in login process:', err);
  }
}
