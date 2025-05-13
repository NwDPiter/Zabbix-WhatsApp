const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { client, isReady } = require('../services/whatsappClient');
const logger = require('../config/logger');
const authMiddleware = require('../middlewares/auth'); 

// Middleware de autenticação
router.use(authMiddleware);

// Rate limiter para a rota específica
const githubNotifyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 6, // máximo de 6 requisições por IP
  message: {
    error: 'Muitas requisições. Tente novamente mais tarde.'
  }
});

router.post('/github-notify', githubNotifyLimiter, async (req, res) => {
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
    if (event === 'pull_request' && (payload.pull_request?.merged === "true" || payload.pull_request?.merged === true)) {
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
      logger.info(`Mensagem enviada para o grupo "${groupName}":\n${message}`);

      return res.json({ success: true, message: "Mensagem enviada com sucesso!" });
    }

    return res.status(200).json({ message: "Evento ignorado." });

  } catch (error) {
    logger.error("Erro ao processar webhook:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
});

module.exports = router;

// 