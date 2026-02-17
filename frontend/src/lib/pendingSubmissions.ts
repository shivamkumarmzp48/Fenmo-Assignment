export type PendingExpenseSubmission = {
  idempotencyKey: string;
  payload: {
    amount: string;
    category: string;
    description: string;
    date: string;
  };
  createdAt: number;
  lastError?: string;
};

const STORAGE_KEY = "fenmoExpense.pendingSubmissions.v1";

function readAll(): PendingExpenseSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeAll(items: PendingExpenseSubmission[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 20)));
}

export function addPending(item: PendingExpenseSubmission) {
  const all = readAll().filter((x) => x.idempotencyKey !== item.idempotencyKey);
  all.unshift(item);
  writeAll(all);
}

export function removePending(idempotencyKey: string) {
  const all = readAll().filter((x) => x.idempotencyKey !== idempotencyKey);
  writeAll(all);
}

export function listPending() {
  return readAll();
}

