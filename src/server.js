const express = require('express');
const logger = require('./config/logger');
const { client } = require('./services/whatsappClient');
const sendMessageRoute = require('./routes/sendMessage');
const logRequest = require('./middlewares/logRequest');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(logRequest);
app.use('/', sendMessageRoute);

app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

client.initialize();
