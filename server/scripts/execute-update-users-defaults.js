const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client with admin privileges for direct SQL execution
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  try {
    console.log('Initializing client profile fields for existing users...');
    
    // Execute direct SQL to update all fields at once
    const { data, error } = await supabase.rpc('exec', { 
      query: `
        -- Set default empty array for keywords for all users
        UPDATE users 
        SET keywords = '[]'::jsonb
        WHERE keywords IS NULL;
        
        -- Set empty string for website_url where it doesn't exist
        UPDATE users 
        SET website_url = ''
        WHERE website_url IS NULL;
        
        -- Set empty string for location where it doesn't exist
        UPDATE users 
        SET location = ''
        WHERE location IS NULL;
        
        -- Return user count for confirmation
        SELECT COUNT(*) as updated_users FROM users;
      `
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      throw error;
    }
    
    console.log('Successfully updated user defaults:', data);
    
    // Verify a sample user
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, website_url, keywords, location')
      .limit(3);
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }
    
    console.log('Sample users:');
    users.forEach(user => {
      console.log(`- User: ${user.name} (${user.email})`);
      console.log(`  website_url: ${user.website_url || 'empty'}`);
      console.log(`  keywords: ${JSON.stringify(user.keywords || [])}`);
      console.log(`  location: ${user.location || 'empty'}`);
    });
    
    console.log('Successfully initialized client profile fields!');
  } catch (err) {
    console.error('Error during initialization:', err);
  }
}

executeMigration();
