const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { client, isReady } = require('../services/whatsappClient');
const logger = require('../config/logger');
const authMiddleware = require('../middlewares/auth');

// Middleware de autenticação
router.use(authMiddleware);

// Rate limiter para evitar flood
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

  const { group: groupName, event, merge_request: mr } = req.body;

  if (!isReady()) {
    logger.warn('Bot ainda não está pronto');
    return res.status(503).json({ error: 'Bot ainda não está pronto.' });
  }

  if (!groupName) {
    logger.error('Parâmetro "group" é obrigatório');
    return res.status(400).json({ error: 'Parâmetro "group" é obrigatório.' });
  }

  if (!event || !mr) {
    logger.error('Campos "event" ou "merge_request" ausentes');
    return res.status(400).json({ error: 'Parâmetro "event" e objeto "merge_request" são obrigatórios.' });
  }

  // Monta a mensagem
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
🌱 De: ${mr.source_branch || '??'} → Para: ${mr.target_branch || '??'}
🔗 Link: ${mr.url || 'Sem link'}`;
  }

  // Nenhum evento relevante
  if (!message) {
    logger.info('Evento ignorado: sem mensagem gerada.');
    return res.status(200).json({ message: 'Evento ignorado.' });
  }

  try {
    const chats = await client.getChats();
    const targetGroup = chats.find(c => c.isGroup && c.name === groupName);

    if (!targetGroup || !targetGroup.id || !targetGroup.id._serialized) {
      logger.error(`Grupo "${groupName}" não encontrado ou sem ID válido`);
      return res.status(404).json({ error: 'Grupo não encontrado ou inválido.' });
    }

    if (typeof message !== 'string' || !message.trim()) {
      logger.warn('Mensagem vazia ou malformada');
      return res.status(400).json({ error: 'Mensagem inválida. Verifique o conteúdo enviado.' });
    }

    // Envia mensagem com proteção contra erro de serialização
    try {
      await client.sendMessage(targetGroup.id._serialized, message);
      logger.info(`Mensagem enviada para "${groupName}": ${message}`);
      return res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
    } catch (sendError) {
      if (sendError.message?.includes('serialize')) {
        logger.warn(`Mensagem enviada, mas erro ao serializar resposta do WhatsApp: ${sendError.message}`);
        return res.status(207).json({
          warning: true,
          message: 'Mensagem possivelmente enviada, mas ocorreu erro de serialização ao processar o retorno.'
        });
      }

      // Outros erros não previstos
      throw sendError;
    }

  } catch (error) {
    if (error.message?.includes('getChats')) {
      logger.error('Erro ao listar chats:', error);
      return res.status(502).json({ error: 'Erro ao acessar WhatsApp Web.' });
    }

    logger.error('Erro inesperado ao enviar mensagem:', error);
    return res.status(500).json({ error: 'Erro interno inesperado.' });
  }
});

module.exports = router;
