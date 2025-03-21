#!/usr/bin/env node

// This script updates all users to ensure they have valid values for the new profile fields
require('dotenv').config();
const supabase = require('../config/supabase');

async function updateUserFields() {
  console.log('Updating user fields with default values...');
  
  try {
    // First verify the current state of users
    const { data: beforeUsers, error: beforeError } = await supabase
      .from('users')
      .select('id, name, email, website_url, keywords, location')
      .limit(5);
    
    if (beforeError) {
      console.error('Error checking users:', beforeError);
      return;
    }
    
    console.log('Current user state (sample):');
    beforeUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  website_url: ${user.website_url === null ? 'NULL' : `"${user.website_url}"`}`);
      console.log(`  keywords: ${user.keywords === null ? 'NULL' : Array.isArray(user.keywords) ? JSON.stringify(user.keywords) : `"${user.keywords}"`}`);
      console.log(`  location: ${user.location === null ? 'NULL' : `"${user.location}"`}`);
    });
    
    // Update users with missing fields
    console.log('\nUpdating users with missing fields...');
    
    // 1. Set empty string for website_url if null
    const { data: websiteData, error: websiteError } = await supabase
      .from('users')
      .update({ website_url: '' })
      .is('website_url', null);
    
    if (websiteError) {
      console.error('Error updating website_url:', websiteError);
    } else {
      console.log('✓ website_url fields updated');
    }
    
    // 2. Set empty string for location if null
    const { data: locationData, error: locationError } = await supabase
      .from('users')
      .update({ location: '' })
      .is('location', null);
    
    if (locationError) {
      console.error('Error updating location:', locationError);
    } else {
      console.log('✓ location fields updated');
    }
    
    // 3. Set empty array for keywords if null 
    const { data: keywordsData, error: keywordsError } = await supabase
      .from('users')
      .update({ keywords: [] })
      .is('keywords', null);
    
    if (keywordsError) {
      console.error('Error updating keywords:', keywordsError);
    } else {
      console.log('✓ keywords fields updated');
    }
    
    // Verify the updates
    const { data: afterUsers, error: afterError } = await supabase
      .from('users')
      .select('id, name, email, website_url, keywords, location')
      .limit(5);
    
    if (afterError) {
      console.error('Error checking users after update:', afterError);
      return;
    }
    
    console.log('\nUser state after updates (sample):');
    afterUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
      console.log(`  website_url: ${user.website_url === null ? 'NULL' : `"${user.website_url}"`}`);
      console.log(`  keywords: ${user.keywords === null ? 'NULL' : Array.isArray(user.keywords) ? JSON.stringify(user.keywords) : `"${user.keywords}"`}`);
      console.log(`  location: ${user.location === null ? 'NULL' : `"${user.location}"`}`);
    });
    
    console.log('\nUser field update complete!');
  } catch (error) {
    console.error('Error updating user fields:', error);
  }
}

updateUserFields();
