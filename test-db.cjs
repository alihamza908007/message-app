const pg = require('pg');
const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgres://postgres:mysecretpassword@localhost:5432/neon_chat'
});

async function main() {
  try {
    console.log('Testing connection...');
    const now = await pool.query('SELECT NOW()');
    console.log('Connection OK:', now.rows[0]);

    console.log('Checking tables...');
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', tables.rows.map(r => r.table_name));

    if (tables.rows.find(r => r.table_name === 'users')) {
      console.log('Checking columns for users...');
      const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
      console.log('Columns:', cols.rows.map(r => `${r.column_name} (${r.data_type})`));
      
      console.log('Testing search query...');
      const res = await pool.query(
        'SELECT id, username, avatar_url FROM users WHERE (LOWER(username) LIKE $1 OR LOWER(email) LIKE $1) AND id != $2 LIMIT 10',
        ['%test%', 1]
      );
      console.log('Search OK:', res.rows.length, 'results');
    }
  } catch (err) {
    console.error('FATAL:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await pool.end();
  }
}

main();
