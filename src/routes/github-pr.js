const express = require('express');
const router = express.Router();
const { client, isReady } = require('../services/whatsappClient');
const logger = require('../config/logger');

router.post('/github-notify', async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;
  const groupName = req.body.group;

  if (!isReady()) {
    logger.warn('Bot ainda não está pronto');
    return res.status(503).json({ error: "Bot ainda não está pronto." });
  }

  if (!groupName) {
    logger.error('Parâmetro "group" é obrigatório');
    return res.status(400).json({ error: "Parâmetro 'group' é obrigatório." });
  }

  let message = null;

  try {
    if (event === 'pull_request_review' && payload.review.state === 'approved') {
      const { title, html_url, user, head, base } = payload.pull_request;

      message = `✅ *PR Aprovada!*
👤 Autor: ${user.login}
📄 Título: ${title}
🌿 De: ${head.ref} → Para: ${base.ref}
🔗 Link: ${html_url}`;
    }

    if (event === 'pull_request' && payload.action === 'closed' && payload.pull_request.merged) {
      const { title, html_url, user, head, base } = payload.pull_request;

      message = `🎉 *PR Mergeada!*
👤 Autor: ${user.login}
📄 Título: ${title}
🌿 De: ${head.ref} → Para: ${base.ref}
🔗 Link: ${html_url}`;
    }

    if (message) {
      const chats = await client.getChats();
      const targetGroup = chats.find(chat => chat.isGroup && chat.name === groupName);

      if (!targetGroup) {
        logger.error(`Grupo "${groupName}" não encontrado`);
        return res.status(404).json({ error: "Grupo não encontrado" });
      }

      await client.sendMessage(targetGroup.id._serialized, message);
      logger.info(`
        -------------------------------------------
        Mensagem enviada:
        ${message}
        Grupo: "${groupName}"
        Evento: ${event}
        Data/Hora: ${new Date().toLocaleString()}
        -------------------------------------------
      `);

      return res.json({ success: true, message: "Mensagem enviada com sucesso!" });
    }

    // Se o evento não for relevante
    return res.status(200).json({ message: "Evento ignorado." });

  } catch (error) {
    logger.error("Erro ao processar webhook:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
});

module.exports = router;
