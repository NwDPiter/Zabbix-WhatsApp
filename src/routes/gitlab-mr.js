const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { client, isReady } = require('../services/whatsappClient');
const logger = require('../config/logger');
const authMiddleware = require('../middlewares/auth');

// Autenticação
router.use(authMiddleware);

// Rate limiter customizado
const gitlabNotifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  handler: (req, res) => {
    return res.status(429).json({ error: 'Muitas requisições. Tente novamente mais tarde.' });
  }
});

router.post('/gitlab-notify', gitlabNotifyLimiter, async (req, res) => {
  // Verifica que o body foi parseado
  if (!req.body) {
    return res.status(400).json({ error: 'Payload inválido ou JSON ausente.' });
  }

  const { group: groupName, action, pull_request: mr } = req.body;

  // Bot pronto?
  if (!isReady()) {
    logger.warn('Bot ainda não está pronto');
    return res.status(503).json({ error: 'Bot ainda não está pronto.' });
  }

  // Campos obrigatórios
  if (!groupName) {
    logger.error('Parâmetro "group" é obrigatório');
    return res.status(400).json({ error: 'Parâmetro "group" é obrigatório.' });
  }

  if (!action || !mr) {
    logger.error('Campos "action" ou "pull_request" ausentes');
    return res.status(400).json({ error: 'Parâmetro "action" e objeto "pull_request" são obrigatórios.' });
  }

  // Monta mensagem conforme o evento
  let message = null;
  if (action === 'opened') {
    message = `🚀 Merge Request Aberta!
👤 Autor: ${mr.user?.login || 'desconhecido'}
📄 Título: ${mr.title || 'Sem título'}
🌱 De: ${mr.head?.ref || '??'} → Para: ${mr.base?.ref || '??'}
🔗 Link: ${mr.html_url || 'Sem link'}`;
  }

  if (action === 'closed' && mr.merged === true) {
    message = `🎉 Merge Realizado!
👤 Autor: ${mr.user?.login || 'desconhecido'}
🔁 Mergeado por: ${mr.merged_by?.login || 'desconhecido'}
📄 Título: ${mr.title || 'Sem título'}
🌱 De: ${mr.head?.ref || '??'} → Para: ${mr.base?.ref || '??'}
🔗 Link: ${mr.html_url || 'Sem link'}`;
  }

  // Se não for evento relevante, ignora
  if (!message) {
    return res.status(200).json({ message: 'Evento ignorado.' });
  }

  try {
    // Busca chats e encontra o grupo
    const chats = await client.getChats();
    const targetGroup = chats.find(c => c.isGroup && c.name === groupName);

    if (!targetGroup) {
      logger.error(`Grupo "${groupName}" não encontrado`);
      return res.status(404).json({ error: 'Grupo não encontrado.' });
    }

    // Envia mensagem
    await client.sendMessage(targetGroup.id._serialized, message);
    logger.info(`Mensagem enviada para "${groupName}": ${message}`);
    return res.json({ success: true, message: 'Mensagem enviada com sucesso!' });

  } catch (error) {
    // Distinguindo falhas
    if (error.message?.includes('getChats')) {
      logger.error('Falha ao listar chats:', error);
      return res.status(502).json({ error: 'Erro ao acessar WhatsApp Web.' });
    }

    logger.error('Erro ao enviar mensagem:', error);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
