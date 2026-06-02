import pool from '../db.js';

function parseCommand(text) {
  const lower = text.toLowerCase().trim();

  // income: "ingresá 1000 a bbva por venta" or "registrá ingreso de 500 en efectivo por sueldo"
  const incomePatterns = [
    /(?:ingres[áa]|registr[áa] ingreso|ingreso)\s*(?:de\s*)?\$?([\d.,]+)\s*(?:a\s*|en\s*)?(.+?)(?:\s+por\s+|\s+para\s+|\s+de\s+)(.+)/i,
    /(?:ingres[áa]|registr[áa] ingreso|ingreso)\s*(?:de\s*)?\$?([\d.,]+)\s*(?:a\s*|en\s*)?(.+)/i,
  ];

  // expense: "gastá 500 de bbva en comida" or "descontá 300 de caja fuerte"
  const expensePatterns = [
    /(?:gast[áa]|descont[áa]|pagar?|registr[áa] gasto)\s*(?:de\s*)?\$?([\d.,]+)\s*(?:de\s*|en\s*)?(.+?)(?:\s+en\s+|\s+para\s+|\s+por\s+)(.+)/i,
    /(?:gast[áa]|descont[áa]|pagar?|registr[áa] gasto)\s*(?:de\s*)?\$?([\d.,]+)\s*(?:de\s*|en\s*)?(.+)/i,
  ];

  for (const p of incomePatterns) {
    const m = lower.match(p);
    if (m) {
      const amount = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
      const accountHint = m[2].trim();
      const description = m[3] ? m[3].trim() : '';
      return { action: 'income', amount, accountHint, description };
    }
  }

  for (const p of expensePatterns) {
    const m = lower.match(p);
    if (m) {
      const amount = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
      const accountHint = m[2].trim();
      const description = m[3] ? m[3].trim() : '';
      return { action: 'expense', amount, accountHint, description };
    }
  }

  return null;
}

async function findAccount(hint) {
  const [rows] = await pool.query('SELECT * FROM accounts ORDER BY name');
  const lower = hint.toLowerCase();

  // Exact match first
  let found = rows.find(r => r.name.toLowerCase() === lower);
  if (found) return found;

  // Partial match
  found = rows.find(r => r.name.toLowerCase().includes(lower));
  if (found) return found;

  // Keyword matching
  const keywords = {
    bbva: 'BBVA',
    astropay: 'Astropay',
    efectivo: 'Caja fuerte',
    caja: 'Caja fuerte',
    usd: 'Caja Fuerte',
    dolares: 'Caja Fuerte',
    pesar: 'Astropay ARS',
    ars: 'Astropay ARS',
  };

  for (const [key, name] of Object.entries(keywords)) {
    if (lower.includes(key)) {
      found = rows.find(r => r.name === name);
      if (found) return found;
    }
  }

  return rows[0] || null;
}

export async function chat(req, res) {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const parsed = parseCommand(message);
  if (!parsed) {
    return res.json({
      response: 'No entendí el comando. Probá: "ingresá 1000 a bbva por sueldo" o "gastá 500 de caja fuerte en comida"',
    });
  }

  const account = await findAccount(parsed.accountHint);
  if (!account) {
    return res.json({ response: 'No encontré ninguna cuenta. Las disponibles son: BBVA, Astropay, Caja fuerte, Caja Fuerte USD, Astropay ARS' });
  }

  const actionLabel = parsed.action === 'income' ? 'Ingreso' : 'Gasto';
  const sign = parsed.action === 'income' ? 1 : -1;

  // Create transaction
  const [result] = await pool.query(
    'INSERT INTO transactions (account_id, type, amount, description) VALUES (?, ?, ?, ?)',
    [account.id, parsed.action, parsed.amount, parsed.description]
  );

  // Update balance
  await pool.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [sign * parsed.amount, account.id]);

  const [[updatedAccount]] = await pool.query('SELECT * FROM accounts WHERE id = ?', [account.id]);
  const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM transactions WHERE account_id = ?', [account.id]);

  const fmtAmount = `$${parsed.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  const fmtBalance = `$${Number(updatedAccount.balance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  const descText = parsed.description ? ` (${parsed.description})` : '';

  res.json({
    response: `✅ ${actionLabel}: ${fmtAmount} en ${account.name}${descText}\n💰 Saldo actual: ${fmtBalance}`,
    transaction: {
      id: result.insertId,
      account_id: account.id,
      type: parsed.action,
      amount: parsed.amount,
      description: parsed.description,
    },
    account: updatedAccount,
  });
}
