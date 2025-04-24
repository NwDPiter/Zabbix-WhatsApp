# 📦 Zabbix WhatsApp Alert Bot

Este projeto permite que alertas do Zabbix sejam enviados automaticamente para grupos do WhatsApp via integração com [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js).

## 🚀 O que o projeto automatiza?
- Recebe requisições HTTP com alertas do Zabbix (via webhook).
- Localiza o grupo do WhatsApp configurado.
- Envia a mensagem de alerta automaticamente.

## 🛠 Requisitos
- Node.js 18+
- Conta do WhatsApp válida
- Zabbix configurado para enviar alertas por webhook
- Docker (opcional)
- Traefik (opcional para exposição segura)

## 📁 Clonando o projeto
```bash
git clone https://github.com/NwDPiter/Zabbix-WhatsApp.git
cd Zabbix-WhatsApp
```

## 🧪 Rodando localmente
```bash
npm install
npm start
```
Ao iniciar, será exibido um QR Code no terminal. Escaneie com seu WhatsApp.

## 🐳 Rodando com Docker
### Build da imagem:
```bash
docker build -t latixa12/api .
```

### docker-compose (sem Traefik):
```yaml
version: '3.8'
services:
  whatsapp-api:
    image: latixa12/api
    container_name: whatsapp-api
    volumes:
      - ./.wwebjs_auth:/app/.wwebjs_auth
      - ./.wwebjs_cache:/app/.wwebjs_cache
    ports:
      - "3000:3000"
```

### docker-compose com Traefik + Autenticação
```yaml
version: '3.8'
services:
  whatsapp-api:
    image: latixa12/api
    container_name: whatsapp-api
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.whatsapp-api.rule=Host(`suaurl.com`) && PathPrefix(`/send`)"
      - "traefik.http.routers.whatsapp-api.entrypoints=websecure"
      - "traefik.http.routers.whatsapp-api.tls.certresolver=le"
      - "traefik.http.middlewares.auth.basicauth.users=usuario:senha_encriptada"
      - "traefik.http.routers.whatsapp-api.middlewares=auth"
    volumes:
      - ./.wwebjs_auth:/app/.wwebjs_auth
      - ./.wwebjs_cache:/app/.wwebjs_cache
    networks:
      - web

networks:
  web:
    external: true
```
> 🔐 Gere a senha com `htpasswd -nb admin senha` ou online em: https://bcrypt-generator.com/

Retornado algo como:

    `admin:$2y$05$eEr3H9ZkEWiRp1Ab7Zd7t.hJzEHFYEXAMPLEBCRYPTd8RZrcXgzIQT7xW`

OBS: Caso passe esse valor nas envs do poratiner ou diretamente no docker adicione mais um "$", se não passar o docker vai entender como uma variável, fica assim:

    `admin:$$2y$$05$$eEr3H9ZkEWiRp1Ab7Zd7t.hJzEHFYEXAMPLEBCRYPTd8RZrcXgzIQT7xW`

## 📬 Endpoint da API
### URL
`POST /send`

### Body JSON
```json
{
  "group": "Nome do Grupo",
  "message": "Mensagem de alerta do Zabbix"
}
```

### Exemplo de resposta
```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso!"
}
```

### Exemplo de input no Zabbix (via webhook personalizado)
```json
{
  "group": "Alertas Zabbix",
  "message": "{HOST.NAME} está com problema: {TRIGGER.NAME}"
}
```

## ✨ Contribuições
Sinta-se livre para abrir issues, PRs ou ideias no repositório: [https://github.com/NwDPiter/Zabbix-WhatsApp](https://github.com/NwDPiter/Zabbix-WhatsApp)

