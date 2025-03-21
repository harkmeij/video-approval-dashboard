require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'add-resolved-to-comments.sql');
const sqlQueries = fs.readFileSync(sqlFilePath, 'utf8');

async function executeQueries() {
  try {
    console.log('Starting migration to add resolved field to comments...');
    
    // Execute the SQL queries
    const { error } = await supabase.rpc('pgmigration', { query: sqlQueries });
    
    if (error) {
      console.error('Error executing migration:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully! The resolved field has been added to the comments table.');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

executeQueries();
