const fs = require('fs').promises;
const { pool } = require('./config/database');

async function setupDatabase() {
  try {
    console.log('Setting up database schema...');
    
    // Read the schema file
    const schemaSQL = await fs.readFile('../database/schema.sql', 'utf8');
    
    // Execute the schema
    await pool.query(schemaSQL);
    
    console.log('Database schema created successfully!');
    
    // Close the connection
    await pool.end();
    
    // Now run the seed script
    console.log('Running seed script...');
    require('./seed-database.js');
    
  } catch (error) {
    console.error('Error setting up database:', error);
    await pool.end();
  }
}

setupDatabase();
