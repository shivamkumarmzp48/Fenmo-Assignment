export type Expense = {
  id: string;
  amountPaise: number;
  amount: string; // "12.50"
  currency: "INR";
  category: string;
  description: string;
  date: string; // ISO
  created_at: string; // ISO
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || "";

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // attach auth token automatically when available
    const headers = new Headers(init?.headers || {});
    try {
      const t = localStorage.getItem('authToken');
      if (t) headers.set('Authorization', `Bearer ${t}`);
    } catch {}

    const res = await fetch(input, { ...init, headers, signal: controller.signal });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const message = data?.error?.message || `Request failed (${res.status})`;
      throw new Error(message);
    }
    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function getApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("Missing VITE_API_BASE_URL. Create frontend/.env (see .env.example).");
  }
  return API_BASE_URL;
}

export type SortOption =
  | "date_desc"
  | "date_asc"
  | "amount_desc"
  | "amount_asc"
  | "category_asc"
  | "category_desc"
  | "created_desc";

export async function listExpenses(params: { category?: string; sort?: SortOption }) {
  const url = new URL(joinUrl(getApiBaseUrl(), "/expenses"));
  if (params.category) url.searchParams.set("category", params.category);
  if (params.sort) url.searchParams.set("sort", params.sort);
  return fetchJson<{ expenses: Expense[] }>(url);
}

export async function listCategories() {
  const url = joinUrl(getApiBaseUrl(), "/expenses/categories");
  return fetchJson<{ categories: string[] }>(url);
}

export async function createExpense(input: {
  amount: string;
  category: string;
  description: string;
  date: string; // yyyy-mm-dd
  idempotencyKey: string;
}) {
  const url = joinUrl(getApiBaseUrl(), "/expenses");
  return fetchJson<{ expense: Expense; idempotentReplay?: boolean }>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      amount: input.amount,
      category: input.category,
      description: input.description,
      date: input.date,
    }),
  });
}

