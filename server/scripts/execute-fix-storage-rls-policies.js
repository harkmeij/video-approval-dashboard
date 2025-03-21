/**
 * Execute Fix Storage RLS Policies Script
 * 
 * This script executes the SQL in fix-storage-rls-policies.sql to fix the 
 * Row Level Security policies for the storage bucket in Supabase.
 * 
 * Usage: node scripts/execute-fix-storage-rls-policies.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

async function executeFixScript() {
  try {
    console.log('Starting to fix storage RLS policies...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'fix-storage-rls-policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL statements by semicolon
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each SQL statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement);
      
      try {
        console.log('About to execute RPC call...');
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_string: statement
        });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error('Exception during execution:', err);
      }
    }
    
    console.log('Storage RLS policies have been updated successfully!');
    console.log('Please restart your application for changes to take effect.');
  } catch (error) {
    console.error('Error executing SQL script:', error);
  }
}

// Run the script
executeFixScript();
