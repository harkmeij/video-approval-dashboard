#!/usr/bin/env node
/**
 * This script executes the SQL migration to make Dropbox fields nullable
 * allowing videos to be created without Dropbox reference fields.
 */

// Load environment variables
require('dotenv').config();

// Get the SQL migration file content
const fs = require('fs');
const path = require('path');
const sqlFilePath = path.join(__dirname, 'update-dropbox-fields-nullable.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Initialize Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.PROJECT_URL,
  process.env.SUPABASE_API_KEY
);

async function executeMigration() {
  console.log('Starting migration to make Dropbox fields nullable...');
  console.log('This will allow videos to be created without Dropbox references');
  
  try {
    // Execute the SQL query directly
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error('Error executing SQL migration:', error);
      
      // Attempt to execute SQL using direct query as fallback
      console.log('Attempting fallback method...');
      const { error: fallbackError } = await supabase.sql(sql);
      
      if (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        process.exit(1);
      } else {
        console.log('Migration succeeded with fallback method');
        process.exit(0);
      }
    } else {
      console.log('Migration executed successfully!');
      console.log('Dropbox fields (dropbox_link, dropbox_file_id) are now nullable');
      console.log('You can now create videos without Dropbox references');
      process.exit(0);
    }
  } catch (err) {
    console.error('Exception during migration execution:', err);
    process.exit(1);
  }
}

// Execute the migration
executeMigration();
