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
    const filePath = path.join(__dirname, 'add-client-profile-fields.sql');
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log('Executing SQL commands...');
    await client.query(sql);

    console.log('Committing transaction...');
    await client.query('COMMIT');
    console.log('Successfully added client profile fields to the users table!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', err);
    console.error('Transaction rolled back.');
  } finally {
    client.release();
    pool.end();
  }
}

executeMigration();
