const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const logger = require('../config/logger');

let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./.wwebjs_auth" }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox']
  }
});

client.on('qr', qr => {
  logger.info('📲 Escaneie o QR Code abaixo:');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  logger.info(`🔐 Autenticação realizada com sucesso em ${new Date().toLocaleString()}`);
});

client.on('ready', () => {
  logger.info('✅ Bot conectado ao WhatsApp!');
  isReady = true;
});

module.exports = { client, isReady: () => isReady };
