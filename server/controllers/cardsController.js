import pool from '../db.js';

export async function getAllCards(req, res) {
  const [rows] = await pool.query('SELECT * FROM credit_cards ORDER BY name');
  res.json(rows);
}

export async function getCardById(req, res) {
  const [rows] = await pool.query('SELECT * FROM credit_cards WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Card not found' });
  res.json(rows[0]);
}

export async function createCard(req, res) {
  const { name, closing_day, due_day, credit_limit, color } = req.body;
  const [result] = await pool.query(
    'INSERT INTO credit_cards (name, closing_day, due_day, credit_limit, color) VALUES (?, ?, ?, ?, ?)',
    [name, closing_day, due_day, credit_limit, color || '#9c27b0']
  );
  const [rows] = await pool.query('SELECT * FROM credit_cards WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
}

export async function updateCard(req, res) {
  const { name, closing_day, due_day, credit_limit, color } = req.body;
  await pool.query(
    'UPDATE credit_cards SET name = ?, closing_day = ?, due_day = ?, credit_limit = ?, color = ? WHERE id = ?',
    [name, closing_day, due_day, credit_limit, color, req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM credit_cards WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
}

export async function deleteCard(req, res) {
  await pool.query('DELETE FROM credit_cards WHERE id = ?', [req.params.id]);
  res.json({ message: 'Card deleted' });
}

export async function getCardExpenses(req, res) {
  const [rows] = await pool.query(
    `SELECT ce.*, ec.name AS category_name, ec.icon AS category_icon
     FROM card_expenses ce
     LEFT JOIN expense_categories ec ON ce.category_id = ec.id
     WHERE ce.card_id = ?
     ORDER BY ce.expense_date DESC`,
    [req.params.id]
  );
  res.json(rows);
}

export async function createCardExpense(req, res) {
  const { description, amount, installments, category_id, expense_date } = req.body;
  const [result] = await pool.query(
    'INSERT INTO card_expenses (card_id, description, amount, installments, category_id, expense_date) VALUES (?, ?, ?, ?, ?, ?)',
    [req.params.id, description, amount, installments || 1, category_id || null, expense_date]
  );
  const [rows] = await pool.query('SELECT * FROM card_expenses WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
}

export async function deleteCardExpense(req, res) {
  await pool.query('DELETE FROM card_expenses WHERE id = ? AND card_id = ?', [req.params.expenseId, req.params.id]);
  res.json({ message: 'Card expense deleted' });
}

export async function getSummaries(req, res) {
  const [rows] = await pool.query(
    `SELECT cs.*, cc.name AS card_name, cc.color AS card_color
     FROM card_summaries cs
     JOIN credit_cards cc ON cs.card_id = cc.id
     ORDER BY cs.due_date DESC`,
  );
  res.json(rows);
}

export async function createSummary(req, res) {
  const { card_id, closing_date, due_date, total_amount, minimum_payment } = req.body;
  const [result] = await pool.query(
    'INSERT INTO card_summaries (card_id, closing_date, due_date, total_amount, minimum_payment) VALUES (?, ?, ?, ?, ?)',
    [card_id, closing_date, due_date, total_amount, minimum_payment || null]
  );

  // Create a pending payment linked to this summary
  const d = new Date(due_date);
  const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const [cardRows] = await pool.query('SELECT name FROM credit_cards WHERE id = ?', [card_id]);
  const cardName = cardRows[0]?.name || 'Tarjeta';
  await pool.query(
    `INSERT INTO payments (name, amount, due_day, month_year, card_id, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [`${cardName} - Resumen`, total_amount, d.getDate(), monthYear, card_id]
  );

  const [rows] = await pool.query(
    `SELECT cs.*, cc.name AS card_name, cc.color AS card_color
     FROM card_summaries cs
     JOIN credit_cards cc ON cs.card_id = cc.id
     WHERE cs.id = ?`,
    [result.insertId]
  );
  res.status(201).json(rows[0]);
}

export async function updateSummaryStatus(req, res) {
  const { status, paid_amount } = req.body;
  const paid_at = status === 'paid' || status === 'partial' ? new Date() : null;
  await pool.query(
    'UPDATE card_summaries SET status = ?, paid_amount = ?, paid_at = ? WHERE id = ?',
    [status, paid_amount || 0, paid_at, req.params.id]
  );

  // Sync linked payment status
  const [rows] = await pool.query(
    `SELECT cs.*, cc.name AS card_name FROM card_summaries cs
     JOIN credit_cards cc ON cs.card_id = cc.id WHERE cs.id = ?`,
    [req.params.id]
  );
  if (rows.length) {
    const s = rows[0];
    const paymentName = `${s.card_name} - Resumen`;
    const paymentAmount = status === 'paid' ? s.total_amount : (paid_amount || 0);
    await pool.query(
      `UPDATE payments SET status = ?, partial_amount = ?, paid_at = ? WHERE name = ? AND card_id = ? AND month_year = ?`,
      [status, paymentAmount, paid_at, paymentName, s.card_id, s.due_date?.slice(0, 7)]
    );
  }

  res.json(rows[0]);
}

export async function deleteSummary(req, res) {
  const [summaries] = await pool.query(
    `SELECT cs.*, cc.name AS card_name FROM card_summaries cs
     JOIN credit_cards cc ON cs.card_id = cc.id WHERE cs.id = ?`,
    [req.params.id]
  );
  if (summaries.length) {
    const s = summaries[0];
    const paymentName = `${s.card_name} - Resumen`;
    await pool.query(
      `DELETE FROM payments WHERE name = ? AND card_id = ? AND month_year = ?`,
      [paymentName, s.card_id, s.due_date?.slice(0, 7)]
    );
  }
  await pool.query('DELETE FROM card_summaries WHERE id = ?', [req.params.id]);
  res.json({ message: 'Summary deleted' });
}
