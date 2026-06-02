import mysql from 'mysql2/promise';
import { readFile } from 'fs/promises';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3307');
const DB_USER = process.env.DB_USER || 'finance_user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'finance_pass';

async function initDb() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf-8');
  await connection.query(schema);
  console.log('Schema initialized successfully');

  const migration = await readFile(new URL('./schema-migration.sql', import.meta.url), 'utf-8');
  await connection.query(migration);
  console.log('Migration applied successfully');

  await connection.end();
}

initDb().catch((err) => {
  console.error('Failed to initialize database:', err.message);
  process.exit(1);
});
