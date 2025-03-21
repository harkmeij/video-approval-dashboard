#!/usr/bin/env node
/**
 * Debug script to check database directly
 * This helps identify issues with database access and permissions
 */

// Hardcode Supabase credentials for test
const SUPABASE_URL = 'https://qcphzeimioklhgzcgdeu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcGh6ZWltaW9rbGhnemNnZGV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjIyNjU4OSwiZXhwIjoyMDU3ODAyNTg5fQ.Tw6vMyE2SXh1SZ57zywoiwa7PK6gl0MOzAytYDEy9sU';

console.log('Using Supabase project URL:', SUPABASE_URL);

// Initialize Supabase directly
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Check database tables and permissions
async function checkDatabase() {
  try {
    console.log('==== CHECKING DATABASE TABLES AND PERMISSIONS ====');
    
    // 1. Check if videos table exists
    console.log('\n--- Checking videos table ---');
    const { data: tableInfo, error: tableError } = await supabase
      .from('videos')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accessing videos table:', tableError);
    } else {
      console.log('✅ Videos table exists and is accessible');
    }
    
    // 2. Check permissions by attempting an insert
    console.log('\n--- Testing insert permissions ---');
    const testVideo = {
      title: 'DB Permission Test Video',
      description: 'This is a test video for checking DB permissions',
      // We need these fields for the insertion to work:
      client_id: '6ea593b6-dfb9-4a6e-937e-a3ca78a40ef9', // Use an existing client ID
      created_by: '09a4f1d6-66a3-49e7-98d1-eb78de72f92a', // Editor ID
      month_id: '5813fea6-ad87-4d79-bdb5-449a77d507cf', // Month ID
      storage_path: 'debug/test-permissions.mp4',
      file_size: 1024,
      content_type: 'video/mp4',
      status: 'pending'
    };
    
    // Try a direct insert via Supabase
    const { data: insertData, error: insertError } = await supabase
      .from('videos')
      .insert([testVideo])
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting test record:', insertError);
      
      // Check if there are specific constraints or permissions issues
      if (insertError.code === '23503') {
        console.log('This appears to be a foreign key constraint error');
        console.log('Details:', insertError.details);
      } else if (insertError.code === '42501') {
        console.log('This appears to be a permissions error');
        console.log('Details:', insertError.details);
      }
    } else {
      console.log('✅ Successfully inserted test record:', insertData[0].id);
      
      // If we succeeded, clean up the test record
      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteError) {
        console.error('Warning: Could not delete test record:', deleteError);
      } else {
        console.log('✅ Successfully deleted test record');
      }
    }
    
    // 3. Check schema to confirm required fields
    console.log('\n--- Checking videos table schema ---');
    try {
      // This is a raw SQL query to get column info
      const { data: columns, error: schemaError } = await supabase
        .rpc('get_videos_schema');
        
      if (schemaError) {
        console.error('❌ Error fetching schema:', schemaError);
        
        // Try an alternative approach with a direct query
        console.log('Trying alternative schema query...');
        const { data: info, error: infoError } = await supabase.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'videos'
          ORDER BY ordinal_position;
        `);
        
        if (infoError) {
          console.error('❌ Alternative schema query failed:', infoError);
        } else {
          console.table(info);
        }
      } else {
        console.log('Videos table schema:');
        console.table(columns);
      }
    } catch (e) {
      console.error('❌ Exception checking schema:', e);
      
      // One more try with a simpler query
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .limit(1);
        
        if (error) {
          console.error('❌ Error fetching sample record:', error);
        } else if (data && data.length > 0) {
          console.log('Sample record structure:');
          console.log(JSON.stringify(data[0], null, 2));
        } else {
          console.log('No records found to inspect structure');
        }
      } catch (err) {
        console.error('❌ Final attempt to check structure failed:', err);
      }
    }
    
    // 4. Check months table
    console.log('\n--- Checking months table ---');
    const { data: monthsData, error: monthsError } = await supabase
      .from('months')
      .select('id, name, month, year')
      .limit(5);
    
    if (monthsError) {
      console.error('❌ Error accessing months table:', monthsError);
    } else {
      console.log('✅ Months table accessible, sample records:');
      console.table(monthsData);
    }
    
    // 5. Try the exact query the ClientPage is making
    console.log('\n--- Simulating actual client request ---');
    const simulatedMonthQuery = {
      month: 3,
      year: 2025
    };
    
    const { data: monthMatch, error: monthMatchError } = await supabase
      .from('months')
      .select('*')
      .eq('month', simulatedMonthQuery.month)
      .eq('year', simulatedMonthQuery.year)
      .single();
    
    if (monthMatchError) {
      console.error('❌ Error finding month:', monthMatchError);
    } else {
      console.log('✅ Found matching month:', monthMatch);
      
      // Now try to create a video with this month ID
      const testClientVideo = {
        title: 'Simulated Client Video',
        description: 'Created by database check script',
        client_id: '6ea593b6-dfb9-4a6e-937e-a3ca78a40ef9',
        created_by: '09a4f1d6-66a3-49e7-98d1-eb78de72f92a',
        month_id: monthMatch.id,
        storage_path: 'debug/client-simulation.mp4',
        file_size: 1024,
        content_type: 'video/mp4',
        status: 'pending'
      };
      
      const { data: clientInsert, error: clientInsertError } = await supabase
        .from('videos')
        .insert([testClientVideo])
        .select();
      
      if (clientInsertError) {
        console.error('❌ Error inserting simulated client video:', clientInsertError);
      } else {
        console.log('✅ Successfully inserted simulated client video:', clientInsert[0].id);
        
        // Clean up
        const { error: cleanupError } = await supabase
          .from('videos')
          .delete()
          .eq('id', clientInsert[0].id);
        
        if (cleanupError) {
          console.warn('Warning: Could not cleanup test record:', cleanupError);
        } else {
          console.log('✅ Test record cleaned up');
        }
      }
    }
    
    console.log('\n==== DATABASE CHECK COMPLETE ====');
  } catch (err) {
    console.error('Error during database check:', err);
  }
}

// Execute the database check
checkDatabase()
  .then(() => {
    console.log('Database check completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error in database check:', err);
    process.exit(1);
  });
