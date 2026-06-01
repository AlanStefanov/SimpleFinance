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

  const [recentPayments] = await pool.query(
    `SELECT p.*, a.name AS account_name, a.color AS account_color,
            cc.name AS card_name, cc.color AS card_color
     FROM payments p
     LEFT JOIN accounts a ON p.account_id = a.id
     LEFT JOIN credit_cards cc ON p.card_id = cc.id
     WHERE p.month_year = ? AND p.status IN ('paid', 'partial')
     ORDER BY p.paid_at DESC LIMIT 5`,
    [monthYear]
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
    recent_payments: recentPayments,
    upcoming_payments: upcomingPayments,
  });
});

export default router;
