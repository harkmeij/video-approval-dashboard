require('dotenv').config();
const supabase = require('../config/supabase');
const { hashPassword, generateResetToken, hashToken } = require('../utils/passwordUtils');

// Array of fake clients to create
const fakeClients = [
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    role: 'client'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    role: 'client'
  },
  {
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    role: 'client'
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    role: 'client'
  },
  {
    name: 'Robert Wilson',
    email: 'robert.wilson@example.com',
    role: 'client'
  }
];

// Function to create a client
async function createClient(clientData) {
  try {
    console.log(`Creating client: ${clientData.name} (${clientData.email})`);
    
    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', clientData.email)
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing user:', checkError);
      throw checkError;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log(`User ${clientData.email} already exists, skipping...`);
      return null;
    }
    
    // Generate password reset token
    const tokenData = generateResetToken();
    const resetToken = tokenData.resetToken;
    const hashedToken = tokenData.hashedToken;
    const expires = tokenData.expires;
    
    // Create temporary password (will be changed by user)
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Create new user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: clientData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: clientData.name,
        role: clientData.role
      }
    });
    
    if (authError) {
      console.error('Supabase Auth error:', authError);
      throw authError;
    }
    
    // Hash the temporary password for our users table
    const hashedPassword = await hashPassword(tempPassword);
    
    // Create new user in users table
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          id: authUser.user.id,
          email: clientData.email,
          name: clientData.name,
          password: hashedPassword,
          role: clientData.role,
          active: true, // Set to true for testing purposes
          password_reset_token: hashedToken,
          password_reset_expires: expires
        }
      ])
      .select();
    
    if (createError) {
      console.error('Error creating user in users table:', createError);
      throw createError;
    }
    
    console.log(`Created client: ${clientData.name} (${clientData.email})`);
    console.log(`ID: ${newUser[0].id}`);
    console.log(`Password: ${tempPassword}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log('-----------------------------------');
    
    return {
      id: newUser[0].id,
      name: newUser[0].name,
      email: newUser[0].email,
      password: tempPassword,
      resetToken: resetToken
    };
  } catch (err) {
    console.error(`Error creating client ${clientData.email}:`, err);
    return null;
  }
}

// Main function to create all fake clients
async function createFakeClients() {
  console.log('Starting to create fake clients...');
  
  const createdClients = [];
  
  for (const clientData of fakeClients) {
    const client = await createClient(clientData);
    if (client) {
      createdClients.push(client);
    }
  }
  
  console.log('Finished creating fake clients.');
  console.log(`Created ${createdClients.length} new clients.`);
  
  // Print summary of created clients
  if (createdClients.length > 0) {
    console.log('\nCreated Clients Summary:');
    createdClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name} (${client.email})`);
      console.log(`   ID: ${client.id}`);
      console.log(`   Password: ${client.password}`);
      console.log(`   Reset Token: ${client.resetToken}`);
      console.log('-----------------------------------');
    });
  }
  
  // Exit the process
  process.exit(0);
}

// Run the main function
createFakeClients().catch(err => {
  console.error('Error creating fake clients:', err);
  process.exit(1);
});
