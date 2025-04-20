const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: "./.wwebjs_auth" }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

client.on('qr', qr => {
    console.log('📲 Escaneie o QR Code abaixo:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot conectado ao WhatsApp!');
});

app.post('/send', async (req, res) => {
    const { group, message } = req.body;

    if (!group || !message) {
        return res.status(400).json({ error: "Parâmetros 'group' e 'message' são obrigatórios." });
    }

    try {
        const chats = await client.getChats();
        const targetGroup = chats.find(chat => chat.isGroup && chat.name === group);

        if (!targetGroup) {
            return res.status(404).json({ error: "Grupo não encontrado" });
        }

        await client.sendMessage(targetGroup.id._serialized, message);
        return res.json({ success: true, message: "Mensagem enviada!" });
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        return res.status(500).json({ error: "Erro interno ao enviar mensagem." });
    }
});

client.initialize();