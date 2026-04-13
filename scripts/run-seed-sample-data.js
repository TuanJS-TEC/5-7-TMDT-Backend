/**
 * Chạy scripts/seed-sample-data.sql trên PostgreSQL.
 * Mặc định: localhost:5432, db car_marketplace, user postgres.
 *
 * Biến môi trường: POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const sqlPath = path.join(__dirname, 'seed-sample-data.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? '',
    database: process.env.POSTGRES_DB || 'car_marketplace',
  });

  await client.connect();
  try {
    await client.query(sql);
    console.log('OK: seed-sample-data.sql đã chạy xong.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
