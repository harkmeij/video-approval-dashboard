require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.PROJECT_URL,
  process.env.SUPABASE_API_KEY
);

// Get table schemas - with Supabase REST API we can't directly query the pg_catalog,
// so we'll list the known schemas in Supabase
async function getSchemas() {
  console.log('Available Supabase schemas:');
  console.log('-------------------------');
  
  // These are the standard Supabase schemas
  const schemas = [
    'public',        // Your application data
    'auth',          // Authentication related tables
    'storage',       // Storage related tables
    'realtime',      // Realtime related tables
    'extensions',    // PostgreSQL extensions
    'graphql',       // GraphQL related tables
    'graphql_public' // GraphQL public interface
  ];
  
  for (const schema of schemas) {
    console.log(`- ${schema}`);
  }
  
  console.log('\nTo explore tables in a schema, run:');
  console.log('node scripts/supabase-schema-explorer.js public');
}

// Get tables in a schema - for the public schema we'll query known tables directly
async function getTables(schemaName) {
  console.log(`Getting tables in schema: ${schemaName}...`);
  
  // Define known table mapping - we can add more as needed
  const knownTables = {
    'public': ['users', 'months', 'videos', 'comments', 'social_media_accounts', 'social_media_metrics', 'social_media_posts'],
    'auth': ['users', 'identities', 'sessions'],
    'storage': ['buckets', 'objects', 'migrations']
  };
  
  if (!knownTables[schemaName]) {
    console.log(`No known tables for schema '${schemaName}' or schema doesn't exist.`);
    return;
  }
  
  console.log(`\nTables in schema '${schemaName}':`);
  console.log('------------------------' + '-'.repeat(schemaName.length));
  
  // Loop through known tables for this schema
  for (const tableName of knownTables[schemaName]) {
    console.log(`- ${tableName}`);
    
    try {
      // Try to get table structure by querying the table
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (error) {
        console.log(`  Note: Unable to access this table. It may require special permissions.`);
      } else {
        // Extract column information from the returned data structure
        if (data) {
          console.log('  Columns:');
          const sampleRow = await supabase.from(tableName).select('*').limit(1);
          
          if (sampleRow.data && sampleRow.data.length > 0) {
            const sample = sampleRow.data[0];
            for (const [key, value] of Object.entries(sample)) {
              const type = typeof value;
              console.log(`    - ${key} (${type === 'object' && value === null ? 'null/unknown' : type})`);
            }
          } else {
            console.log('    (Table is empty, cannot determine column structure)');
          }
        }
      }
    } catch (err) {
      console.error(`  Error exploring table ${tableName}:`, err.message);
    }
    
    console.log('');
  }
  
  console.log('\nTo explore a specific table in detail, run:');
  console.log(`node scripts/supabase-schema-explorer.js ${schemaName} [tablename]`);
}

// Get table details - simplified to work with the REST API
async function getTableDetails(schemaName, tableName) {
  console.log(`Getting details for table: ${schemaName}.${tableName}...`);
  
  if (schemaName !== 'public') {
    console.log(`\nNote: Non-public schema tables can only be accessed via SQL queries, which requires RPC endpoints`);
    console.log(`or direct database access. We'll attempt to access the table through the public API.\n`);
  }
  
  try {
    // First try to get the table's structure by querying it
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (error) {
      console.error(`Error accessing table: ${error.message}`);
      return;
    }
    
    console.log(`\nTable: ${tableName}`);
    console.log('-'.repeat(tableName.length + 7));
    
    // Extract column information from the data
    if (data.length > 0) {
      console.log('\nColumns (derived from data):');
      const sample = data[0];
      for (const [key, value] of Object.entries(sample)) {
        const type = typeof value;
        console.log(`- ${key} (${type === 'object' && value === null ? 'null/unknown' : type})`);
      }
      
      // Show sample data
      console.log('\nSample data:');
      for (let i = 0; i < Math.min(data.length, 3); i++) {
        console.log(`\nRow ${i+1}:`);
        console.log(JSON.stringify(data[i], null, 2));
      }
      
      // Count rows
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`\nTotal rows: ${count}`);
      }
    } else {
      console.log('Table is empty, no data to analyze structure.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    await getSchemas();
  } else if (args.length === 1) {
    await getTables(args[0]);
  } else if (args.length === 2) {
    await getTableDetails(args[0], args[1]);
  } else {
    console.log('Usage:');
    console.log('  node scripts/supabase-schema-explorer.js                 # List all schemas');
    console.log('  node scripts/supabase-schema-explorer.js [schema]        # List tables in schema');
    console.log('  node scripts/supabase-schema-explorer.js [schema] [table] # Show table details');
  }
}

main();
