const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { client, isReady } = require('../services/whatsappClient');
const logger = require('../config/logger');
const authMiddleware = require('../middlewares/auth');

require('dotenv').config();

// Mapear os grupos disponíveis a partir do .env
const GROUP_IDS = {
  a: process.env.WHATSAPP_GROUP_A,
  b: process.env.WHATSAPP_GROUP_B,
  c: process.env.WHATSAPP_GROUP_C,
  d: process.env.WHATSAPP_GROUP_D,
  e: process.env.WHATSAPP_GROUP_E
};

router.use(authMiddleware);

const gitlabNotifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  handler: (req, res) => {
    return res.status(429).json({ error: 'Muitas requisições. Tente novamente mais tarde.' });
  }
});

router.post('/gitlab-notify', gitlabNotifyLimiter, async (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Payload inválido ou JSON ausente.' });
  }

  const { group: groupKey, event, merge_request: mr } = req.body;

  const targetId = GROUP_IDS[groupKey];

  if (!isReady()) {
    logger.warn('Bot ainda não está pronto');
    return res.status(503).json({ error: 'Bot ainda não está pronto.' });
  }

  if (!targetId) {
    logger.error(`Grupo "${groupKey}" não está configurado no .env`);
    return res.status(400).json({ error: 'Grupo não reconhecido. Verifique a chave enviada.' });
  }

  if (!event || !mr) {
    logger.error('Campos "event" ou "merge_request" ausentes');
    return res.status(400).json({ error: 'Parâmetro "event" e objeto "merge_request" são obrigatórios.' });
  }

  let message = null;

  if (event === 'opened') {
    message = `🚀 Merge Request Aberta!
👤 Autor: ${mr.user?.username || 'desconhecido'}
📄 Título: ${mr.title || 'Sem título'}
🌱 De: ${mr.source_branch || '??'} → Para: ${mr.target_branch || '??'}
🔗 Link: ${mr.url || 'Sem link'}`;
  }

  if (event === 'merged' && mr.merged === true) {
    message = `🎉 Merge Concluído!
👤 Autor: ${mr.user?.username || 'desconhecido'}
🔁 Mergeado por: ${mr.merged_by?.username || 'desconhecido'}
📄 Título: ${mr.title || 'Sem título'}
🔗 Link: ${mr.url || 'Sem link'}`;
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
    await client.sendPresenceAvailable();

    try {
      await client.sendMessage(targetId, message);
      logger.info(`Mensagem enviada para grupo "${groupKey}" (${targetId}):\n${message}`);
      return res.json({ success: true, message: 'Mensagem enviada com sucesso!' });

    } catch (sendError) {
      if (sendError.message?.includes('serialize')) {
        logger.warn(`Mensagem enviada, mas erro de serialização: ${sendError.message}`);
        return res.status(207).json({
          warning: true,
          message: 'Mensagem possivelmente enviada, mas erro ao processar retorno.'
        });
      }
      throw sendError;
    }

  } catch (error) {
    logger.error('Erro ao processar webhook:', error);
    return res.status(500).json({ error: 'Erro interno inesperado.' });
  }
});

module.exports = router;
