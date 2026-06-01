# Simple Finance

Personal finance management web application built with React and Express. Track expenses across multiple accounts and currencies, manage recurring bills, and monitor credit card spending — all in one place.

## Features

- **Dashboard** — Overview of account balances (ARS/USD), monthly expenses, pending payments, and recent activity with month-by-month navigation
- **Multi-currency Accounts** — ARS (cash, checking, savings) and USD (cash, savings) accounts with color-coding and balance tracking
- **Expense Tracking** — Daily, weekly, monthly, and fixed expenses with category classification, date ranges, and month filtering
- **Recurring Bills (Pagos 1-5)** — Monthly fixed expenses due on days 1-5 with payment status tracking (pending / partial / paid), progress bars, and month generation
- **Credit Cards** — Card management with expense tracking, installment support, monthly summaries, and closing/due date tracking
- **Authentication** — JWT-based secure login
- **Responsive Design** — Optimized for mobile and desktop with banking-style UI

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Material UI 6, React Router 6, Axios |
| Backend | Node.js 22, Express 4 |
| Database | MySQL 8 (AWS RDS) |
| Auth | JSON Web Tokens, bcryptjs |
| Build | Vite 5 |
| Container | Docker, Docker Compose |
| Deployment | Nginx reverse proxy, Let's Encrypt SSL |

## Architecture

```
client/             React SPA (Vite build)
  ├── src/api/        Axios API client with JWT interceptor
  ├── src/pages/      Dashboard, Accounts, Expenses, Payments, Cards
  └── src/contexts/   Auth context with token management

server/             Express REST API
  ├── controllers/    CRUD logic for accounts, expenses, payments, cards
  ├── routes/         Express routers + dashboard aggregate queries
  ├── middleware/     JWT authentication middleware
  ├── schema.sql     Full database schema
  └── seed/          Category seed script

docker-compose.prod.yml   Production deployment (single container + .env)
```

## Getting Started

### Prerequisites

- Node.js 22+
- MySQL 8+
- npm

### Environment Variables

Create a `.env` file in the project root:

```env
DB_HOST=your-rds-host
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=simple_finance
JWT_SECRET=your-secret-key
```

### Development

```bash
# Install dependencies
npm install

# Initialize database (creates tables)
npm run db:init

# Seed expense categories
npm run seed:categories

# Start dev servers (Vite HMR + Express with --watch)
npm run dev

# Build for production
npm run build
```

The app runs at `http://localhost:5173` (Vite dev server proxies API to port 3000).

## Deployment

### Docker (Production)

```bash
# Build and start
docker compose -f docker-compose.prod.yml up -d

# With rebuild
docker compose -f docker-compose.prod.yml build --no-cache app
docker compose -f docker-compose.prod.yml up -d
```

The app listens on port `3000` inside the container. Map it as needed (e.g. `5137:3000`).

### Nginx Reverse Proxy (HTTPS)

```nginx
server {
    listen 443 ssl;
    server_name lab.farmuhub.co;

    location / {
        proxy_pass http://127.0.0.1:5137;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Database

The `payments` table tracks recurring expenses due on days 1-5 of each month. Fixed expenses (`type = 'fixed'`) automatically create a payment record. The `card_expenses` table stores individual credit card transactions linked to monthly summaries.

See `server/schema.sql` for the full schema.

## License

MIT

## Author

**Alan Stefanov**
- [LinkedIn](https://www.linkedin.com/in/alan-stefanov-87b8721b9/)
- [Email](mailto:alan.emanuel.stefanov@gmail.com)
