const logger = require('../config/logger');

function logRequest(req, res, next) {
  logger.info(`📥 Requisição recebida: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
}

module.exports = logRequest;
