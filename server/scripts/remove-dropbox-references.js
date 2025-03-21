/**
 * Script to completely remove Dropbox references from the codebase and database
 * This is a comprehensive script that:
 * 1. Runs the SQL migration to update the videos table schema (removing Dropbox fields)
 * 2. Lists any remaining Dropbox references in the codebase that should be manually removed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const supabase = require('../config/supabase');

// Function to run SQL migration
async function runDatabaseMigration() {
  console.log('➡️ STEP 1: Creating clean videos table for Supabase Storage...');
  
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'update-videos-schema-for-storage.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('SQL migration loaded successfully.');
    console.log('Summary of changes:');
    console.log('- Dropping existing videos table (no data to preserve)');
    console.log('- Creating fresh videos table with only Supabase Storage fields');
    console.log('- Creating indexes and RLS policies');
    
    // Execute SQL with Supabase
    console.log('\nExecuting SQL migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('Error executing SQL migration:', error);
      console.error('\n⚠️ WARNING: Database schema not updated!');
      
      if (error.message && error.message.includes('permission denied')) {
        console.log('\n📋 INSTRUCTIONS:');
        console.log('You need to run this SQL in the Supabase Dashboard SQL Editor with admin privileges:');
        console.log('1. Log in to your Supabase project');
        console.log('2. Go to SQL Editor');
        console.log('3. Create a new query');
        console.log('4. Copy the SQL from this file: ' + sqlPath);
        console.log('5. Run the query');
      }
      
    } else {
      console.log('✅ Database schema updated successfully!');
    }
  } catch (err) {
    console.error('Error in database migration:', err);
  }
}

// Function to find remaining Dropbox references in code
function findDropboxReferences() {
  console.log('\n➡️ STEP 2: Finding remaining Dropbox references in code...');
  
  try {
    // Use grep to find Dropbox references in the codebase
    const grepCommand = 'grep -r "dropbox\\|Dropbox" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" ../client/src ../server/models ../server/routes';
    
    try {
      const grepResult = execSync(grepCommand, { encoding: 'utf8' });
      
      console.log('\n⚠️ Dropbox references still found in these files:');
      console.log(grepResult);
      console.log('\nManually review and update these files to complete the migration.');
      
    } catch (grepError) {
      if (grepError.status === 1) {
        // grep returns status 1 when no matches are found
        console.log('✅ No Dropbox references found in the codebase!');
      } else {
        console.error('Error running grep:', grepError);
      }
    }
  } catch (err) {
    console.error('Error finding Dropbox references:', err);
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Dropbox removal migration...');
  
  // Run database migration
  await runDatabaseMigration();
  
  // Find remaining Dropbox references
  findDropboxReferences();
  
  console.log('\n✨ Migration process completed!');
  console.log('Next steps:');
  console.log('1. Update any remaining code references to Dropbox');
  console.log('2. Test the application thoroughly');
  console.log('3. Remove any remaining Dropbox API keys from .env files');
}

// Run the script
main()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Migration failed:', err))
  .finally(() => process.exit());
