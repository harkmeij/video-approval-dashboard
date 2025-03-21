const supabase = require('../config/supabase');
const { hashPassword } = require('../utils/passwordUtils');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Admin user details
const adminUser = {
  email: 'mark@betterview.nl',
  name: 'Admin User',
  role: 'editor',
  active: true
};

// Create admin user in the users table
async function createUserInUsersTable() {
  try {
    console.log('Creating admin user in the users table...');
    
    // Get password from command line or use default
    const password = process.argv[2] || 'admin123';
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // First, check if the users table exists
    try {
      console.log('Checking if users table exists...');
      
      const { data: tableData, error: tableError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.log('Error checking users table:', tableError.message);
        console.log('The users table might not exist. Please create it using the Supabase dashboard.');
        return;
      }
      
      console.log('Users table exists');
      
      // Check if user already exists
      console.log('Checking if admin user already exists...');
      
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', adminUser.email)
        .limit(1);
      
      if (checkError) {
        console.log('Error checking if user exists:', checkError.message);
        return;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.log('Admin user already exists in the users table');
        
        // Update the user
        console.log('Updating admin user...');
        
        const { error: updateError } = await supabase
          .from('users')
          .update({
            password: hashedPassword,
            active: true
          })
          .eq('email', adminUser.email);
        
        if (updateError) {
          console.log('Error updating admin user:', updateError.message);
        } else {
          console.log('Admin user updated successfully');
          console.log('Email:', adminUser.email);
          console.log('Password:', password);
        }
      } else {
        // Create the user
        console.log('Creating admin user...');
        
        const { error: createError } = await supabase
          .from('users')
          .insert([
            {
              ...adminUser,
              password: hashedPassword
            }
          ]);
        
        if (createError) {
          console.log('Error creating admin user:', createError.message);
        } else {
          console.log('Admin user created successfully in the users table');
          console.log('Email:', adminUser.email);
          console.log('Password:', password);
        }
      }
    } catch (err) {
      console.log('Error:', err.message);
    }
  } catch (err) {
    console.error('Error in user creation process:', err);
  }
}

// Run the function
createUserInUsersTable();
