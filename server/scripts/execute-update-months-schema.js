/**
 * This script executes the SQL to update the months schema,
 * making months global instead of client-specific.
 */

const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');

async function executeMigration() {
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'update-months-schema.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL into statements and execute them sequentially
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}:`);
        console.log(statement.substring(0, 80) + '...'); // Show beginning of statement
        
        // Execute the statement
        const { data, error } = await supabase.rpc('exec', { 
          query: statement + ';' 
        });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
        } else {
          console.log(`Successfully executed statement ${i + 1}`);
        }
      } catch (stmtError) {
        console.error(`Error in statement ${i + 1}:`, stmtError);
        // Continue with next statement rather than aborting the whole migration
      }
    }
    
    console.log('Migration completed');
  } catch (err) {
    console.error('Error during migration:', err);
  }
}

executeMigration();
