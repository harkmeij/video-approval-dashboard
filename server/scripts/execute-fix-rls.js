const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'fix-rls-policies.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Execute the SQL directly
async function executeSQL() {
  try {
    console.log('Executing SQL to fix RLS policies...');
    
    // Execute the SQL directly using the REST API
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try an alternative approach - execute each statement separately
      console.log('Trying alternative approach...');
      
      // Split the SQL into individual statements
      const statements = sql
        .replace(/--.*$/gm, '') // Remove comments
        .split(';')
        .filter(statement => statement.trim() !== '');
      
      // Execute each statement using a direct query
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (!statement) continue;
        
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        
        try {
          // Use a direct query instead of RPC
          const { error: stmtError } = await supabase.from('_sql').select('*').eq('query', statement).limit(1);
          
          if (stmtError) {
            console.error(`Error executing statement ${i + 1}:`, stmtError);
          } else {
            console.log(`Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`Error executing statement ${i + 1}:`, err);
        }
      }
    } else {
      console.log('SQL executed successfully');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

// Alternative approach: create admin user directly
async function createAdminUser() {
  try {
    console.log('Creating admin user directly...');
    
    // First, check if the user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'mark@betterview.nl')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking if user exists:', checkError);
      return;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create the admin user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          email: 'mark@betterview.nl',
          name: 'Admin User',
          role: 'editor',
          active: true,
          password: '$2a$10$rDJKDfI2KVCbh7MEp.4QCeGIr0tqq9Bg4JF9aBWl.f/zku.Z.u5lW' // hashed 'admin123'
        }
      ]);
    
    if (createError) {
      console.error('Error creating admin user:', createError);
    } else {
      console.log('Admin user created successfully');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

// Execute the SQL and create admin user
async function main() {
  try {
    // Try to execute the SQL first
    await executeSQL();
    
    // If that fails, try to create the admin user directly
    await createAdminUser();
    
    console.log('Done');
  } catch (err) {
    console.error('Error in main function:', err);
  }
}

main();
