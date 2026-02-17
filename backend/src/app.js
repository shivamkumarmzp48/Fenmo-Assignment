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

  const FRONTEND_ORIGINS = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  app.use(
    cors({
      origin: function (origin, callback) {
        // allow non-browser tools or same-origin requests
        if (!origin) return callback(null, true);
        if (FRONTEND_ORIGINS.length === 0 || FRONTEND_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("CORS origin not allowed"), false);
      },
      credentials: true,
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


// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const morgan = require("morgan");

// const { expensesRouter } = require("./routes/expenses");
// const { errorHandler, notFoundHandler } = require("./middleware/error");

// function createApp() {
//   const app = express();

//   app.use(helmet());
//   app.use(morgan("dev"));

//   app.use(
//     cors({
//       origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
//       credentials: true,
//     }),
//   );

//   app.use(express.json({ limit: "50kb" }));

//   app.get("/health", (_req, res) => {
//     res.json({ ok: true });
//   });

//     app.use("/expenses", expensesRouter);
//     const authRouter = require("./routes/auth");
//     app.use("/auth", authRouter);

//   app.use(notFoundHandler);
//   app.use(errorHandler);

//   return app;
// }

// module.exports = { createApp };

