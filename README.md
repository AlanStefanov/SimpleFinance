# Simple Finance

Personal finance management web application. Track expenses, manage accounts, schedule recurring payments, and monitor credit cards.

## Features

- **Expenses**: Daily, weekly, monthly, and fixed expense tracking with categories
- **Accounts**: Multi-currency accounts (ARS cash/savings, USD cash/savings)
- **Payments 1-5**: Recurring monthly bills due on days 1-5 with status tracking (pending/partial/paid)
- **Credit Cards**: Card management with installment tracking and monthly summaries
- **Dashboard**: Overview of balances, pending payments, and recent activity
- **Authentication**: JWT-based login for secure access

## Tech Stack

- **Frontend**: React 18, Material UI 6, Axios, React Router 6
- **Backend**: Node 22, Express 4, MySQL 2, JWT
- **Database**: MySQL (AWS RDS)
- **Build**: Vite 5
- **Deploy**: Docker, Nginx reverse proxy

## Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your MySQL credentials

# Start development server (frontend + backend concurrently)
npm run dev

# Build for production
npm run build
```

## Seed Categories

```bash
npm run seed:categories
```

## Docker Deployment

```bash
docker compose -f docker-compose.prod.yml up -d
```

## License

MIT

## Author

Alan Stefanov
- [LinkedIn](https://www.linkedin.com/in/alan-stefanov-87b8721b9/)
- [Email](mailto:alan.emanuel.stefanov@gmail.com)
