#!/usr/bin/env node
/**
 * Test script to directly test the video creation API endpoint
 * This helps debug issues with the API route
 */

const axios = require('axios');

async function testVideoCreationAPI() {
  try {
    // Get auth token from command line or hardcode for testing
    const token = process.argv[2] || 'YOUR_AUTH_TOKEN_HERE';
    
    if (!token || token === 'YOUR_AUTH_TOKEN_HERE') {
      console.error('Please provide an auth token as the first argument');
      console.error('Usage: node direct-video-api-test.js YOUR_AUTH_TOKEN');
      process.exit(1);
    }
    
    console.log('Using auth token:', token);
    
    // Prepare test data
    const now = new Date();
    const testData = {
      title: `API Test Video (${now.toISOString()})`,
      description: 'This is a test video created by the API test script',
      // Use real client ID from your database
      client_id: '6ea593b6-dfb9-4a6e-937e-a3ca78a40ef9',
      
      // Month information
      monthInfo: {
        month: now.getMonth() + 1, // 1-12
        year: now.getFullYear()
      },
      
      // Storage related fields
      storage_path: `clients/6ea593b6-dfb9-4a6e-937e-a3ca78a40ef9/${now.getMonth() + 1}-${now.getFullYear()}/api_test_${Date.now()}.mp4`,
      file_size: 1048576, // 1MB dummy size
      content_type: 'video/mp4'
    };
    
    console.log('Sending request with data:', JSON.stringify(testData, null, 2));
    
    // Send request to your API
    const response = await axios.post('http://localhost:5001/api/videos', testData, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    console.log('API call successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // If successful, also test retrieving the video
    if (response.data && response.data.id) {
      const videoId = response.data.id;
      console.log(`Testing video retrieval for ID: ${videoId}`);
      
      try {
        const getResponse = await axios.get(`http://localhost:5001/api/videos/${videoId}`, {
          headers: {
            'x-auth-token': token
          }
        });
        
        console.log('Video retrieval successful!');
        console.log('Retrieved video:', JSON.stringify(getResponse.data, null, 2));
        
        // Clean up - delete the test video
        console.log(`Cleaning up - deleting test video ${videoId}`);
        const deleteResponse = await axios.delete(`http://localhost:5001/api/videos/${videoId}`, {
          headers: {
            'x-auth-token': token
          }
        });
        
        console.log('Video deletion response:', deleteResponse.data);
      } catch (getErr) {
        console.error('Error retrieving or deleting video:', getErr.message);
        if (getErr.response) {
          console.error('Error response:', getErr.response.data);
        }
      }
    }
  } catch (error) {
    console.error('API test failed:', error.message);
    
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received');
    }
  }
}

testVideoCreationAPI();
