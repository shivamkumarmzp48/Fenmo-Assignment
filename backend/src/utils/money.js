function parseMoneyToPaise(amountInput) {
  const raw = String(amountInput ?? "").trim();
  if (!raw) throw new Error("amount is required");

  // Detect common indications of negative values and reject them explicitly.
  // Examples: "-123", "- ₹1,234.00", "(1,234.00)".
  if (/^-/.test(raw) || /\(.*\)/.test(raw)) {
    throw new Error("negative amount is not allowed");
  }

  // Allow common input like: "123", "123.4", "123.45", with optional
  // thousands separators or currency symbol (e.g. "₹5,432.00").
  // Normalize by removing currency symbol and commas/spaces.
  const cleaned = raw.replace(/[₹,\s]/g, "");

  const match = cleaned.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) throw new Error("amount must be a positive number with up to 2 decimals");

  const rupees = Number(match[1]);
  const decimals = match[2] ?? "";
  const paise = Number((decimals + "00").slice(0, 2));

  const total = rupees * 100 + paise;
  if (!Number.isSafeInteger(total)) throw new Error("amount is too large");
  if (total === 0) throw new Error("amount must be greater than 0");
  return total;
}

function formatPaiseToRupeesString(amountPaise) {
  const rupees = (Number(amountPaise) / 100).toFixed(2);
  return rupees;
}

module.exports = { parseMoneyToPaise, formatPaiseToRupeesString };

