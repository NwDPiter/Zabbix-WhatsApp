const express = require('express');
const logger = require('./config/logger');
const { client } = require('./services/whatsappClient');
const sendIfraAlert = require('./routes/infra-alert');
const sendStatusPr = require('./routes/github-pr');
const sendGitlabMr = require('./routes/gitlab-mr');
const logRequest = require('./middlewares/logRequest');

const app = express();
const PORT = 3000;

// 🔒 Ativa o trust proxy para capturar corretamente o IP real
app.set('trust proxy','loopback', 1);

app.use(express.json());
app.use(logRequest);

// Rotas
app.use('/api', sendGitlabMr);
app.use('/api', sendIfraAlert);
app.use('/api', sendStatusPr);

app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

client.initialize();
