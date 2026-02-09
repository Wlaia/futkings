const { Client } = require('pg');

const password = encodeURIComponent('We021221@@!!');
const connectionString = `postgresql://postgres:${password}@db.pzfzxlrdwxsezfelzsbr.supabase.co:5432/postgres`;

console.log('Testing connection to:', connectionString.replace(password, '****'));

const client = new Client({
    connectionString: connectionString,
});

async function testConnection() {
    try {
        await client.connect();
        console.log('Successfully connected to the database!');
        const res = await client.query('SELECT NOW()');
        console.log('Current time from DB:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection error:', err);
    }
}

testConnection();
