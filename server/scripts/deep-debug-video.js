#!/usr/bin/env node
/**
 * Deep debugging script for the video creation process
 * This script tests each component of the video creation process independently
 * to identify exactly where the issue occurs
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Dependencies
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SERVER_PORT = process.env.PORT || 5001;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const JWT_SECRET = process.env.JWT_SECRET;
const SUPABASE_URL = process.env.PROJECT_URL || 'https://qcphzeimioklhgzcgdeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_API_KEY;

// Test data
const testData = {
  client: {
    id: '6ea593b6-dfb9-4a6e-937e-a3ca78a40ef9',
    name: 'John Smith',
    email: 'john@example.com',
    role: 'client'
  },
  editor: {
    id: '09a4f1d6-66a3-49e7-98d1-eb78de72f92a',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'editor'
  },
  month: {
    id: '5813fea6-ad87-4d79-bdb5-449a77d507cf',
    month: 3,
    year: 2025
  }
};

// Initialize Supabase client for direct DB access
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create a test JWT token
function createTestToken(user) {
  const payload = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// Direct database check
async function checkDirectDatabaseAccess() {
  console.log('\n==== CHECKING DIRECT DATABASE ACCESS ====');
  
  try {
    // Check if we can query the months table
    const { data: monthData, error: monthError } = await supabase
      .from('months')
      .select('*')
      .eq('month', testData.month.month)
      .eq('year', testData.month.year)
      .single();
    
    if (monthError) {
      console.error('❌ Could not access months table directly:', monthError);
      return false;
    }
    
    console.log('✅ Successfully queried months table directly:', monthData);
    
    // Check if we can insert into videos table
    const testVideo = {
      title: 'Deep Debug Test Video',
      description: 'Testing direct database insertion',
      client_id: testData.client.id,
      created_by: testData.editor.id,
      month_id: monthData.id,
      storage_path: 'debug/direct-test.mp4',
      file_size: 1024,
      content_type: 'video/mp4',
      status: 'pending'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('videos')
      .insert([testVideo])
      .select();
    
    if (insertError) {
      console.error('❌ Failed to insert video directly:', insertError);
      return false;
    }
    
    console.log('✅ Successfully inserted video directly:', insertData[0]);
    
    // Clean up
    if (insertData && insertData.length > 0) {
      const { error: cleanupError } = await supabase
        .from('videos')
        .delete()
        .eq('id', insertData[0].id);
      
      if (cleanupError) {
        console.warn('⚠️ Could not clean up test video:', cleanupError);
      } else {
        console.log('✅ Test video cleaned up');
      }
    }
    
    return true;
  } catch (err) {
    console.error('❌ Direct database access error:', err);
    return false;
  }
}

// Test API endpoint: GET /api/videos/test
async function testApiConnection() {
  console.log('\n==== TESTING API CONNECTION ====');
  
  try {
    const response = await axios.get(`${SERVER_URL}/api/videos/test`);
    console.log('✅ API connection successful:', response.data);
    return true;
  } catch (err) {
    console.error('❌ API connection failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('   Is the server running on port', SERVER_PORT, '?');
    }
    return false;
  }
}

// Test authentication
async function testAuthentication() {
  console.log('\n==== TESTING AUTHENTICATION ====');
  
  try {
    // Create a token for the editor
    const editorToken = createTestToken(testData.editor);
    console.log('Created editor test token');
    
    // Try to access a protected endpoint
    const response = await axios.get(`${SERVER_URL}/api/videos`, {
      headers: {
        'x-auth-token': editorToken
      }
    });
    
    console.log('✅ Authentication successful:', response.status);
    return true;
  } catch (err) {
    console.error('❌ Authentication test failed:', err.message);
    if (err.response) {
      console.error('   Status:', err.response.status);
      console.error('   Data:', err.response.data);
    }
    return false;
  }
}

// Test the month handling route directly 
async function testMonthHandling() {
  console.log('\n==== TESTING MONTH HANDLING ====');
  
  try {
    // Create a token for the editor
    const editorToken = createTestToken(testData.editor);
    
    // Test creating a month via direct API call to a test endpoint
    const monthData = {
      month: testData.month.month,
      year: testData.month.year
    };
    
    // Make a test request to find or create a month
    try {
      console.log('Testing month lookup with data:', monthData);
      
      // Query the months table directly
      const { data: existingMonth, error: monthError } = await supabase
        .from('months')
        .select('*')
        .eq('month', monthData.month)
        .eq('year', monthData.year)
        .single();
      
      if (monthError && monthError.code !== 'PGRST116') {
        console.error('❌ Month lookup error:', monthError);
        return false;
      }
      
      if (existingMonth) {
        console.log('✅ Found existing month:', existingMonth);
        testData.month.id = existingMonth.id;
        return true;
      } else {
        console.log('No existing month found, creating a new one');
        
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const newMonth = {
          name: `${monthNames[monthData.month - 1]} ${monthData.year}`,
          month: monthData.month,
          year: monthData.year,
          created_by: testData.editor.id
        };
        
        const { data: createdMonth, error: createError } = await supabase
          .from('months')
          .insert([newMonth])
          .select();
        
        if (createError) {
          console.error('❌ Failed to create month:', createError);
          return false;
        }
        
        console.log('✅ Successfully created month:', createdMonth[0]);
        testData.month.id = createdMonth[0].id;
        return true;
      }
    } catch (err) {
      console.error('❌ Month handling test error:', err);
      return false;
    }
  } catch (err) {
    console.error('❌ Month handling test failed:', err);
    return false;
  }
}

// Test the video creation endpoint directly
async function testVideoCreation() {
  console.log('\n==== TESTING VIDEO CREATION API ====');
  
  try {
    // Create a token for the editor user
    const userToken = createTestToken(testData.editor);
    
    // Create test video data
    const videoData = {
      title: 'API Test Video',
      description: 'Testing the video creation API endpoint',
      client_id: testData.client.id,
      storage_path: 'debug/api-test-video.mp4',
      file_size: 1024,
      content_type: 'video/mp4',
      monthInfo: {
        month: testData.month.month,
        year: testData.month.year
      }
    };
    
    console.log('Sending video creation request with data:', JSON.stringify(videoData, null, 2));
    console.log('Using authentication token for:', testData.editor.name);
    
    // Make the API request
    try {
      const response = await axios.post(`${SERVER_URL}/api/videos`, videoData, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': userToken
        }
      });
      
      console.log('✅ Video creation API success:', response.status);
      console.log('Created video:', response.data);
      return true;
    } catch (err) {
      console.error('❌ Video creation API failed:', err.message);
      
      // Extract detailed error information
      if (err.response) {
        console.error('   Status:', err.response.status);
        console.error('   Status Text:', err.response.statusText);
        console.error('   Data:', JSON.stringify(err.response.data, null, 2));
        
        // Special handling for validation errors
        if (err.response.data && err.response.data.error) {
          console.error('   Error message:', err.response.data.error);
          if (err.response.data.details) {
            console.error('   Error details:', err.response.data.details);
          }
        }
      }
      
      if (err.request) {
        console.error('   No response received');
      }
      
      return false;
    }
  } catch (err) {
    console.error('❌ Video creation test error:', err);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('==== STARTING VIDEO CREATION DEEP DEBUG ====');
  console.log('Test data:', JSON.stringify(testData, null, 2));
  
  // Test 1: Can we connect to the API server?
  const apiConnectionResult = await testApiConnection();
  if (!apiConnectionResult) {
    console.error('\n❌ API CONNECTION FAILED - Cannot proceed with other tests.');
    return;
  }
  
  // Test 2: Can we authenticate?
  const authResult = await testAuthentication();
  if (!authResult) {
    console.error('\n❌ AUTHENTICATION FAILED - Cannot proceed with other tests.');
    return;
  }
  
  // Test 3: Can we access the database directly?
  const dbResult = await checkDirectDatabaseAccess();
  if (!dbResult) {
    console.error('\n❌ DIRECT DATABASE ACCESS FAILED - This suggests database connection or permission issues.');
    return;
  }
  
  // Test 4: Can we handle month information correctly?
  const monthResult = await testMonthHandling();
  if (!monthResult) {
    console.error('\n❌ MONTH HANDLING FAILED - This suggests issues with month processing logic.');
    return;
  }
  
  // Test 5: Can we create a video through the API?
  const videoResult = await testVideoCreation();
  if (!videoResult) {
    console.error('\n❌ VIDEO CREATION API FAILED - This is the specific issue we need to fix.');
    return;
  }
  
  console.log('\n==== ALL TESTS PASSED ====');
  console.log('Video creation pipeline appears to be working correctly!');
}

// Execute all tests
runAllTests()
  .then(() => {
    console.log('\nDeep debug complete');
  })
  .catch(err => {
    console.error('\nUnexpected error in debug script:', err);
  });
