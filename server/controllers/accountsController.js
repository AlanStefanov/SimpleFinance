import pool from '../db.js';

export async function getAll(req, res) {
  const [rows] = await pool.query('SELECT * FROM accounts ORDER BY type, name');
  res.json(rows);
}

export async function getById(req, res) {
  const [rows] = await pool.query('SELECT * FROM accounts WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Account not found' });
  res.json(rows[0]);
}

export async function create(req, res) {
  const { name, type, balance, color } = req.body;
  const [result] = await pool.query(
    'INSERT INTO accounts (name, type, balance, color) VALUES (?, ?, ?, ?)',
    [name, type || 'cash', balance || 0, color || '#1976d2']
  );
  const [rows] = await pool.query('SELECT * FROM accounts WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
}

export async function update(req, res) {
  const { name, type, balance, color } = req.body;
  await pool.query(
    'UPDATE accounts SET name = ?, type = ?, balance = ?, color = ? WHERE id = ?',
    [name, type, balance, color, req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM accounts WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
}

export async function remove(req, res) {
  await pool.query('DELETE FROM accounts WHERE id = ?', [req.params.id]);
  res.json({ message: 'Account deleted' });
}
