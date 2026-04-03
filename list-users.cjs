const pg = require('pg');
const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgres://postgres:mysecretpassword@localhost:5432/neon_chat'
});

async function main() {
  try {
    const users = await pool.query('SELECT id, username, email FROM users');
    console.log('Users:', JSON.stringify(users.rows, null, 2));
  } catch (err) {
    console.error(err.message);
  } finally {
    pool.end();
  }
}
main();
