const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Alvos
const alvos = [
    { nome: "NOME_SERVIÇO", url: "URL_PARA_MONITORAR", grupo: "GRUPO_ZAP" },
    { nome: "NOME_SERVIÇO", url: "URL_PARA_MONITORAR", grupo: "GRUPO_ZAP" },
];

const estadoArquivo = path.join(__dirname, 'estado_com_auth.json');

// Carregar e salvar estado
function carregarEstado() {
    if (fs.existsSync(estadoArquivo)) {
        const raw = fs.readFileSync(estadoArquivo);
        const estado = JSON.parse(raw);
        for (const url in estado) {
            if (estado[url].inicio_falha) {
                estado[url].inicio_falha = new Date(estado[url].inicio_falha);
            }
        }
        return estado;
    } else {
        const inicial = {};
        alvos.forEach(alvo => {
            inicial[alvo.url] = { online: true, inicio_falha: null, nome: alvo.nome, grupo: alvo.grupo };
        });
        salvarEstado(inicial);
        return inicial;
    }
}

function salvarEstado(estado) {
    const salvar = JSON.parse(JSON.stringify(estado));
    for (const url in salvar) {
        if (salvar[url].inicio_falha) {
            salvar[url].inicio_falha = new Date(salvar[url].inicio_falha).toISOString();
        }
    }
    fs.writeFileSync(estadoArquivo, JSON.stringify(salvar, null, 4));
}

// Autenticação
const usuario = "SEU_USUARIO"; // Usuário do serviço de notificação
const senha = "SEU_SENHA"; // Senha do serviço de notificação

// Criação do cabeçalho de autenticação
const auth = Buffer.from(`${usuario}:${senha}`).toString('base64');
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`
};

// URL do serviço de notificação
const urlNotificacao = "NONE"; // https://SUA_URL/api/send-group || localhost:3000/api/send-group

// Enviar notificação
async function notificar(grupo, mensagem) {
    try {
        const r = await axios.post(urlNotificacao, {
            group: grupo,
            message: mensagem
        }, { headers });
        console.log(`[${new Date().toISOString()}] Enviado: ${r.status}`);
    } catch (e) {
        console.error(`Erro ao notificar: ${e.message}`);
    }
}

// Verificar serviços
async function verificar(estado) {
    for (const alvo of alvos) {
        const { url, nome, grupo } = alvo;
        const servico = estado[url];
        let online = false;
        const agora = new Date();

        try {
            const res = await axios.get(url, { timeout: 5000 });
            online = res.status === 200;
        } catch {
            online = false;
        }

        if (online && !servico.online) {
            const minutos = Math.floor((agora - new Date(servico.inicio_falha)) / 60000);
            const msg = `*Mensagem Automática* 📡\n\n*Serviço:* ${nome}\n*Status:* Voltou ao ar ✅\n*Hora:* ${agora.toLocaleString("pt-BR")}\n*Fora do ar por:* ${minutos} minutos`;
            await notificar(grupo, msg);
            servico.online = true;
            servico.inicio_falha = null;
        } else if (!online && servico.online) {
            const msg = `*Mensagem Automática* 🚨\n\n*Serviço*: ${nome}\n*Status*: Fora do ar ⛔\n*Hora da Falha*: ${agora.toLocaleString("pt-BR")}`;
            await notificar(grupo, msg);
            servico.online = false;
            servico.inicio_falha = agora; 
        }
    }

    salvarEstado(estado);
}

// Executar
(async () => {
    const estado = carregarEstado();
    await verificar(estado);
})();
