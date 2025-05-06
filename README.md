# 📦 WhatsApp Alert Bot

Este projeto permite enviar alertas automaticamente para grupos do WhatsApp usando a biblioteca [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js). Ele pode ser integrado ao Zabbix via webhook ou usado em scripts agendados com `cron`.

## 🚀 O que o projeto automatiza?
- Recebe requisições HTTP com alertas do Zabbix (via webhook).
- Pode ser chamado via `curl` em scripts executados por `cron`.
- Localiza o grupo do WhatsApp configurado.
- Envia a mensagem de alerta automaticamente.

## 🛠 Requisitos
- Node.js 18+ (para rodar localmente)
- Conta do WhatsApp válida
- Docker (recomendado)
- Zabbix configurado com webhook (opcional)
- Cron (opcional, para agendamentos)
- Traefik (opcional para exposição segura com autenticação)

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
  
OBS: No uso de auth será obrigatório alterar o cabeçalho da requisição, inserindo as credenciais criptografadas em base64, no terminal linux, faça:

```bash
echo -n 'SEULogin:SUASenha' | base64
```

<<<<<<< HEAD
Vai retornar algo como:
```
=======
Vai retornal algo como:
```bash
>>>>>>> 7dee9ca (scripts e correção de readme)
YWRtaW46bWluaGFTZW5oYVNlZ3VyYQ==
```

Exemplo de requisição:
```yml
curl -X POST http://localhost:3000/api/send-group \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YWRtaW46bWluaGFTZW5oYTEyMw==" \
  -d '{
    "group": "API",
    "message": "Olá, isso é um teste automatizado 🚀😊"
}'
```

## Quando subir a 1º essa aplicação, será necessário autenticar seu WhatsApp via QR que vai aparecer no teminal:

![alt text](/doc/QR.png)

### Depois de autenticar, vai aparecer as confirmações

![alt text](/doc/Posauth.png)

### Dependendo de como seja armazenado os diretórios de autenticação que serão gerados, a conexão será direta:

![alt text](/doc/ConexaoDireta.png)

### Diretorios gerados são:
 - .wwebjs_auth
 - .wwebjs_cache
   
OBS: Caso exclua-os terá que autenticar novamente.

## 📬 Endpoint da API
### URL
`POST /send-group`

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

## Utilização com cron (via curl)
### Crie um script bash para enviar mensagens agendadas:

```yml
#!/bin/bash
curl -X POST http://localhost:3000/api/send-group \
  -H "Content-Type: application/json" \
  -d '{"group": "Alertas Diários", "message": "Backup finalizado com sucesso."}'
```
## Agende o script utilizando o crontab:

    crontab -e

## Adicione a seguinte linha para executar diariamente:
```perl
0 1 * * * /caminho/para/o/script.sh
```

## ✨ Contribuições
Sinta-se livre para abrir issues, PRs ou ideias no repositório: [https://github.com/NwDPiter/Zabbix-WhatsApp](https://github.com/NwDPiter/Zabbix-WhatsApp)
