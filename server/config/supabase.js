const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Make sure we're loading the .env file from the correct location
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Supabase client with fallback values
const SUPABASE_URL = process.env.PROJECT_URL || 'https://qcphzeimioklhgzcgdeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcGh6ZWltaW9rbGhnemNnZGV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjIyNjU4OSwiZXhwIjoyMDU3ODAyNTg5fQ.Tw6vMyE2SXh1SZ57zywoiwa7PK6gl0MOzAytYDEy9sU';

console.log('Supabase Configuration:');
console.log('- URL:', SUPABASE_URL);
console.log('- API Key:', SUPABASE_KEY ? '**Present**' : '**Missing**');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
