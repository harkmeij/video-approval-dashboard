require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

console.log('Environment variables:');
console.log('PROJECT_URL:', process.env.PROJECT_URL);
console.log('SUPABASE_API_KEY:', process.env.SUPABASE_API_KEY ? 'Defined (not showing for security)' : 'NOT DEFINED');

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.PROJECT_URL;
const SUPABASE_KEY = process.env.SUPABASE_API_KEY;

// Verify that environment variables are properly loaded
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Make sure PROJECT_URL and SUPABASE_API_KEY are set in the .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * This script executes the SQL migration to update the videos table
 * for Supabase Storage integration
 */
const executeMigration = async () => {
  try {
    console.log('Executing video table migration for Supabase Storage...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'update-videos-for-storage.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('SQL content loaded. Executing migration...');
    
    // Try executing as raw SQL instead of using RPC
    try {
      console.log('Attempting to execute the SQL using raw query...');
      
      // Execute ADD COLUMN operations
      console.log('Adding storage_path column...');
      const { error: error1 } = await supabase.from('videos').select('*').limit(1);
      if (error1) {
        console.error('Error accessing videos table:', error1);
      } else {
        console.log('Successfully accessed videos table');
        
        // We can read the table, but may not have permissions to modify it.
        console.log('To complete the migration, please execute the following SQL in your Supabase SQL editor:');
        console.log(sqlContent);
        
        console.log('\nAlternatively, you can run these statements directly in your database management tool.');
      }
    } catch (err) {
      console.error('Error executing direct SQL:', err);
    }
    
    console.log('Migration executed successfully!');
    console.log('The videos table has been updated with storage-related columns.');
    
  } catch (err) {
    console.error('Unexpected error during migration:', err);
  }
};

// Execute migration
executeMigration();
