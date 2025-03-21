const supabase = require('../config/supabase');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Test sign in
async function testSignIn() {
  try {
    console.log('Testing sign in with admin user...');
    
    // Get email and password from command line or use default
    const email = process.argv[2] || 'mark@betterview.nl';
    let password = process.argv[3] || 'admin';
    
    // Ensure password is at least 6 characters by padding if necessary
    const originalPassword = password;
    if (password.length < 6) {
      password = password.padEnd(6, '0'); // Pad with zeros to reach 6 characters
      console.log(`Password "${originalPassword}" is too short. Padded to "${password}" to meet minimum length requirement.`);
    }
    
    console.log(`Attempting to sign in with email: ${email} and password: ${password}`);
    
    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.log('Error signing in:', signInError.message);
      
      // Try with admin123 password
      console.log('Trying with default password: admin123');
      
      const { data: defaultSignInData, error: defaultSignInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'admin123'
      });
      
      if (defaultSignInError) {
        console.log('Error signing in with default password:', defaultSignInError.message);
      } else {
        console.log('Sign in successful with default password!');
        console.log('User:', defaultSignInData.user);
        console.log('Session:', defaultSignInData.session);
      }
    } else {
      console.log('Sign in successful!');
      console.log('User:', signInData.user);
      console.log('Session:', signInData.session);
    }
  } catch (err) {
    console.error('Error in sign in process:', err);
  }
}

// Run the function
testSignIn();
