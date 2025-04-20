const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const winston = require('winston'); // Importando o winston para logs

const app = express();
const PORT = 3000;

// Configuração do logger com winston
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'app.log' }) // Salva os logs em arquivo
  ]
});

app.use(express.json()); // Middleware para ler JSON

let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./.wwebjs_auth" }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox']
  }
});

// Evento de QR Code gerado
client.on('qr', qr => {
  logger.info('📲 Escaneie o QR Code abaixo:');
  qrcode.generate(qr, { small: true });
});

// Evento de bot pronto
client.on('ready', () => {
  logger.info('✅ Bot conectado ao WhatsApp!');
  isReady = true;
});

// Endpoint para enviar mensagens
app.post('/send', async (req, res) => {
  //logger.info('Payload recebido: ', req.body);

  if (!isReady) {
    logger.warn('Bot ainda não está pronto');
    return res.status(503).json({ error: "Bot ainda não está pronto." });
  }

  const { group, message } = req.body;

  if (!group || !message) {
    logger.error('Parâmetros "group" e "message" são obrigatórios');
    return res.status(400).json({ error: "Parâmetros 'group' e 'message' são obrigatórios." });
  }

  try {
    const chats = await client.getChats();
    const targetGroup = chats.find(chat => chat.isGroup && chat.name === group);

    if (!targetGroup) {
      logger.error('Grupo não encontrado');
      return res.status(404).json({ error: "Grupo não encontrado" });
    }

    await client.sendMessage(targetGroup.id._serialized, message);
    logger.info(`
        -------------------------------------------
        Mensagem: ${message}
        Grupo: "${group}"
        Status: Enviado com sucesso!
        Data/Hora: ${new Date().toLocaleString()}
        -------------------------------------------
      `);      
    return res.json({ success: true, message: "Mensagem enviada com sucesso!" });
  } catch (error) {
    logger.error("Erro ao enviar mensagem:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

// Inicializa o cliente do WhatsApp
client.initialize();
