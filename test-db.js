// test-db.js
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const url = process.env.DATABASE_URL || '';
console.log('Panjang DATABASE_URL:', url.length);
console.log('10 karakter terakhir (kode):', [...url.slice(-10)].map(c => c.charCodeAt(0)));

const pool = new Pool({
  connectionString: url,
  ssl: false,
});

async function test() {
  try {
    const res = await pool.query('SELECT current_user, now()');
    console.log('BERHASIL connect!');
    console.log(res.rows[0]);
  } catch (err) {
    console.log('GAGAL connect:', err.message);
  } finally {
    await pool.end();
  }
}

test();