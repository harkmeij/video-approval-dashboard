const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.SUPABASE_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

async function executeMigration() {
  const client = await pool.connect();
  try {
    console.log('Beginning transaction...');
    await client.query('BEGIN');

    // Read the SQL file
    const filePath = path.join(__dirname, 'initialize-client-profile-fields.sql');
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log('Executing SQL commands...');
    const result = await client.query(sql);

    // If the last command is a SELECT (for validation), display its result
    if (result && result.rows) {
      console.log('Validation results:');
      console.table(result.rows);
    }

    console.log('Committing transaction...');
    await client.query('COMMIT');
    console.log('Successfully initialized client profile fields!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during initialization:', err);
    console.error('Transaction rolled back.');
  } finally {
    client.release();
    pool.end();
  }
}

executeMigration();
