import pool from '../db.js';

export async function getAll(req, res) {
  const { month, year } = req.query;
  const m = month || new Date().getMonth() + 1;
  const y = year || new Date().getFullYear();
  const monthYear = `${y}-${String(m).padStart(2, '0')}`;

  const [rows] = await pool.query(
    `SELECT p.*, a.name AS account_name, a.color AS account_color,
            cc.name AS card_name, cc.color AS card_color
     FROM payments p
     LEFT JOIN accounts a ON p.account_id = a.id
     LEFT JOIN credit_cards cc ON p.card_id = cc.id
     WHERE p.month_year = ?
     ORDER BY p.due_day, p.name`,
    [monthYear]
  );
  res.json(rows);
}

export async function getCurrentMonth(req, res) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const monthYear = `${y}-${m}`;

  const [rows] = await pool.query(
    `SELECT p.*, a.name AS account_name, a.color AS account_color,
            cc.name AS card_name, cc.color AS card_color
     FROM payments p
     LEFT JOIN accounts a ON p.account_id = a.id
     LEFT JOIN credit_cards cc ON p.card_id = cc.id
     WHERE p.month_year = ?
     ORDER BY p.due_day, p.name`,
    [monthYear]
  );
  res.json(rows);
}

export async function create(req, res) {
  const { name, amount, due_day, month_year, account_id } = req.body;
  const [result] = await pool.query(
    `INSERT INTO payments (name, amount, due_day, month_year, account_id)
     VALUES (?, ?, ?, ?, ?)`,
    [name, amount, due_day, month_year, account_id || null]
  );
  const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
}

export async function updateStatus(req, res) {
  const { status, partial_amount, account_id, card_id } = req.body;
  const [prevRows] = await pool.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
  if (!prevRows.length) return res.status(404).json({ error: 'Payment not found' });
  const prev = prevRows[0];
  const prevAmount = Number(prev.amount);
  const paidAmount = status === 'paid' ? prevAmount : (status === 'partial' ? parseFloat(partial_amount || 0) : 0);

  // Reverse previous deduction if applicable
  if (prev.account_id && (prev.status === 'paid' || prev.status === 'partial')) {
    const refundAmount = prev.status === 'paid' ? prevAmount : Number(prev.partial_amount);
    await pool.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [refundAmount, prev.account_id]);
  }
  // Remove previous card expense if applicable
  if (prev.card_id && (prev.status === 'paid' || prev.status === 'partial')) {
    await pool.query('DELETE FROM card_expenses WHERE card_id = ? AND description = ? AND amount = ? AND DATE(expense_date) = DATE(?)',
      [prev.card_id, prev.name, prevAmount, prev.paid_at]);
  }

  // Apply new deduction
  const newAccountId = account_id || null;
  const newCardId = card_id || null;

  if ((status === 'paid' || status === 'partial') && newAccountId && paidAmount > 0) {
    await pool.query('UPDATE accounts SET balance = balance - ? WHERE id = ?', [paidAmount, newAccountId]);
  }

  if ((status === 'paid' || status === 'partial') && newCardId && paidAmount > 0) {
    await pool.query(
      `INSERT INTO card_expenses (card_id, description, amount, installments, expense_date)
       VALUES (?, ?, ?, 1, CURDATE())`,
      [newCardId, prev.name, paidAmount]
    );
  }

  const paid_at = status === 'paid' || status === 'partial' ? new Date() : null;
  await pool.query(
    `UPDATE payments SET status = ?, partial_amount = ?, account_id = ?, card_id = ?, paid_at = ? WHERE id = ?`,
    [status, partial_amount || 0, newAccountId, newCardId, paid_at, req.params.id]
  );

  const [rows] = await pool.query(
    `SELECT p.*, a.name AS account_name, a.color AS account_color,
            cc.name AS card_name, cc.color AS card_color
     FROM payments p
     LEFT JOIN accounts a ON p.account_id = a.id
     LEFT JOIN credit_cards cc ON p.card_id = cc.id
     WHERE p.id = ?`,
    [req.params.id]
  );
  res.json(rows[0]);
}

export async function remove(req, res) {
  const [prevRows] = await pool.query('SELECT * FROM payments WHERE id = ?', [req.params.id]);
  if (prevRows.length && (prevRows[0].status === 'paid' || prevRows[0].status === 'partial')) {
    const prev = prevRows[0];
    const refundAmount = prev.status === 'paid' ? Number(prev.amount) : Number(prev.partial_amount);
    if (prev.account_id) {
      await pool.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [refundAmount, prev.account_id]);
    }
    if (prev.card_id) {
      await pool.query('DELETE FROM card_expenses WHERE card_id = ? AND description = ? AND amount = ? AND DATE(expense_date) = DATE(?)',
        [prev.card_id, prev.name, refundAmount, prev.paid_at]);
    }
  }
  await pool.query('DELETE FROM payments WHERE id = ?', [req.params.id]);
  res.json({ message: 'Payment deleted' });
}

export async function generateMonth(req, res) {
  const { month, year } = req.body;
  const m = String(month).padStart(2, '0');
  const monthYear = `${year}-${m}`;

  const [existing] = await pool.query('SELECT COUNT(*) AS cnt FROM payments WHERE month_year = ?', [monthYear]);
  if (existing[0].cnt > 0) {
    return res.status(409).json({ error: 'Month already generated' });
  }

  const [previous] = await pool.query(
    'SELECT DISTINCT name, amount, due_day FROM payments WHERE month_year = ?',
    [`${year}-${String(parseInt(m) - 1).padStart(2, '0')}`]
  );

  if (previous.length === 0) {
    return res.status(400).json({ error: 'No previous month to copy from. Add payments manually.' });
  }

  for (const p of previous) {
    await pool.query(
      'INSERT INTO payments (name, amount, due_day, month_year) VALUES (?, ?, ?, ?)',
      [p.name, p.amount, p.due_day, monthYear]
    );
  }

  const [rows] = await pool.query('SELECT * FROM payments WHERE month_year = ?', [monthYear]);
  res.status(201).json(rows);
}
