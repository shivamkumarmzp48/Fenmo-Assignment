function notFoundHandler(_req, res) {
  res.status(404).json({ error: { message: "Not found" } });
}

function errorHandler(err, _req, res, _next) {
  const status = typeof err?.status === "number" ? err.status : 500;

  const message =
    status >= 500
      ? "Internal server error"
      : err?.message || "Request failed";

  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({
    error: {
      message,
      code: err?.code,
    },
  });
}

module.exports = { errorHandler, notFoundHandler };

