# Zabbix-n8n-WhatsApp
Esse repositório tem como alvo fazer a integração entre 3 serviços.

Zabbix -> n8n -> WhatsApp

## Explicação

1º Zabbix configurado para enviar uma requisição via webhook no link do n8n em caso de incidente

- Cada incidente no zabbix tem seu link no n8n que vai responder de acordo com a requisição
    
2º N8N configurado para após receber a requisição, chamar a API que vai enviar uma mesagem em um grupo do WhatsApp

3º Por fim a API, que vai enviar a mesagem para o grupo informado no cabeçalho da requisição 

