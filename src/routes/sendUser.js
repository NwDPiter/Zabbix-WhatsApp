const express = require('express');
const router = express.Router();
const { client, isReady } = require('../services/whatsappClient');
const logger = require('../config/logger');

router.post('/send-user', async (req, res) => {
  if (!isReady()) {
    logger.warn('Bot ainda não está pronto');
    return res.status(503).json({ error: "Bot ainda não está pronto." });
  }

  const { number, message } = req.body;

  if (!number || !message) {
    logger.error('Parâmetros "number" e "message" são obrigatórios');
    return res.status(400).json({ error: 'Parâmetros "number" e "message" são obrigatórios.' });
  }

  try {
    // Adiciona o sufixo "@c.us" que é exigido pelo WhatsApp Web para números individuais
    const chatId = `${number}@c.us`;

    await client.sendMessage(chatId, message);
    logger.info(`
        -------------------------------------------
        Mensagem: ${message}
        Número: ${number}
        Status: Enviado com sucesso!
        Data/Hora: ${new Date().toLocaleString()}
        -------------------------------------------
    `);
    return res.json({ success: true, message: "Mensagem enviada com sucesso!" });
  } catch (error) {
    logger.error("Erro ao enviar mensagem:", error);
    return res.status(500).json({ error: "Erro interno ao enviar mensagem." });
  }
});

module.exports = router;
