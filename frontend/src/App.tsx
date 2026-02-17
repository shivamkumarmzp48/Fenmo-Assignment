import { useCallback, useEffect, useMemo, useState } from "react";
import "./index.css";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpensesTable } from "./components/ExpensesTable";
import { AuthForm } from "./components/AuthForm";
import { listCategories, listExpenses, type Expense } from "./lib/api";
import { listPending, removePending } from "./lib/pendingSubmissions";
import { createExpense } from "./lib/api";

type Sort =
  | "date_desc"
  | "date_asc"
  | "amount_desc"
  | "amount_asc"
  | "category_asc"
  | "category_desc"
  | "created_desc";

function sumPaise(expenses: Expense[]) {
  return expenses.reduce((acc, e) => acc + (e.amountPaise ?? 0), 0);
}

function formatCurrencyINR(amountPaise: number) {
  const amount = amountPaise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sort, setSort] = useState<Sort>("date_desc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flushInfo, setFlushInfo] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const totalPaise = useMemo(() => sumPaise(expenses), [expenses]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eRes, cRes] = await Promise.all([
        listExpenses({ category: categoryFilter || undefined, sort }),
        listCategories(),
      ]);
      setExpenses(eRes.expenses);
      setCategories(cRes.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, sort]);

  useEffect(() => {
    // hydrate token from localStorage once on mount
    try {
      const t = localStorage.getItem('authToken');
      const u = localStorage.getItem('username');
      if (t) setToken(t);
      if (u) setUsername(u);
    } catch {
      // ignore
    }
  }, []);

  // When token changes, load expenses (or clear when logged out)
  useEffect(() => {
    if (token) {
      void load();
    } else {
      setExpenses([]);
      setCategories([]);
    }
  }, [load, token]);

  // On refresh/reopen: try to replay any pending submissions safely.
  useEffect(() => {
    if (!token) return;
    const pending = listPending();
    if (!pending.length) return;
    let cancelled = false;
    (async () => {
      setFlushInfo(`Replaying ${pending.length} pending submission(s)...`);
      try {
        for (const p of pending) {
          if (cancelled) return;
          try {
            await createExpense({ ...p.payload, idempotencyKey: p.idempotencyKey });
            removePending(p.idempotencyKey);
          } catch {
            // Leave it pending; user can retry by refreshing or submitting again.
          }
        }
      } finally {
        if (!cancelled) setFlushInfo(null);
        await load();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, token]);

  if (!token) {
    return <AuthForm onAuth={(tok, user) => { setToken(tok); setUsername(user); }} />;
  }
  return (
    <div className="page">
      <header className="header">
        <div>
          <h1 className="h1">Expense Tracker</h1>
          <div className="auth-user">Welcome, {username}! <button onClick={() => {
            try { localStorage.removeItem('authToken'); localStorage.removeItem('username'); } catch {}
            setToken(null); setUsername(null);
          }}>Logout</button></div>
        </div>
        <div className="kpi">
          <div className="kpiLabel">Total (visible)</div>
          <div className="kpiValue mono">{formatCurrencyINR(totalPaise)}</div>
        </div>
      </header>
      <div className="layout">
        <div className="left">
          <ExpenseForm onCreated={load} categories={categories} />
          <div className="card">
            <div className="cardHeader">
              <h2 className="h2">View controls</h2>
              <div className="row">
                <button type="button" onClick={load} disabled={loading}>
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>
            <div className="grid2">
              <label className="field">
                <span className="label">Filter by category</span>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} disabled={loading}>
                  <option value="">All</option>
                  {categories.map((c) => (
                    <option value={c} key={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">Sort</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} disabled={loading}>
                  <option value="date_desc">Date (newest first)</option>
                  <option value="date_asc">Date (oldest first)</option>
                  <option value="amount_desc">Amount (high → low)</option>
                  <option value="amount_asc">Amount (low → high)</option>
                  <option value="category_asc">Category (A → Z)</option>
                  <option value="category_desc">Category (Z → A)</option>
                </select>
              </label>
            </div>
            {flushInfo ? <div className="muted">{flushInfo}</div> : null}
            {error ? <div className="error">Error: {error}</div> : null}
          </div>
        </div>
        <div className="right">
          <ExpensesTable expenses={expenses} />
        </div>
      </div>
      {/* Footer removed as requested */}
    </div>
  );
}

export default App;
