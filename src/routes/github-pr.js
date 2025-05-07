const express = require('express');
const router = express.Router();
const { client, isReady } = require('../services/whatsappClient');
const logger = require('../config/logger');

router.post('/github-notify', async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;
  const groupName = payload.group;

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
    // Evento: Revisão aprovada
    if (event === 'pull_request_review' && payload.review?.state === 'approved') {
      const pr = payload.pull_request || {};
      const reviewer = payload.review?.user?.login || 'desconhecido';

      message = `✅ *PR Aprovada!*
👤 Autor: ${pr.user?.login || 'desconhecido'}
✔️ Aprovada por: ${reviewer}
📄 Título: ${pr.title || 'Sem título'}
🌿 De: ${pr.head?.ref || '??'} → Para: ${pr.base?.ref || '??'}
🔗 Link: ${pr.html_url || 'Sem URL'}`;
    }

    // Evento: PR fechada e mergeada
    if (event === 'pull_request' && payload.pull_request?.merged === "true" || payload.pull_request?.merged === true) {
      const pr = payload.pull_request;

      message = `🎉 *PR Mergeada!*
👤 Autor: ${pr.user?.login || 'desconhecido'}
🔀 Feita merge por: ${pr.merged_by?.login || 'desconhecido'}
📄 Título: ${pr.title || 'Sem título'}
🌿 De: ${pr.head?.ref || '??'} → Para: ${pr.base?.ref || '??'}
🔗 Link: ${pr.html_url || 'Sem URL'}`;
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

    return res.status(200).json({ message: "Evento ignorado." });

  } catch (error) {
    logger.error("Erro ao processar webhook:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
});

module.exports = router;
