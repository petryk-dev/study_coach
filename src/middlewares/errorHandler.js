const { logError } = require('../utils/logger');

// Catches errors passed to next(err) or thrown in route handlers.
function errorHandler(err, req, res, next) {
  logError(`!!! ${req.method} ${req.originalUrl}`, err.stack || err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}

module.exports = errorHandler;
