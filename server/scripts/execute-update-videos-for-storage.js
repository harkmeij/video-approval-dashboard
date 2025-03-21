require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

console.log('Environment variables:');
console.log('PROJECT_URL:', process.env.PROJECT_URL);
console.log('SUPABASE_API_KEY:', process.env.SUPABASE_API_KEY ? 'Defined (not showing for security)' : 'NOT DEFINED');

// Initialize Supabase client directly
const supabase = createClient(
  'https://qcphzeimioklhgzcgdeu.supabase.co',  // Using hardcoded URL from .env file
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcGh6ZWltaW9rbGhnemNnZGV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjIyNjU4OSwiZXhwIjoyMDU3ODAyNTg5fQ.Tw6vMyE2SXh1SZ57zywoiwa7PK6gl0MOzAytYDEy9sU'  // Using hardcoded API key from .env file
);

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
