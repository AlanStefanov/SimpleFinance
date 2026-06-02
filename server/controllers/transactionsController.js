import pool from '../db.js';

export async function getByAccount(req, res) {
  const [rows] = await pool.query(
    'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC',
    [req.params.id]
  );
  res.json(rows);
}

export async function create(req, res) {
  const { type, amount, description } = req.body;
  const t = type === 'income' ? 'income' : 'expense';
  const amt = parseFloat(amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: 'Amount must be positive' });

  const [result] = await pool.query(
    'INSERT INTO transactions (account_id, type, amount, description) VALUES (?, ?, ?, ?)',
    [req.params.id, t, amt, description || '']
  );

  // Update account balance
  const sign = t === 'income' ? 1 : -1;
  await pool.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [sign * amt, req.params.id]);

  const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [result.insertId]);
  const [[account]] = await pool.query('SELECT * FROM accounts WHERE id = ?', [req.params.id]);
  res.status(201).json({ transaction: rows[0], account });
}

export async function remove(req, res) {
  const [prev] = await pool.query('SELECT * FROM transactions WHERE id = ?', [req.params.txId]);
  if (!prev.length) return res.status(404).json({ error: 'Transaction not found' });

  // Reverse balance
  const sign = prev[0].type === 'income' ? -1 : 1;
  await pool.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [sign * Number(prev[0].amount), req.params.id]);

  await pool.query('DELETE FROM transactions WHERE id = ?', [req.params.txId]);
  const [[account]] = await pool.query('SELECT * FROM accounts WHERE id = ?', [req.params.id]);
  res.json({ message: 'Transaction deleted', account });
}
