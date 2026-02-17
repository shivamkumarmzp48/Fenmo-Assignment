const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// When running tests, use a stable synthetic user id so idempotency and per-user
// scoping behave deterministically without requiring real users.
const TEST_USER_ID = process.env.NODE_ENV === 'test' ? (process.env.TEST_USER_ID || new mongoose.Types.ObjectId().toString()) : null;

function requireAuth(req, res, next) {
  // Allow skipping auth during tests or when DISABLE_AUTH=true (useful for CI/local tests)
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_AUTH === 'true') {
    req.userId = TEST_USER_ID;
    return next();
  }
  const auth = req.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Missing Authorization header' } });
  }
  const token = auth.slice(7).trim();
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: { message: 'Server not configured (missing JWT_SECRET)' } });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    req.username = payload.username;
    return next();
  } catch (err) {
    return res.status(401).json({ error: { message: 'Invalid token' } });
  }
}

module.exports = { requireAuth };
