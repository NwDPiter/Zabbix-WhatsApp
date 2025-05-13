const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit'); 
const { client, isReady } = require('../services/whatsappClient');
const logger = require('../config/logger');
const authMiddleware = require('../middlewares/auth');

// Middleware de autenticação
router.use(authMiddleware);

// Rate limiter específico para /infra-alert
const infraAlertLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // até 10 requisições por IP por minuto
  message: { error: 'Muitas requisições. Tente novamente em breve.' }
});

router.post('/infra-alert', infraAlertLimiter, async (req, res) => {
  if (!isReady()) {
    logger.warn('Bot ainda não está pronto');
    return res.status(503).json({ error: "Bot ainda não está pronto." });
  }

  const { group, message } = req.body;

  if (!group || !message) {
    logger.error('Parâmetros "group" e "message" são obrigatórios');
    return res.status(400).json({ error: "Parâmetros 'group' e 'message' são obrigatórios." });
  }

  try {
    const chats = await client.getChats();
    const targetGroup = chats.find(chat => chat.isGroup && chat.name === group);

    if (!targetGroup) {
      logger.error('Grupo não encontrado');
      return res.status(404).json({ error: "Grupo não encontrado" });
    }

    await client.sendMessage(targetGroup.id._serialized, message);
    logger.info(`
        -------------------------------------------
        Mensagem: ${message}
        Grupo: "${group}"
        Status: Enviado com sucesso!
        Data/Hora: ${new Date().toLocaleString()}
        -------------------------------------------
      `);      
    return res.json({ success: true, message: "Mensagem enviada com sucesso!" });
  } catch (error) {
    logger.error("Erro ao enviar mensagem:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
});

module.exports = router;
