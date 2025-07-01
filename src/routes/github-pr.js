const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { client, isReady } = require('../services/whatsappClient');
const logger = require('../config/logger');
const authMiddleware = require('../middlewares/auth');

require('dotenv').config(); // Garante que o .env seja carregado

// Mapear os grupos disponíveis a partir do .env
const GROUP_IDS = {
  a: process.env.WHATSAPP_GROUP_A,
  b: process.env.WHATSAPP_GROUP_B,
  c: process.env.WHATSAPP_GROUP_C,
  d: process.env.WHATSAPP_GROUP_D,
  e: process.env.WHATSAPP_GROUP_E
};

router.use(authMiddleware);

const githubNotifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' }
});

router.post('/github-notify', githubNotifyLimiter, async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;
  const groupKey = payload.group;

  const targetId = GROUP_IDS[groupKey];

  if (!isReady()) {
    logger.warn('Bot ainda não está pronto');
    return res.status(503).json({ error: 'Bot ainda não está pronto.' });
  }

  if (!targetId) {
    logger.error(`Grupo "${groupKey}" não configurado no .env`);
    return res.status(400).json({ error: 'Grupo não reconhecido. Verifique a chave enviada.' });
  }

  let message = null;

  try {
    if (event === 'pull_request') {
      const pr = payload.pull_request;

      if (pr?.merged === true) {
        message = `🎉 *PR Mergeada!*
👤 Autor: ${pr.user?.login || 'desconhecido'}
🔁 Mergeado por: ${pr.merged_by?.login || 'desconhecido'}
📄 Título: ${pr.title || 'Sem título'}
🌿 De: ${pr.head?.ref || '??'} → Para: ${pr.base?.ref || '??'}
🔗 Link: ${pr.html_url || 'Sem URL'}`;
      }

      if (payload.action === 'opened') {
        message = `🚀 *Nova Pull Request Aberta!*
👤 Autor: ${pr.user?.login || 'desconhecido'}
📄 Título: ${pr.title || 'Sem título'}
🌿 De: ${pr.head?.ref || '??'} → Para: ${pr.base?.ref || '??'}
🔗 Link: ${pr.html_url || 'Sem URL'}`;
      }
    }

    if (!message) {
      logger.info('Evento ignorado: sem mensagem gerada.');
      return res.status(200).json({ message: 'Evento ignorado.' });
    }

    if (typeof message !== 'string' || !message.trim()) {
      logger.warn('Mensagem vazia ou malformada');
      return res.status(400).json({ error: 'Mensagem inválida. Verifique o conteúdo.' });
    }

    try {
      await client.sendMessage(targetId, message);
      logger.info(`Mensagem enviada para grupo "${groupKey}" (${targetId}):\n${message}`);
      return res.json({ success: true, message: 'Mensagem enviada com sucesso!' });

    } catch (sendError) {
      if (sendError.message?.includes('serialize')) {
        logger.warn(`Mensagem enviada, mas erro de serialização: ${sendError.message}`);
        return res.status(207).json({
          warning: true,
          message: 'Mensagem possivelmente enviada, mas erro ao processar retorno do WhatsApp.'
        });
      }

      throw sendError;
    }

  } catch (error) {
    logger.error('Erro inesperado ao processar webhook:', error);
    return res.status(500).json({ error: 'Erro interno inesperado.' });
  }
});

module.exports = router;