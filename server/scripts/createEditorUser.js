require('dotenv').config();
const supabase = require('../config/supabase');
const { hashPassword } = require('../utils/passwordUtils');

// Editor user data
const editorData = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123', // Simple password for testing
  role: 'editor'
};

// Function to create an editor user
async function createEditorUser() {
  try {
    console.log(`Creating editor user: ${editorData.name} (${editorData.email})`);
    
    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', editorData.email)
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing user:', checkError);
      throw checkError;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log(`User ${editorData.email} already exists, skipping...`);
      return null;
    }
    
    // Create new user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: editorData.email,
      password: editorData.password,
      email_confirm: true,
      user_metadata: {
        name: editorData.name,
        role: editorData.role
      }
    });
    
    if (authError) {
      console.error('Supabase Auth error:', authError);
      throw authError;
    }
    
    // Hash the password for our users table
    const hashedPassword = await hashPassword(editorData.password);
    
    // Create new user in users table
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          id: authUser.user.id,
          email: editorData.email,
          name: editorData.name,
          password: hashedPassword,
          role: editorData.role,
          active: true
        }
      ])
      .select();
    
    if (createError) {
      console.error('Error creating user in users table:', createError);
      throw createError;
    }
    
    console.log(`Created editor user: ${editorData.name} (${editorData.email})`);
    console.log(`ID: ${newUser[0].id}`);
    console.log(`Password: ${editorData.password}`);
    console.log('-----------------------------------');
    
    return {
      id: newUser[0].id,
      name: newUser[0].name,
      email: newUser[0].email,
      password: editorData.password
    };
  } catch (err) {
    console.error(`Error creating editor user ${editorData.email}:`, err);
    return null;
  }
}

// Run the function
createEditorUser()
  .then(user => {
    if (user) {
      console.log('\nEditor User Created:');
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`ID: ${user.id}`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
