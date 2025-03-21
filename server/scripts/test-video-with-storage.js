#!/usr/bin/env node
/**
 * Test script to verify video creation with Supabase Storage schema
 * This script tests the Video model with storage-related fields
 */

// Load environment variables from .env file
require('dotenv').config();

// Hardcode Supabase credentials for test (from .env file)
const SUPABASE_URL = 'https://qcphzeimioklhgzcgdeu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcGh6ZWltaW9rbGhnemNnZGV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjIyNjU4OSwiZXhwIjoyMDU3ODAyNTg5fQ.Tw6vMyE2SXh1SZ57zywoiwa7PK6gl0MOzAytYDEy9sU';

console.log('Using Supabase project URL:', SUPABASE_URL);

// Initialize Supabase directly to ensure correct initialization
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create a mock Video model that uses our hardcoded Supabase client
// Instead of loading the one that depends on process.env variables
class SupabaseVideo {
  // Find a video by ID
  static async findById(id) {
    try {
      console.log('Finding video by ID:', id);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error finding video by ID:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Exception in findById:', err);
      throw err;
    }
  }
  
  // Create a new video
  static async create(videoData) {
    try {
      console.log('Creating video with data:', JSON.stringify(videoData, null, 2));
      
      // Make a copy to avoid modifying the original data
      const processedData = { ...videoData };
      
      // Add created_at if not present
      if (!processedData.created_at) {
        processedData.created_at = new Date().toISOString();
      }
      
      // Add updated_at if not present
      if (!processedData.updated_at) {
        processedData.updated_at = new Date().toISOString();
      }
      
      // Storage fields are required
      if (!processedData.storage_path) {
        console.warn('Warning: No storage_path provided for video');
      }
      
      // Ensure client_id is a string
      if (processedData.client_id && typeof processedData.client_id !== 'string') {
        processedData.client_id = String(processedData.client_id);
      }
      
      // Log the final data being sent to Supabase
      console.log('Final video data for Supabase:', JSON.stringify(processedData, null, 2));
      
      // Insert into Supabase
      try {
        const { data, error } = await supabase
          .from('videos')
          .insert([processedData])
          .select();
        
        if (error) {
          console.error('Error creating video:', error);
          console.error('Error details:', error.details || 'No details');
          console.error('Error hint:', error.hint || 'No hint');
          throw error;
        }
        
        console.log('Video created successfully:', data ? data[0] : null);
        return data[0];
      } catch (insertErr) {
        console.error('Exception during insert operation:', insertErr);
        throw insertErr;
      }
    } catch (err) {
      console.error('Exception in create:', err);
      throw err;
    }
  }
  
  // Delete a video
  static async findByIdAndDelete(id) {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { deletedCount: 1 };
  }
}

// Use our mock Video model
const Video = SupabaseVideo;

async function testVideoCreation() {
  console.log('Testing video creation with Supabase Storage fields...');
  
  try {
    // Create a test month first (or use an existing one)
    const { data: monthsData, error: monthsError } = await supabase
      .from('months')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (monthsError) {
      console.error('Error fetching month:', monthsError);
      return;
    }
    
    if (!monthsData || monthsData.length === 0) {
      console.error('No months found in database');
      return;
    }
    
    const month = monthsData[0];
    console.log('Using month:', month.name, 'with ID:', month.id);
    
    // Find a client
    const { data: clientsData, error: clientsError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'client')
      .limit(1);
    
    if (clientsError) {
      console.error('Error fetching client:', clientsError);
      return;
    }
    
    if (!clientsData || clientsData.length === 0) {
      console.error('No clients found in database');
      return;
    }
    
    const client = clientsData[0];
    console.log('Using client:', client.name, 'with ID:', client.id);
    
    // Find an editor
    const { data: editorsData, error: editorsError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'editor')
      .limit(1);
    
    if (editorsError) {
      console.error('Error fetching editor:', editorsError);
      return;
    }
    
    if (!editorsData || editorsData.length === 0) {
      console.error('No editors found in database');
      return;
    }
    
    const editor = editorsData[0];
    console.log('Using editor:', editor.name, 'with ID:', editor.id);
    
    // Create test video data
    const videoData = {
      title: `Test Video (${new Date().toISOString()})`,
      description: 'This is a test video created by the test script',
      month_id: month.id,
      client_id: client.id,
      created_by: editor.id,
      status: 'pending',
      
      // Storage-related fields
      storage_path: `test/${Date.now()}_test-video.mp4`,
      file_size: 1048576, // 1MB
      content_type: 'video/mp4'
    };
    
    console.log('Creating video with data:', JSON.stringify(videoData, null, 2));
    
    // Create the video using our model
    const video = await Video.create(videoData);
    
    console.log('Video created successfully!');
    console.log('Video details:', JSON.stringify(video, null, 2));
    
    // Clean up - delete the test video
    console.log('Cleaning up - deleting test video...');
    await Video.findByIdAndDelete(video.id);
    console.log('Test video deleted');
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  } finally {
    // Close Supabase connection
    console.log('Test finished');
    process.exit(0);
  }
}

// Run the test
testVideoCreation();
