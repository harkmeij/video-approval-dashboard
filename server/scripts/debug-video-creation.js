#!/usr/bin/env node
/**
 * Debug script to diagnose issues with video creation
 */

// Hardcode Supabase credentials for test
const SUPABASE_URL = 'https://qcphzeimioklhgzcgdeu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcGh6ZWltaW9rbGhnemNnZGV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjIyNjU4OSwiZXhwIjoyMDU3ODAyNTg5fQ.Tw6vMyE2SXh1SZ57zywoiwa7PK6gl0MOzAytYDEy9sU';

console.log('Using Supabase project URL:', SUPABASE_URL);

// Initialize Supabase directly
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create a custom Video model that uses our hardcoded Supabase client
class SupabaseVideo {
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
      
      // Log the final data being sent to Supabase
      console.log('Final video data for Supabase:', JSON.stringify(processedData, null, 2));
      
      try {
        // Step 1: Check if month exists (or create it)
        console.log('Getting/creating month...');

        // Get or create month first
        if (processedData.monthInfo && processedData.monthInfo.month && processedData.monthInfo.year) {
          const { data: monthData, error: monthError } = await supabase
            .from('months')
            .select('*')
            .eq('month', processedData.monthInfo.month)
            .eq('year', processedData.monthInfo.year)
            .single();
          
          if (monthError && monthError.code !== 'PGRST116') {
            console.error('Error checking for month:', monthError);
            throw monthError;
          }
          
          if (!monthData) {
            console.log('Month not found, creating it...');
            
            const monthNames = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            
            const newMonth = {
              name: `${monthNames[processedData.monthInfo.month - 1]} ${processedData.monthInfo.year}`,
              month: processedData.monthInfo.month,
              year: processedData.monthInfo.year,
              created_by: processedData.created_by
            };
            
            const { data: createdMonth, error: createMonthError } = await supabase
              .from('months')
              .insert([newMonth])
              .select();
            
            if (createMonthError) {
              console.error('Error creating month:', createMonthError);
              throw createMonthError;
            }
            
            processedData.month_id = createdMonth[0].id;
            console.log('Created month with ID:', processedData.month_id);
          } else {
            processedData.month_id = monthData.id;
            console.log('Found existing month with ID:', processedData.month_id);
          }
          
          // Remove monthInfo from the data to avoid conflicts
          delete processedData.monthInfo;
        }
        
        // Step 2: Insert the video
        console.log('Inserting video with final data:', JSON.stringify(processedData, null, 2));
        
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
        
        console.log('Video created successfully:', data[0]);
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
}

async function debugVideoCreation() {
  console.log('Starting debug script for video creation...');
  
  try {
    // Step 1: Find client data
    console.log('Fetching client data...');
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
    
    // Step 2: Find editor data
    console.log('Fetching editor data...');
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
    
    // Step 3: Create video data
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    const videoData = {
      title: `Debug Test Video (${now.toISOString()})`,
      description: 'This is a test video created by the debug script',
      client_id: client.id,
      created_by: editor.id,
      status: 'pending',
      
      // Important: Include month information for processing
      monthInfo: {
        month: currentMonth,
        year: currentYear
      },
      
      // Storage-related fields
      storage_path: `clients/${client.id}/${currentMonth}-${currentYear}/debug_test_${Date.now()}.mp4`,
      file_size: 1048576, // 1MB (dummy size)
      content_type: 'video/mp4'
    };
    
    console.log('Creating video with data:', JSON.stringify(videoData, null, 2));
    
    // Step 4: Attempt to create the video
    const video = await SupabaseVideo.create(videoData);
    
    console.log('SUCCESS: Video created successfully:', JSON.stringify(video, null, 2));
    console.log('Video ID:', video.id);
    
    // Step 5: Cleanup - delete the test video
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('id', video.id);
    
    if (deleteError) {
      console.error('Error deleting test video:', deleteError);
    } else {
      console.log('Test video deleted successfully');
    }
    
    console.log('Debug completed successfully!');
  } catch (error) {
    console.error('ERROR: Video creation failed:', error);
    console.error('Debug script encountered an error');
  } finally {
    process.exit(0);
  }
}

// Run the debug function
debugVideoCreation();
