import pool from '../db.js';

export async function getAll(req, res) {
  const { type, month, year } = req.query;
  let sql = `
    SELECT e.*, ac.name AS account_name, ac.color AS account_color,
           ec.name AS category_name, ec.icon AS category_icon, ec.color AS category_color
    FROM expenses e
    LEFT JOIN accounts ac ON e.account_id = ac.id
    LEFT JOIN expense_categories ec ON e.category_id = ec.id
  `;
  const params = [];
  const conditions = [];

  if (month && year) {
    const m = parseInt(month);
    const y = parseInt(year);
    const monthYear = `${y}-${String(m).padStart(2, '0')}`;
    conditions.push(`(
      (e.type != 'fixed' AND MONTH(e.expense_date) = ? AND YEAR(e.expense_date) = ?)
      OR
      (e.type = 'fixed' AND e.id IN (SELECT expense_id FROM payments WHERE month_year = ?))
    )`);
    params.push(m, y, monthYear);
  }

  if (type) {
    conditions.push('e.type = ?');
    params.push(type);
  }

  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY COALESCE(e.expense_date, e.created_at) DESC, e.created_at DESC';

  const [rows] = await pool.query(sql, params);
  res.json(rows);
}

export async function getById(req, res) {
  const [rows] = await pool.query(
    `SELECT e.*, ac.name AS account_name, ec.name AS category_name, ec.icon AS category_icon
     FROM expenses e
     LEFT JOIN accounts ac ON e.account_id = ac.id
     LEFT JOIN expense_categories ec ON e.category_id = ec.id
     WHERE e.id = ?`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Expense not found' });
  res.json(rows[0]);
}

export async function create(req, res) {
  const { account_id, category_id, amount, description, type, expense_date, is_paid, due_day } = req.body;
  const isFixed = type === 'fixed';

  const [result] = await pool.query(
    `INSERT INTO expenses (account_id, category_id, amount, description, type, due_day, expense_date, is_paid)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      account_id || null,
      category_id || null,
      amount,
      description || '',
      type || 'daily',
      isFixed ? (due_day || null) : null,
      isFixed ? null : (expense_date || new Date().toISOString().slice(0, 10)),
      isFixed ? false : (is_paid !== false),
    ]
  );

  const expenseId = result.insertId;

  if (isFixed && due_day) {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await pool.query(
      `INSERT INTO payments (name, amount, due_day, month_year, expense_id)
       VALUES (?, ?, ?, ?, ?)`,
      [description || 'Gasto fijo', amount, due_day, monthYear, expenseId]
    );
  }

  const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [expenseId]);
  res.status(201).json(rows[0]);
}

export async function update(req, res) {
  const { account_id, category_id, amount, description, type, expense_date, is_paid, due_day } = req.body;
  const isFixed = type === 'fixed';

  await pool.query(
    `UPDATE expenses SET account_id = ?, category_id = ?, amount = ?, description = ?,
     type = ?, due_day = ?, expense_date = ?, is_paid = ? WHERE id = ?`,
    [
      account_id || null,
      category_id || null,
      amount,
      description || '',
      type || 'daily',
      isFixed ? (due_day || null) : null,
      isFixed ? null : (expense_date || null),
      is_paid !== false,
      req.params.id,
    ]
  );

  if (isFixed && due_day) {
    await pool.query(
      `UPDATE payments SET name = ?, amount = ?, due_day = ? WHERE expense_id = ?`,
      [description || 'Gasto fijo', amount, due_day, req.params.id]
    );
  }

  const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
}

export async function remove(req, res) {
  await pool.query('DELETE FROM payments WHERE expense_id = ?', [req.params.id]);
  await pool.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
  res.json({ message: 'Expense deleted' });
}

export async function getSummary(req, res) {
  const { month, year } = req.query;
  const m = parseInt(month) || new Date().getMonth() + 1;
  const y = parseInt(year) || new Date().getFullYear();
  const monthYear = `${y}-${String(m).padStart(2, '0')}`;

  const [rows] = await pool.query(
    `SELECT type, SUM(amount) AS total, COUNT(*) AS count
     FROM expenses
     WHERE (type != 'fixed' AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?)
        OR (type = 'fixed' AND id IN (SELECT expense_id FROM payments WHERE month_year = ?))
     GROUP BY type`,
    [m, y, monthYear]
  );
  res.json(rows);
}
