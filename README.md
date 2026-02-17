# Fenmo — Expense Tracker

A minimal full‑stack Expense Tracker (Express + MongoDB backend, React + Vite frontend) built to be reliable under real‑world conditions (retries, refreshes, slow networks).

Live demo
- Backend: <paste backend URL here>
- Frontend: <paste frontend URL here>

User story / Acceptance criteria

- Create expense entries with amount, category, description, and date.
- View a list of expenses.
- Filter expenses by category.
- Sort expenses by date (newest first).
- Show total of currently visible expenses (e.g., “Total: ₹X”).

Repository structure

- `backend/` — Express API (Mongoose + MongoDB). See `backend/package.json` and `backend/src`.
- `frontend/` — React + Vite UI. See `frontend/package.json` and `frontend/src`.

Quick start — Local

1) Backend

```bash
cd backend
npm install
# copy .env.example -> .env and set values, or set env vars manually
# For quick local testing without auth:
# DISABLE_AUTH=true
npm run start
```

Important backend env vars:
- `MONGODB_URI` — MongoDB connection string (e.g. `mongodb://127.0.0.1:27017/fenmo_expenses`)
- `JWT_SECRET` — required unless `DISABLE_AUTH=true`
- `PORT` — optional

2) Frontend

```bash
cd frontend
npm install
# set VITE_API_BASE_URL in .env or export it
npm run dev
```

Set `VITE_API_BASE_URL` to the backend base URL (e.g. `http://localhost:4000`).

API (backend)

Base path: `/`

- POST /expenses
	- Create a new expense. Request body JSON: `amount`, `category`, `description`, `date`, optional `requestId`.
	- Idempotency: Include `Idempotency-Key` header or `requestId` to make POST idempotent across retries.
	- Returns the created expense.

- GET /expenses
	- Query params: `category` (filter), `sort` (`date_desc` for newest first, etc.)
	- Returns `{ expenses: [...] }`

- GET /expenses/categories
	- Returns distinct categories for the authenticated user.

Data model (server)

Defined in `backend/src/models/Expense.js` — summary:
- `id` (string)
- `amountPaise` (Number) — internal integer storage in paise (1 INR = 100 paise)
- `currency` (string, default `INR`)
- `category` (string)
- `description` (string)
- `date` (Date)
- `created_at` (timestamp)
- `idempotencyKey` (string, unique)

Why integer paise?

Storing money as integer (paise) avoids floating point rounding errors and keeps arithmetic deterministic — important for financial correctness.

Frontend behavior

- Add‑expense form (amount, category, description, date). The UI sends decimal amounts; backend converts to paise.
- Expense list with filter and sort controls.
- Shows total of currently visible expenses (client computed).
- Client includes idempotency key (`requestId` or `Idempotency-Key`) to avoid duplicates on retries.

Auth & testing

- The API expects JWT auth. For local development/CI you can set `DISABLE_AUTH=true` to use a deterministic test user id.
- Run backend tests:

```bash
cd backend
npm test
```

Deployment (Render backend, Vercel frontend)

High level steps — you can follow these or provide API tokens and I can deploy for you:

Backend (Render):
- Create a Web Service on Render pointing to the `backend` directory (or use a `render.yaml`).
- Build/start command: `npm run start` (Render runs `npm install` by default).
- Required env vars on Render:
	- `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN` (frontend URL). Optionally `NODE_ENV=production`.

Frontend (Vercel):
- Create a Vercel project using the `frontend` directory.
- Build command: `npm run build` (Vite output to `dist`).
- Set env var: `VITE_API_BASE_URL` → backend URL.

If you prefer, provide the following and I can perform the deploys for you:
- `RENDER_API_KEY`, preferred Render service name/region
- `VERCEL_TOKEN`, Vercel team/org (if applicable)
- `MONGODB_URI`, `JWT_SECRET`, and `CORS_ORIGIN` (or I can set `CORS_ORIGIN` after frontend deploy)

Design decisions & trade-offs

- Money is stored as integer `amountPaise` for correctness.
- POST is idempotent via `idempotencyKey` to handle retries and network issues.
- Auth is JWT-based; `DISABLE_AUTH=true` exists for test/local use.
- Persistence: MongoDB + Mongoose chosen for fast development and schema flexibility. A relational DB or SQLite would also be reasonable depending on needs.
- Timebox trade-offs: focused on correctness (idempotency, money handling, date sorting) and a small, maintainable codebase rather than extensive UI polish or reporting features.

Intentional omissions

- No multi‑user signup flow beyond JWT scaffold.
- No pagination besides a 500 result cap on GET /expenses.
- No advanced reporting or audit UI — kept scope minimal and production‑minded.

Where to look

- Server entry: `backend/src/server.js`
- Routes: `backend/src/routes/expenses.js`
- Model: `backend/src/models/Expense.js`
- Frontend: `frontend/src/main.tsx` and `frontend/src/components`

Next steps I can help with

- Deploy backend to Render and frontend to Vercel (I can do this if you provide tokens/keys and env vars).
- Add CI workflow, custom domain, or small UI improvements.

If you want me to deploy, please tell me which option you prefer and provide the requested tokens/env vars (or I can give step‑by‑step instructions for manual deployment).
