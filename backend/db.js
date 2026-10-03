const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Test the connection on startup
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error connecting to PostgreSQL:', err.message);
        console.error('   Please check your .env configuration and ensure PostgreSQL is running.');
    } else {
        console.log('✅ Connected to PostgreSQL database:', process.env.DB_NAME);
        release();
    }
});

module.exports = pool;
