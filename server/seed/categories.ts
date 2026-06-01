import mysql from 'mysql2/promise';
import 'dotenv/config';

const categories = [
  { name: 'Alquiler', icon: 'home', color: '#8d6e63' },
  { name: 'Tarjeta de crédito', icon: 'credit_card', color: '#e91e63' },
  { name: 'Servicios', icon: 'bolt', color: '#f44336' },
  { name: 'Sueldos', icon: 'payments', color: '#4caf50' },
  { name: 'ARCA/ARBA', icon: 'receipt_long', color: '#d32f2f' },
  { name: 'Otros', icon: 'more_horiz', color: '#757575' },
];

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'finance_user',
    password: process.env.DB_PASSWORD || 'finance_pass',
    database: process.env.DB_NAME || 'simple_finance',
    waitForConnections: true,
    connectionLimit: 1,
  });

  for (const c of categories) {
    await pool.query(
      'INSERT IGNORE INTO expense_categories (name, icon, color) VALUES (?, ?, ?)',
      [c.name, c.icon, c.color]
    );
    console.log(`  ${c.name}`);
  }

  await pool.end();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
