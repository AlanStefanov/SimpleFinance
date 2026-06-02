import pool from '../db.js';

const INCOME_WORDS = /ingres[aeoáéó]r?|ingreso|deposit[aeoáéó]r?|deposito|recib[íi]|recibir|cobr[éée]|cobrar|pon[éeé]|poner|carg[aeoáéó]r?|sum[aeoáéó]r?|agreg[aeoáéó]r?|registr[aeoáéó]|registrar|aument[aeoáéó]r?|acredit[aeoáéó]r?|entr[aeoáéó]r?|ingres/i;
const EXPENSE_WORDS = /gast[aeoáéó]r?|descont[aeoáéó]r?|pagar|pag[uú]é|pag[oó]|pag[au]|pago|compr[éeéoó]|compr[aeo]r?|rest[aeoáéó]r?|sac[aeoáéó]r?|retir[aeoáéó]r?|deb[ii]t[aeoáéó]r?|egres[oai]|consum[iió]r?|us[aeoáéó]r?/i;
const AMOUNT_RE = /\$?\s*([\d]{1,3}(?:[.,][\d]{3})*(?:[.,]\d+)?|\d+(?:[.,]\d+)?)/;

function parseAmount(str) {
  const m = str.match(AMOUNT_RE);
  if (!m) return null;
  let raw = m[1];
  // argentine format: 1.500,50 or 1500.50 or 1500,50
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) {
    raw = raw.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+(\.\d+)?$/.test(raw)) {
    raw = raw.replace(/\.(?=\d{3})/g, ''); // 1.500.50 -> 1500.50 ... hmm this is ambiguous
  } else {
    raw = raw.replace(',', '.');
  }
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

function removeAmount(text, amountStr) {
  return text.replace(amountStr, '').replace(/\s+/g, ' ').trim();
}

function cleanAmountStr(text) {
  const m = text.match(AMOUNT_RE);
  return m ? m[0] : null;
}

function determineAction(text) {
  // Count income vs expense keyword matches
  const incomeMatches = (text.match(INCOME_WORDS) || []).length;
  const expenseMatches = (text.match(EXPENSE_WORDS) || []).length;
  if (incomeMatches > expenseMatches) return 'income';
  if (expenseMatches > incomeMatches) return 'expense';
  // If equal or none, check specific patterns
  if (/\bganancia\b|\bgan[eé]ncia\b|\bsueldo\b|\bsalario\b|\bhonorario\b|\bventa\b|\btransferencia recibida\b/i.test(text)) return 'income';
  if (/\bcompra\b|\bgasto\b|\bfactura\b|\bservicio\b|\bsuscripcion\b/i.test(text)) return 'expense';
  return null;
}

function extractDescription(text, action, accountName) {
  // Remove action keywords
  let desc = text
    .replace(INCOME_WORDS, '')
    .replace(EXPENSE_WORDS, '')
    .replace(/\bde\b|\ba\b|\ben\b|\bpor\b|\bpara\b|\bel\b|\bla\b|\blos\b|\blas\b|\bun\b|\buna\b/gi, '')
    .replace(accountName ? accountName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '', '')
    .replace(/\s+/g, ' ')
    .trim();
  // If desc is just the action name, clear it
  if (/^(ingreso|gasto|pago)s?$/i.test(desc)) desc = '';
  return desc;
}

function parseCommand(text) {
  const lower = text.toLowerCase().trim();

  const action = determineAction(lower);
  if (!action) return null;

  const amount = parseAmount(lower);
  if (!amount || amount <= 0) return null;

  const amountStr = cleanAmountStr(lower);
  const afterAmount = amountStr ? removeAmount(lower, amountStr) : lower;

  return { action, amount, afterAmount };
}

async function findAccount(text) {
  const [rows] = await pool.query('SELECT * FROM accounts ORDER BY name');
  const lower = text.toLowerCase().trim();

  // Score each account by how well it matches the text
  let best = { account: null, score: 0 };
  for (const acc of rows) {
    const aLower = acc.name.toLowerCase();
    let score = 0;
    if (lower.includes(aLower)) {
      // Full name match gives high score
      score = aLower.length * 2;
    } else {
      // Check each word
      const words = aLower.split(/\s+/);
      for (const w of words) {
        if (w.length > 2 && lower.includes(w)) score += w.length;
      }
    }
    // Bonus for keyword matches
    const aliases = {
      'bbva': 'BBVA',
      'astropay': 'Astropay',
      'efectivo': 'Caja fuerte',
      'caja': 'Caja fuerte',
      'usd': 'Caja Fuerte',
      'dolares': 'Caja Fuerte',
      'dolar': 'Caja Fuerte',
      'pesos': 'Astropay ARS',
      'ars': 'Astropay ARS',
    };
    for (const [key, name] of Object.entries(aliases)) {
      if (lower.includes(key) && acc.name === name) score += 10;
    }
    if (score > best.score) best = { account: acc, score };
  }

  return best.score > 0 ? best.account : null;
}

export async function chat(req, res) {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const parsed = parseCommand(message);
  if (!parsed) {
    return res.json({
      response: 'No entendí el comando. Probá:\n- "ingresá 1000 a bbva por sueldo"\n- "gastá 500 de caja fuerte en comida"\n- "registrá ingreso de 50000 en bbva"\n- "descontá 300 de astropay para viáticos"',
    });
  }

  const account = await findAccount(parsed.afterAmount);
  if (!account) {
    return res.json({
      response: 'No encontré ninguna cuenta en tu mensaje. Las disponibles son: BBVA, Astropay, Caja fuerte, Caja Fuerte USD, Astropay ARS.',
    });
  }

  const actionLabel = parsed.action === 'income' ? 'Ingreso' : 'Gasto';
  const sign = parsed.action === 'income' ? 1 : -1;
  const description = extractDescription(parsed.afterAmount, parsed.action, account.name);

  // Create transaction
  const [result] = await pool.query(
    'INSERT INTO transactions (account_id, type, amount, description) VALUES (?, ?, ?, ?)',
    [account.id, parsed.action, parsed.amount, description]
  );

  // Update balance
  await pool.query('UPDATE accounts SET balance = balance + ? WHERE id = ?', [sign * parsed.amount, account.id]);

  const [[updatedAccount]] = await pool.query('SELECT * FROM accounts WHERE id = ?', [account.id]);

  const fmtAmount = `$${parsed.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  const fmtBalance = `$${Number(updatedAccount.balance).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  const descText = description ? ` (${description})` : '';

  res.json({
    response: `✅ ${actionLabel}: ${fmtAmount} en ${account.name}${descText}\n💰 Saldo actual: ${fmtBalance}`,
    transaction: {
      id: result.insertId,
      account_id: account.id,
      type: parsed.action,
      amount: parsed.amount,
      description,
    },
    account: updatedAccount,
  });
}
