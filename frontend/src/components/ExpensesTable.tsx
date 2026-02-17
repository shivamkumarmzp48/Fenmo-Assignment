import type { Expense } from "../lib/api";

function formatCurrencyINR(amountPaise: number) {
  const amount = amountPaise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
}

export function ExpensesTable({ expenses }: { expenses: Expense[] }) {
  if (!expenses.length) {
    return (
      <div className="card">
        <h2 className="h2">Expenses</h2>
        <p className="muted">No expenses found for the current filters.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="tableHeader">
        <h2 className="h2">Expenses</h2>
        <div className="muted">Count: {expenses.length}</div>
      </div>

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th className="date">Date</th>
              <th className="category">Category</th>
              <th className="description">Description</th>
              <th className="right amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id}>
                <td className="date">{formatDate(e.date)}</td>
                <td className="category">{e.category}</td>
                <td className="ellipsis" title={e.description}>
                  {e.description}
                </td>
                <td className="right mono">{formatCurrencyINR(e.amountPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

