/**
 * Script to execute the SQL migration to update the videos table schema
 * This script makes the Dropbox fields nullable and adds default values
 * to support the transition from Dropbox to Supabase Storage
 */

const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');

async function executeSchemaUpdate() {
  try {
    console.log('Reading SQL migration file...');
    const sqlFilePath = path.join(__dirname, 'update-videos-schema-for-storage.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('SQL content loaded successfully.');
    console.log('Executing SQL migration to update videos schema for Supabase Storage...');
    
    // Execute the SQL directly using Supabase's rpc call
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('Error executing SQL:', error);
      console.error('Details:', error.details || 'No details provided');
      
      if (error.message && error.message.includes('permission denied')) {
        console.log('\nYou may need elevated permissions to execute schema changes.');
        console.log('Please run this SQL in the Supabase SQL Editor with admin privileges.');
        console.log('SQL file location:', sqlFilePath);
      }
      
      process.exit(1);
    }
    
    console.log('Schema update executed successfully!');
    console.log('Result:', data);
    
    // Verify that the changes were applied
    console.log('\nVerifying schema changes...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('videos')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error verifying schema changes:', tableError);
    } else {
      console.log('Able to query videos table - no errors');
      
      // Check table structure to confirm changes
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_ddl', { table_name: 'videos' });
      
      if (columnsError) {
        console.error('Error getting table structure:', columnsError);
      } else if (columns) {
        console.log('Table DDL:', columns);
        console.log('Schema update verification complete!');
      }
    }
    
  } catch (err) {
    console.error('Unexpected error during schema update:', err);
    process.exit(1);
  }
}

// Execute the migration
executeSchemaUpdate()
  .then(() => {
    console.log('Schema update process completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Schema update process failed:', err);
    process.exit(1);
  });
