# 🤖 Bot WhatsApp com Webhook para Zabbix

Este projeto cria um bot que se conecta ao WhatsApp Web e permite o envio de mensagens para grupos via requisição HTTP. Ideal para integrações com sistemas de monitoramento como o **Zabbix**, via **webhooks**.

---

## 🚀 Funcionalidades

- Conecta ao WhatsApp via [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- Expõe uma rota HTTP `/send` para envio de mensagens
- Suporte a **mensagens para grupos**
- Deploy via **Docker**
- Compatível com **Traefik** (incluindo autenticação básica opcional)
- Ideal para receber alertas do Zabbix via webhook

---

## 📦 Requisitos

- Node.js 18+ (para rodar localmente) **ou**
- Docker + Docker Compose
- Navegador (Puppeteer já cuida disso)
- WhatsApp logado (via QR Code)

---

## 🧑‍💻 Executando localmente

```bash
npm install
node index.js
