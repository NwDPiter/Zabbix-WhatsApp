const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Alvos (personalize com os serviços que deseja monitorar)
const alvos = [
    { nome: "NOME_SERVIÇO", url: "URL_PARA_MONITORAR", grupo: "GRUPO_ZAP" },
    { nome: "NOME_SERVIÇO", url: "URL_PARA_MONITORAR", grupo: "GRUPO_ZAP" },
];

const estadoArquivo = path.join(__dirname, 'estado_sem_auth.json');

// Carregar estado anterior
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

// Salvar estado atual
function salvarEstado(estado) {
    const salvar = JSON.parse(JSON.stringify(estado));
    for (const url in salvar) {
        if (salvar[url].inicio_falha) {
            salvar[url].inicio_falha = new Date(salvar[url].inicio_falha).toISOString();
        }
    }
    fs.writeFileSync(estadoArquivo, JSON.stringify(salvar, null, 4));
}

// URL do serviço de notificação (sem auth)
const urlNotificacao = "http://localhost:3000/api/infra-alert";

// Envia uma notificação para o grupo
async function notificar(grupo, mensagem) {
    try {
        const r = await axios.post(urlNotificacao, {
            group: grupo,
            message: mensagem
        });
        console.log(`[${new Date().toISOString()}] Enviado: ${r.status}`);
    } catch (e) {
        console.error(`Erro ao notificar: ${e.message}`);
    }
}

// Faz a verificação dos serviços
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

// Executar script
(async () => {
    const estado = carregarEstado();
    await verificar(estado);
})();
