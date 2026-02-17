const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    amountPaise: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR" },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    categoryNormalized: { type: String, required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 240 },
    date: { type: Date, required: true },

    // Enables idempotent POST /expenses when client retries.
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false,
  },
);

ExpenseSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    // Convenience for UIs while keeping integer-safe representation.
    ret.amount = (Number(ret.amountPaise) / 100).toFixed(2);
    delete ret._id;
    delete ret.categoryNormalized;
    delete ret.idempotencyKey;
    return ret;
  },
});

const Expense = mongoose.model("Expense", ExpenseSchema);

module.exports = { Expense };

