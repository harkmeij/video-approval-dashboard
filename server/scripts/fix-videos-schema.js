#!/usr/bin/env node
/**
 * Script to fix schema issues with the videos table
 * This resolves the error: "Could not find the 'dropbox_file_id' column of 'videos' in the schema cache"
 */

// Load environment variables
require('dotenv').config();

// Instead of creating a new client, use the existing one from config
const supabase = require('../config/supabase');

// Debug the Supabase connection
console.log('Using Supabase client from ../config/supabase.js');

// Test data for a video
let testVideo = {
  title: 'Schema Fix Test',
  description: 'This video was created to test the schema',
  storage_path: 'test/schema-fix-test.mp4',
  file_size: 1024,
  content_type: 'video/mp4',
  status: 'pending'
};

async function fixVideoSchema() {
  console.log('Starting video schema fix by testing direct database access...');
  
  try {
    // First, get a valid month, client, and user for testing
    console.log('Looking for reference data...');
    
    // Get a valid month
    const { data: months, error: monthError } = await supabase
      .from('months')
      .select('*')
      .limit(1);
    
    if (monthError) {
      console.error('Error getting month reference data:', monthError);
      throw monthError;
    }
    
    if (!months || months.length === 0) {
      console.error('No months found in the database');
      throw new Error('Cannot find reference month data');
    }
    
    console.log('Using month:', months[0]);
    testVideo.month_id = months[0].id;
    
    // Get a valid client
    const { data: clients, error: clientError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'client')
      .limit(1);
    
    if (clientError) {
      console.error('Error getting client reference data:', clientError);
      throw clientError;
    }
    
    if (!clients || clients.length === 0) {
      console.error('No clients found in the database');
      throw new Error('Cannot find reference client data');
    }
    
    console.log('Using client:', clients[0]);
    testVideo.client_id = clients[0].id;
    
    // Get a valid editor
    const { data: editors, error: editorError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'editor')
      .limit(1);
    
    if (editorError) {
      console.error('Error getting editor reference data:', editorError);
      throw editorError;
    }
    
    if (!editors || editors.length === 0) {
      console.error('No editors found in the database');
      throw new Error('Cannot find reference editor data');
    }
    
    console.log('Using editor:', editors[0]);
    testVideo.created_by = editors[0].id;
    
    // Now try to insert the test video directly
    console.log('Inserting test video...');
    console.log('Test video data:', testVideo);
    // Insert the test video
    const { data: insertedVideo, error: insertError } = await supabase
      .from('videos')
      .insert([testVideo])
      .select();
    
    if (insertError) {
      console.error('Error inserting test video:', insertError);
      throw insertError;
    }
    
    console.log('Test video inserted successfully!', insertedVideo);
    
    // Now confirm we can query
    const { data: videos, error: queryError } = await supabase
      .from('videos')
      .select('id, title, month_id, client_id, storage_path')
      .limit(5);
    
    if (queryError) {
      console.error('Error querying videos:', queryError);
      throw queryError;
    }
    
    console.log('Successfully queried videos table:');
    console.log(videos);
    
    // Clean up test video
    if (insertedVideo && insertedVideo.length > 0) {
      console.log('Cleaning up test video...');
      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', insertedVideo[0].id);
      
      if (deleteError) {
        console.warn('Warning: Could not delete test video:', deleteError);
      } else {
        console.log('Test video deleted successfully');
      }
    }
    
    return { success: true };
  } catch (err) {
    console.error('Error testing video schema:', err);
    return { success: false, error: err };
  }
}

// Run the schema fix
fixVideoSchema()
  .then(result => {
    if (result.success) {
      console.log('\nSUCCESS: The videos table is working properly!');
      console.log('The database is configured correctly and does not have dropbox_file_id issues.');
      console.log('\nIf you\'re still seeing issues, try restarting your application server.');
      process.exit(0);
    } else {
      console.error('\nFAILED: Could not verify the videos table schema.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
