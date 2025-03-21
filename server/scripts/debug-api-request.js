#!/usr/bin/env node
/**
 * Debug script to simulate the exact API request the client is making
 * This helps identify server-side issues with video creation
 */

// Import required modules
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:5001'; // Adjust if your server runs on a different port
const API_ENDPOINT = '/api/videos';
const SAMPLE_VIDEO_PATH = path.join(__dirname, 'sample-video.mp4'); // For testing file upload if needed

// Create a sample video file if it doesn't exist
if (!fs.existsSync(SAMPLE_VIDEO_PATH)) {
  // Create a small dummy file for testing
  const dummyData = Buffer.alloc(1024 * 10); // 10KB file
  fs.writeFileSync(SAMPLE_VIDEO_PATH, dummyData);
  console.log(`Created sample video file at ${SAMPLE_VIDEO_PATH}`);
}

// Request payload - exactly matching what client sends
const requestData = {
  title: "Debug Test Video",
  description: "This is a test video to debug the API",
  storage_path: "clients/6ea593b6-dfb9-4a6e-937e-a3ca78a40ef9/3-2025/debug_test.mp4",
  file_size: 1048576, // 1MB (dummy size)
  content_type: "video/mp4",
  monthInfo: {
    month: 3,
    year: 2025
  },
  client_id: "6ea593b6-dfb9-4a6e-937e-a3ca78a40ef9"
};

// Get authentication token - You may need to update this with a valid token
const getToken = () => {
  // For testing purposes, you can use a token from localStorage or a hardcoded value
  try {
    // Read token from a file if you've saved it
    if (fs.existsSync(path.join(__dirname, 'auth-token.txt'))) {
      return fs.readFileSync(path.join(__dirname, 'auth-token.txt'), 'utf8').trim();
    }
    
    console.warn('No auth token found. You may need to create an auth-token.txt file with a valid JWT token.');
    return process.argv[2] || 'YOUR_AUTH_TOKEN_HERE'; // Fallback to command line arg or placeholder
  } catch (err) {
    console.error('Error getting auth token:', err);
    return process.argv[2] || 'YOUR_AUTH_TOKEN_HERE';
  }
};

// Debug Function to make the API call
const debugApiRequest = async () => {
  try {
    console.log('Starting API request debug...');
    console.log('Request payload:', JSON.stringify(requestData, null, 2));
    
    const token = getToken();
    
    // Request headers matching the client
    const headers = {
      'Content-Type': 'application/json',
      'x-auth-token': token
    };
    
    console.log(`Making POST request to ${API_BASE_URL}${API_ENDPOINT}`);
    
    // Make the API call with explicit error logging
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINT}`, requestData, { headers });
      console.log('API request successful!');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (axiosError) {
      console.error('API request failed with error:');
      
      if (axiosError.response) {
        // Server responded with a status code outside of 2xx range
        console.error('  Status:', axiosError.response.status);
        console.error('  Status Text:', axiosError.response.statusText);
        console.error('  Response data:', JSON.stringify(axiosError.response.data, null, 2));
      } else if (axiosError.request) {
        // Request was made but no response received
        console.error('  No response received from server');
        console.error('  Request:', axiosError.request);
      } else {
        // Something happened in setting up the request
        console.error('  Error message:', axiosError.message);
      }
      
      if (axiosError.response && axiosError.response.data) {
        return axiosError.response.data;
      }
      
      throw axiosError;
    }
  } catch (error) {
    console.error('Debug script error:', error);
  } finally {
    console.log('Debug completed');
  }
};

// Check server connection first
const checkServerConnection = async () => {
  try {
    await axios.get(`${API_BASE_URL}/api/videos/test`);
    console.log('Server connection successful!');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('ERROR: Could not connect to server. Is the server running?');
      return false;
    } else {
      // Other errors might still mean the server is running
      console.warn('Server connection check encountered an error, but will continue:', error.message);
      return true;
    }
  }
};

// Run the debug function
const run = async () => {
  const serverRunning = await checkServerConnection();
  if (serverRunning) {
    await debugApiRequest();
  } else {
    console.error('Please start the server before running this script');
  }
};

run();
