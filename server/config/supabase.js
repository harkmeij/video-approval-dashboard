const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Make sure we're loading the .env file from the correct location
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase client with required environment variables
const SUPABASE_URL = process.env.PROJECT_URL;
const SUPABASE_KEY = process.env.SUPABASE_API_KEY;

// Verify that environment variables are properly loaded
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Required Supabase environment variables are not set!');
  console.error('Please make sure PROJECT_URL and SUPABASE_API_KEY are defined in your .env file');
  // Don't exit here as it would break importing this module
  // Instead, we'll let operations fail more gracefully
}

console.log('Supabase Configuration:');
console.log('- URL:', SUPABASE_URL);
console.log('- API Key:', SUPABASE_KEY ? '**Present**' : '**Missing**');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
