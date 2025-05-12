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

      logger.info(`${message} [${requestId}] ${timestamp} - ${req.method} ${req.originalUrl} ${res.statusCode} (${durationMs} ms) IP: ${ip}`);
      } catch (err) {
        console.error('Erro ao registrar log de requisição:', err);
      }
    });

    next();
  }

module.exports = logRequest;


  //const forwardedFor = req.headers['x-forwarded-for']?.split(',').map(ip => ip.trim());

//  res.on('finish', () => {
//    const diff = process.hrtime(startTime);
//    const durationMs = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(3); // ex: 6.424 ms
//
//    const now = new Date();
//const formattedIsoLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
//// Exemplo: "2025-04-21 16:13:19"
//
//    logger.info(`${formattedIsoLocal} http: ${req.method} ${req.originalUrl} ${res.statusCode} - - ${durationMs} ms`);
//  });
//
//  next();
//}