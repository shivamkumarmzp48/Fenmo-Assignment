require("dotenv").config();

const { createApp } = require("./app");
const { connectToDb } = require("./db");
const { Expense } = require("./models/Expense");

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

async function main() {
  // Require JWT_SECRET to be set to avoid runtime jwt.sign errors
  if (!process.env.JWT_SECRET) {
    // eslint-disable-next-line no-console
    console.error('Missing JWT_SECRET in environment. Set JWT_SECRET in backend/.env');
    process.exit(1);
  }
  await connectToDb(process.env.MONGODB_URI);
  // Ensure indexes (unique idempotency key) are created.
  await Expense.init();

  const app = createApp();

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

