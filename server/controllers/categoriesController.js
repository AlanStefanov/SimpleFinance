import pool from '../db.js';

export async function getAll(req, res) {
  const [rows] = await pool.query('SELECT * FROM expense_categories ORDER BY name');
  res.json(rows);
}
