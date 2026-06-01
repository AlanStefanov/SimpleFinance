import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const now = new Date();
  const m = parseInt(req.query.month) || now.getMonth() + 1;
  const y = parseInt(req.query.year) || now.getFullYear();

  const [[{ ars_balance }]] = await pool.query(
    "SELECT COALESCE(SUM(balance), 0) AS ars_balance FROM accounts WHERE type NOT IN ('usd_cash','usd_savings')"
  );
  const [[{ usd_balance }]] = await pool.query(
    "SELECT COALESCE(SUM(balance), 0) AS usd_balance FROM accounts WHERE type IN ('usd_cash','usd_savings')"
  );
  const monthYear = `${y}-${String(m).padStart(2, '0')}`;
  const [[{ monthly_expenses }]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS monthly_expenses FROM expenses
     WHERE (type != 'fixed' AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?)
        OR (type = 'fixed' AND id IN (SELECT expense_id FROM payments WHERE month_year = ?))`,
    [m, y, monthYear]
  );
  const [[{ pending_payments }]] = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) AS pending_payments FROM payments WHERE month_year = ? AND status = 'pending'",
    [monthYear]
  );
  const [[{ pending_summaries }]] = await pool.query(
    "SELECT COALESCE(SUM(total_amount), 0) AS pending_summaries FROM card_summaries WHERE status = 'pending'"
  );

  const [recentExpenses] = await pool.query(
    `SELECT e.*, ec.name AS category_name, ec.icon AS category_icon, ec.color AS category_color
     FROM expenses e
     LEFT JOIN expense_categories ec ON e.category_id = ec.id
     WHERE e.type != 'fixed'
        AND ((e.type != 'fixed' AND MONTH(e.expense_date) = ? AND YEAR(e.expense_date) = ?)
          OR (e.type = 'fixed' AND e.id IN (SELECT expense_id FROM payments WHERE month_year = ?)))
     ORDER BY e.expense_date DESC LIMIT 5`,
    [m, y, monthYear]
  );

  const [upcomingPayments] = await pool.query(
    `SELECT p.*, a.name AS account_name FROM payments p
     LEFT JOIN accounts a ON p.account_id = a.id
     WHERE p.month_year = ? AND p.status = 'pending'
     ORDER BY p.due_day LIMIT 5`,
    [monthYear]
  );

  res.json({
    ars_balance, usd_balance,
    monthly_expenses,
    pending_payments,
    pending_summaries,
    recent_expenses: recentExpenses,
    upcoming_payments: upcomingPayments,
  });
});

export default router;
