const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Read the SQL file
const sqlFilePath = path.join(__dirname, '../config/supabase-schema.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

// Split the SQL into individual statements
const statements = sql
  .replace(/--.*$/gm, '') // Remove comments
  .split(';')
  .filter(statement => statement.trim() !== '');

// Execute each statement
async function executeStatements() {
  console.log('Setting up Supabase database tables...');
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;
    
    try {
      console.log(`Executing statement ${i + 1}/${statements.length}`);
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.error(`Error executing statement ${i + 1}:`, err);
    }
  }
  
  console.log('Database setup complete');
}

// Execute the statements
executeStatements().catch(err => {
  console.error('Error setting up database:', err);
  process.exit(1);
});
