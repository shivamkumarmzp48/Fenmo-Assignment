import { useEffect, useMemo, useRef, useState } from "react";
import { addPending, removePending } from "../lib/pendingSubmissions";
import { createExpense } from "../lib/api";

type Props = {
  onCreated: () => void;
  categories: string[];
};

function todayYyyyMmDd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function ExpenseForm({ onCreated, categories }: Props) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayYyyyMmDd());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attemptKeyRef = useRef<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!amount.trim()) return false;
    if (!category.trim()) return false;
    if (!description.trim()) return false;
    if (!date.trim()) return false;
    // Client-side quick rejection for obvious negative indicators.
    if (/^-/.test(amount.trim()) || /\(|\)/.test(amount.trim())) return false;
    return true;
  }, [amount, category, description, date]);

  useEffect(() => {
    // Reset idempotency attempt if user edits any field after a failure.
    attemptKeyRef.current = null;
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, category, description, date]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    const idempotencyKey = attemptKeyRef.current ?? crypto.randomUUID();
    attemptKeyRef.current = idempotencyKey;

    const payload = {
      amount: amount.trim(),
      category: category.trim(),
      description: description.trim(),
      date: date.trim(),
    };

    // Persist before sending so refresh/retry can replay safely.
    addPending({ idempotencyKey, payload, createdAt: Date.now() });

    try {
      await createExpense({
        ...payload,
        idempotencyKey,
      });
      removePending(idempotencyKey);

      setAmount("");
      setCategory("");
      setDescription("");
      setDate(todayYyyyMmDd());
      attemptKeyRef.current = null;

      onCreated();
    } catch (err) {
      // Prefer any server-provided message (via Error.message).
      setError(err instanceof Error ? err.message : "Failed to create expense");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="cardHeader">
        <h2 className="h2">Add expense</h2>
        <p className="muted">Safe against retries/refreshes (idempotent submit).</p>
      </div>

      <div className="grid2">
        <label className="field">
          <span className="label">Amount (₹)</span>
          <input
            inputMode="decimal"
            placeholder="e.g. 125.50"
            value={amount}
            onChange={(e) => {
              const v = e.target.value;
              // Clear error when user edits.
              setError(null);
              // Quick client-side check for negatives and parentheses used for negatives.
              if (/^-/.test(v.trim()) || /\(.*\)/.test(v)) {
                setError("negative amount is not allowed");
              }
              setAmount(v);
            }}
            disabled={submitting}
            required
          />
        </label>

        <label className="field">
          <span className="label">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={submitting}
            required
          />
        </label>

        <label className="field">
          <span className="label">Category</span>
          <input
            list="categories"
            placeholder="e.g. Food"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={submitting}
            required
          />
          <datalist id="categories">
            {categories.map((c) => (
              <option value={c} key={c} />
            ))}
          </datalist>
        </label>

        <label className="field">
          <span className="label">Description</span>
          <input
            placeholder="e.g. Lunch at office"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            required
          />
        </label>
      </div>

      {error ? <div className="error">Error: {error}</div> : null}

      <div className="row">
        <button type="submit" disabled={!canSubmit || submitting}>
          {submitting ? "Saving..." : "Add expense"}
        </button>
      </div>
    </form>
  );
}

