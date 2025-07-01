const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', qr => {
  console.log('📱 Escaneie o QR code abaixo para conectar:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('✅ Bot conectado. Listando grupos...\n');

  const chats = await client.getChats();
  const grupos = chats.filter(chat => chat.isGroup);

  if (grupos.length === 0) {
    console.log('⚠️ Nenhum grupo encontrado.');
    return;
  }

  grupos.forEach(chat => {
    console.log(`• ${chat.name} → ${chat.id._serialized}`);
  });

  process.exit(0); // encerra o script após listar
});

client.initialize();
