const { Pool } = require('pg');

// Connect to default postgres database first
const defaultPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Connect to default database
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function createDatabase() {
  try {
    console.log('Creating database...');
    
    // Connect to postgres database
    const client = await defaultPool.connect();
    
    // Check if database exists
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      ['kiserian_main_db']
    );
    
    if (result.rows.length === 0) {
      // Create database
      await client.query('CREATE DATABASE kiserian_main_db');
      console.log('Database kiserian_main_db created successfully!');
    } else {
      console.log('Database kiserian_main_db already exists!');
    }
    
    client.release();
    await defaultPool.end();
    
    // Now run the setup script
    console.log('Running database setup...');
    require('./setup-database.js');
    
  } catch (error) {
    console.error('Error creating database:', error);
    await defaultPool.end();
    process.exit(1);
  }
}

createDatabase();
