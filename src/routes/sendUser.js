const express = require('express');
const router = express.Router();
const { client, isReady } = require('../services/whatsappClient');
const logger = require('../config/logger');

router.post('/send-user', async (req, res) => {
  if (!isReady()) {
    logger.warn('Bot ainda não está pronto');
    return res.status(503).json({ error: "Bot ainda não está pronto." });
  }

  let { number, message } = req.body;

  if (!number || !message) {
    logger.error('Parâmetros "number" e "message" são obrigatórios');
    return res.status(400).json({ error: 'Parâmetros "number" e "message" são obrigatórios.' });
  }

  // Limpa o número: remove tudo que não for dígito
  number = number.replace(/\D/g, '');

  // Verifica se o número parece válido (pelo menos 10 dígitos para DDI+DDD+NÚMERO)
  if (number.length < 10) {
    logger.warn(`Número inválido recebido: ${number}`);
    return res.status(400).json({ error: 'Número de telefone inválido.' });
  }

  const chatId = `${number}@c.us`;

  try {
    // Confere se o número é um usuário válido do WhatsApp
    const isRegistered = await client.isRegisteredUser(chatId);
    if (!isRegistered) {
      logger.warn(`Número não registrado no WhatsApp: ${number}`);
      return res.status(400).json({ error: "Número não registrado no WhatsApp." });
    }

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
