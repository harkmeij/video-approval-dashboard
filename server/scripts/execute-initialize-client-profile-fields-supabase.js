const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const supabase = require('../config/supabase');

async function executeMigration() {
  try {
    console.log('Initializing client profile fields for existing users...');
    
    // Step 1: Set default empty array for keywords
    console.log('Setting default empty array for keywords...');
    const { data: keywordsData, error: keywordsError } = await supabase.rpc('set_default_keywords');
    
    if (keywordsError) {
      // If RPC doesn't exist, try direct SQL
      console.log('RPC not found, trying direct SQL...');
      const { data, error } = await supabase.from('users')
        .update({ keywords: [] })
        .is('keywords', null);
      
      if (error) throw error;
      console.log('Updated keywords using direct SQL');
    } else {
      console.log('Updated keywords using RPC function');
    }
    
    // Step 2: Set NULL for website_url if not exists
    console.log('Setting NULL for website_url where needed...');
    const { error: websiteError } = await supabase.from('users')
      .update({ website_url: null })
      .is('website_url', null);
    
    if (websiteError) throw websiteError;
    
    // Step 3: Set NULL for location if not exists
    console.log('Setting NULL for location where needed...');
    const { error: locationError } = await supabase.from('users')
      .update({ location: null })
      .is('location', null);
    
    if (locationError) throw locationError;
    
    // Step 4: Check types of a sample record
    console.log('Validating field types...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, website_url, keywords, location')
      .limit(1);
    
    if (usersError) throw usersError;
    
    if (users && users.length > 0) {
      const user = users[0];
      console.log('Sample user:');
      console.log('- Name:', user.name);
      console.log('- website_url type:', typeof user.website_url);
      console.log('- keywords type:', Array.isArray(user.keywords) ? 'array' : typeof user.keywords);
      console.log('- location type:', typeof user.location);
    }
    
    console.log('Successfully initialized client profile fields!');
  } catch (err) {
    console.error('Error during initialization:', err);
  }
}

executeMigration();
