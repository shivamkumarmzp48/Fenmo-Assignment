const express = require("express");
const { z } = require("zod");

const { Expense } = require("../models/Expense");
const { asyncHandler } = require("../utils/asyncHandler");
const { parseMoneyToPaise } = require("../utils/money");
const { requireAuth } = require("../middleware/auth");

const expensesRouter = express.Router();

const createExpenseSchema = z.object({
  amount: z.union([z.string(), z.number()]),
  category: z.string().min(1).max(80),
  description: z.string().min(1).max(240),
  date: z.string().min(1),
  requestId: z.string().optional(),
});

function normalizeCategory(category) {
  return category.trim().toLowerCase();
}

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

expensesRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: { message: "Invalid request body", details: parsed.error.flatten() },
      });
    }

    const idempotencyKey =
      req.get("Idempotency-Key")?.trim() || parsed.data.requestId?.trim();
    if (!idempotencyKey) {
      return res.status(400).json({
        error: { message: "Missing idempotency key (Idempotency-Key header or requestId)" },
      });
    }

    if (idempotencyKey.length > 200) {
      return res.status(400).json({ error: { message: "idempotency key is too long" } });
    }

    let amountPaise;
    try {
      amountPaise = parseMoneyToPaise(parsed.data.amount);
    } catch (err) {
      return res.status(400).json({ error: { message: err instanceof Error ? err.message : "Invalid amount" } });
    }
    const category = parsed.data.category.trim();
    const categoryNormalized = normalizeCategory(category);
    const description = parsed.data.description.trim();

    const date = new Date(parsed.data.date);
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ error: { message: "Invalid date" } });
    }

    const existing = await Expense.findOne({ idempotencyKey, user: req.userId });
    if (existing) {
      return res.status(200).json({ expense: existing.toJSON(), idempotentReplay: true });
    }

    try {
      const created = await Expense.create({
        amountPaise,
        category,
        categoryNormalized,
        description,
        date,
        idempotencyKey,
        user: req.userId,
      });

      return res.status(201).json({ expense: created.toJSON() });
    } catch (err) {
      // If two identical idempotent requests race, unique index wins.
      if (err && err.code === 11000) {
        const afterRace = await Expense.findOne({ idempotencyKey });
        if (afterRace) {
          return res.status(200).json({ expense: afterRace.toJSON(), idempotentReplay: true });
        }
      }
      throw err;
    }
  }),
);

expensesRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { category, sort } = req.query;

    const filter = { user: req.userId };
    if (typeof category === "string" && category.trim()) {
      // Case-insensitive exact match on category string.
      filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, "i");
    }

    const mongoSort = {};
    // Supported sorts: date_desc, date_asc, amount_desc, amount_asc,
    // category_asc, category_desc, created_desc (default)
    switch (sort) {
      case "date_desc":
        mongoSort.date = -1;
        mongoSort.created_at = -1;
        break;
      case "date_asc":
        mongoSort.date = 1;
        mongoSort.created_at = 1;
        break;
      case "amount_desc":
        mongoSort.amountPaise = -1;
        mongoSort.date = -1;
        break;
      case "amount_asc":
        mongoSort.amountPaise = 1;
        mongoSort.date = -1;
        break;
      case "category_asc":
        mongoSort.categoryNormalized = 1;
        mongoSort.date = -1;
        break;
      case "category_desc":
        mongoSort.categoryNormalized = -1;
        mongoSort.date = -1;
        break;
      case "created_desc":
        mongoSort.created_at = -1;
        break;
      default:
        mongoSort.created_at = -1;
    }

    const expenses = await Expense.find(filter).sort(mongoSort).limit(500);
    res.json({ expenses: expenses.map((e) => e.toJSON()) });
  }),
);

expensesRouter.get(
  "/categories",
  requireAuth,
  asyncHandler(async (req, res) => {
    const categories = await Expense.distinct("category", { user: req.userId });
    categories.sort((a, b) => a.localeCompare(b));
    res.json({ categories });
  }),
);

module.exports = { expensesRouter };

