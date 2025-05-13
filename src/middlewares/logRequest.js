const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid'); 

function logRequest(req, res, next) {
  const requestId = uuidv4(); // ID único por requisição
  const startTime = process.hrtime(); // melhor precisão de tempo

  // Captura IP do cliente real se estiver atrás de proxy
  const ip = req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : req.ip;

  res.on('finish', () => {
    try {
      const diff = process.hrtime(startTime);
      const durationMs = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(3);

      const timestamp = new Date().toLocaleString("pt-BR");

      logger.info(`[${requestId}] ${timestamp} - ${req.method} ${res.statusCode} ${req.originalUrl} (${durationMs} ms) IP: ${ip}`);
      } catch (err) {
        console.error('Erro ao registrar log de requisição:', err);
      }
    });

    next();
  }

module.exports = logRequest;