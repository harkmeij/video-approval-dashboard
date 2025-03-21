const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Make sure we're loading the .env file from the correct location
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Default test data - change these values as needed
const testData = {
  email: process.argv[2] || 'test@example.com',
  name: 'Test User',
  role: 'client'
};

// Admin credentials for authentication
const adminCredentials = {
  email: process.env.ADMIN_EMAIL || 'admin@example.com',
  password: process.env.ADMIN_PASSWORD || 'adminpassword'
};

// Function to run the test
async function testInvite() {
  try {
    console.log('Starting invite test with email:', testData.email);
    
    // Step 1: Login as admin to get token
    console.log('Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', adminCredentials);
    const token = loginResponse.data.token;
    
    if (!token) {
      console.error('Failed to get authentication token');
      return;
    }
    
    console.log('Successfully logged in as admin');
    
    // Step 2: Send invite request
    console.log('Sending invite request for:', testData.email);
    const inviteResponse = await axios.post(
      'http://localhost:5000/api/auth/invite',
      testData,
      {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Invite response:', inviteResponse.data);
    
    if (inviteResponse.data.setupLink) {
      console.log('Setup link (manual invitation):', inviteResponse.data.setupLink);
    }
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during test:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
  }
}

// Run the test
testInvite();
