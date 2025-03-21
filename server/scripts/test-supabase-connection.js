require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('Environment variables:');
console.log('PROJECT_URL:', process.env.PROJECT_URL);
console.log('SUPABASE_API_KEY:', process.env.SUPABASE_API_KEY ? 'Defined (not showing for security)' : 'NOT DEFINED');

try {
  console.log('Creating Supabase client...');
  const supabase = createClient(
    process.env.PROJECT_URL,
    process.env.SUPABASE_API_KEY
  );
  
  console.log('Supabase client created successfully');
  console.log('Testing connection by getting session...');
  
  // Test the connection
  supabase.auth.getSession()
    .then(() => {
      console.log('Supabase connection successful!');
    })
    .catch(err => {
      console.error('Supabase connection error:', err);
    });
} catch (err) {
  console.error('Error creating Supabase client:', err);
}
