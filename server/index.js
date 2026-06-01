import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import authMiddleware from './middleware/auth.js';
import accountsRouter from './routes/accounts.js';
import expensesRouter from './routes/expenses.js';
import paymentsRouter from './routes/payments.js';
import cardsRouter from './routes/cards.js';
import categoriesRouter from './routes/categories.js';
import dashboardRouter from './routes/dashboard.js';
import errorHandler from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);

app.use('/api/accounts', authMiddleware, accountsRouter);
app.use('/api/expenses', authMiddleware, expensesRouter);
app.use('/api/payments', authMiddleware, paymentsRouter);
app.use('/api/cards', authMiddleware, cardsRouter);
app.use('/api/categories', authMiddleware, categoriesRouter);
app.use('/api/dashboard', authMiddleware, dashboardRouter);

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
