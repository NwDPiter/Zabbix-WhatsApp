# 📦 WhatsApp Alert Bot

Projeto que envia alertas automaticamente para grupos do WhatsApp usando [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js).  
Compatível com GitHub, GitLab, Zabbix e agendamentos via `cron`.

---

## 🚀 O que ele automatiza?

- 🔔 Recebe alertas via Webhook:
  - PRs do **GitHub**
  - MRs do **GitLab**
  - Alertas do **Zabbix**
- 🕰️ Suporte a scripts agendados (`cron`)
- 📤 Envio automático para grupos do WhatsApp definidos via `.env`

---

## 🛠 Requisitos

| Recurso          | Uso                                                  |
|------------------|-------------------------------------------------------|
| Node.js 18+      | Para desenvolvimento local                            |
| Docker           | Execução recomendada em produção                      |
| Conta WhatsApp   | Vinculação via QR code                                |
| Zabbix           | Opcional para integrações de monitoramento            |
| GitHub / GitLab  | Para integração com webhooks                          |
| Traefik (opcional) | Reverso e autenticação básica via JWT               |

---

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
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - WHATSAPP_GROUP_A=${WHATSAPP_GROUP_A}
      - WHATSAPP_GROUP_B=${WHATSAPP_GROUP_B}
      - WHATSAPP_GROUP_C=${WHATSAPP_GROUP_C}
      - WHATSAPP_GROUP_D=${WHATSAPP_GROUP_D}
      - WHATSAPP_GROUP_E=${WHATSAPP_GROUP_E}
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
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - WHATSAPP_GROUP_A=${WHATSAPP_GROUP_A}
      - WHATSAPP_GROUP_B=${WHATSAPP_GROUP_B}
      - WHATSAPP_GROUP_C=${WHATSAPP_GROUP_C}
      - WHATSAPP_GROUP_D=${WHATSAPP_GROUP_D}
      - WHATSAPP_GROUP_E=${WHATSAPP_GROUP_E}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.whatsapp-api.rule=Host(`suaurl.com`) && PathPrefix(`/send`)"
      - "traefik.http.routers.whatsapp-api.entrypoints=websecure"
      - "traefik.http.routers.whatsapp-api.tls.certresolver=le"
      - "traefik.http.services.whatsapp-api.loadbalancer.server.port=3000"
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

## 📸 Autenticação via WhatsApp

## Quando subir a 1º vez essa aplicação, será necessário autenticar seu WhatsApp via QR que vai aparecer no teminal:

![alt text](/doc/QR.png)

### Depois de autenticar, vai aparecer as confirmações

![alt text](/doc/Posauth.png)

### Dependendo de como seja armazenado os diretórios de autenticação que serão gerados, a conexão será direta:

![alt text](/doc/ConexaoDireta.png)

### Diretorios gerados são:
 - .wwebjs_auth
 - .wwebjs_cache
   
🔒 OBS: Se apagados, a autenticação será necessária novamente.

## 📬 Endpoints da API

### 📍Rota
`POST /api/infra-alert`

### 📤 Body JSON
```json
{
  "group": "a",
  "message": "Serviço X está fora do ar 🚨"
}
```

### ✅ Exemplo de resposta
```json
{
  "success": true,
  "message": "Mensagem enviada com sucesso!"
}
```
---

### 📍Rota
`POST /api/github-notify`

### Body JSON `OPEN`
```json
{
  "group": "e",
  "action": "opened",
  "pull_request": {
    "title": "Nova feature de notificação",
    "user": {
      "login": "pedro-dev"
    },
    "html_url": "https://github.com/sua-org/seu-repo/pull/42",
    "base": {
      "ref": "main"
    },
    "head": {
      "ref": "feature/notificacao"
    }
  }
}

```

### 📩 Mensagem gerada:

    🚀 Nova Pull Request Aberta!
    👤 Autor: pedro-dev
    📄 Título: Nova feature de notificação
    🌿 De: feature/notificacao → Para: main
    🔗 Link: https://github.com/sua-org/seu-repo/pull/42 




### Body JSON `MERGE`
```json
{
  "group": "b",
  "pull_request": {
    "title": "Nova feature finalizada",
    "html_url": "https://github.com/org/repos/pull/101",
    "user": {
      "login": "pedro-dev"
    },
    "merged_by": {
      "login": "maintainer123"
    },
    "head": {
      "ref": "feature/nova"
    },
    "base": {
      "ref": "main"
    },
    "merged": true
  }
}
```

### 📩 Mensagem gerada:

    🎉 PR Mergeada!
    👤 Autor: pedro-dev
    🔁 Mergeado por: maintainer123
    📄 Título: Feature: envio de alertas
    🔗 Link: https://github.com/org/repos/pull/101

---

### 📍Rota
`POST /api/gitlab-notify`

### Body JSON `OPEN`
```json
{
  "group": "e",
  "event": "opened",
  "merge_request": {
    "title": "Hotfix: pipeline de produção",
    "user": {
      "username": "ci-runner"
    },
    "source_branch": "oi",
    "target_branch": "teste",
    "url": "https://gitlab.com/org/repo/-/merge_requests/42",
    "merged": false
  }
}
```

### 📩 Mensagem gerada:

    🚀 Merge Request Aberta!
    👤 Autor: Pedro_Sales
    📄 Título: Hotfix: pipeline de produção
    🌱 De: deploy → Para: master
    🔗 Link: https://gitlab.com/nwdpiter-group/NwDPiter-project/-/merge_requests/18 

### Body JSON `MERGE`
```json
{
  "group": "c",
  "event": "merged",
  "merge_request": {
    "title": "Hotfix: pipeline de produção",
    "user": { "username": "ci-runner" },
    "merged_by": { "username": "admin" },
    "url": "https://gitlab.com/org/repo/-/merge_requests/42",
    "merged": true
  }
}
```

### 📩 Mensagem gerada:

    🎉 Merge Concluído!
    👤 Autor: ci-runner
    🔁 Mergeado por: admin
    📄 Título: Hotfix: pipeline de produção
    🔗 Link: https://gitlab.com/org/repo/-/merge_requests/42

---
### 🔐 Como funcionam os grupos via .env?

Em vez de escrever o nome do grupo no JSON, você usa uma letra identificadora (como "a", "b", "c") e define o ID real no .env:

WHATSAPP_GROUP_A=1203xxxx@g.us # Grupo A

WHATSAPP_GROUP_B=1203yyyy@g.us # Equipe Devs

WHATSAPP_GROUP_C=1203zzzz@g.us # Pipeline GitLab

EX:

    req(a) -> .env(WHATSAPP_GROUP_A=1203xxxx@g.us # Grupo A)
  
    req(b) -> .env(WHATSAPP_GROUP_B=1203yyyy@g.us # Equipe Devs)
  
    req(c) -> .env(HATSAPP_GROUP_C=1203zzzz@g.us # Pipeline GitLab)

### 📌 Como pegar o id do grupo?

Já deixei um script pronto para isso: "src/scripts/listar-grupos.js"

  1. Conecta sua conta do WhatsApp via QR Code
  2. Vai listar todos os grupos dos quais você participa
  3. Exibe o nome do grupo e o ID necessário para o .env

### ✅ Exemplo de saída:

    • Equipe DevOps → 1203yyyy@g.us
    • Alertas Zabbix → 1203zzzz@g.us

### Copie o ID desejado e adicione ao seu .env:

    WHATSAPP_GROUP_B=1203yyyy@g.us # Equipe DevOps
    WHATSAPP_GROUP_C=1203zzzz@g.us # Alertas Zabbix
  

## ⏰ Agendando com Cron monitoramento de infra
### Script exemplo:

```yml
#!/bin/bash
curl -X POST http://localhost:3000/api/infra-alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SEU_TOKEN}" \
  -d '{"group": "a", "message": "Backup finalizado com sucesso ✅"}'
```
## Agende o script utilizando o crontab:
  crontab -e

## Adicione a seguinte linha para executar diariamente:
```perl
0 1 * * * /caminho/para/seu/script.sh
```

### Exemplo de .env

JWT_SECRET=SUA_SENHA # O code gerará um token com essa senha

DEVICE=/local/backup # Armazena o login para não ter que autenticar novamente

WHATSAPP_GROUP_A=1203xxxx@g.us # Grupo A          

WHATSAPP_GROUP_B=1203yyyy@g.us # Equipe Devs

WHATSAPP_GROUP_C=1203zzzz@g.us # Pipeline GitLab

WHATSAPP_GROUP_D=1234@vazio    # Vago

WHATSAPP_GROUP_E=1234@vazio    # Vago

## ✨ Contribuições
Sinta-se livre para abrir issues, PRs ou ideias no repositório: [https://github.com/NwDPiter/whatsapp_alert_bot_api.git](https://github.com/NwDPiter/whatsapp_alert_bot_api.git)
