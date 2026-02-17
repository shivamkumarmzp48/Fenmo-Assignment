const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { expensesRouter } = require("./routes/expenses");
const { errorHandler, notFoundHandler } = require("./middleware/error");

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(morgan("dev"));

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
      credentials: false,
    }),
  );

  app.use(express.json({ limit: "50kb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

    app.use("/expenses", expensesRouter);
    const authRouter = require("./routes/auth");
    app.use("/auth", authRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

