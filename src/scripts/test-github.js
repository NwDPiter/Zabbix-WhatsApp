// testWebhook.js
const axios = require('axios');

// JWT gerado com o mesmo segredo do backend (ex: 'teste')
const token = 'SEU_TOKEN_JWT_AQUI';

const payload = {
  group: 'SEU_GRUPO',
  pull_request: {
    title: 'TESTE',
    html_url: 'https://github.com/org/repo/pull/456',
    user: {
      login: 'dev456'
    },
    merged_by: {
      login: 'maintainer789'
    },
    head: {
      ref: 'feature/TEST'
    },
    base: {
      ref: 'main'
    },
    merged: true
  }
};

(async () => {
  try {
    const response = await axios.post('http://localhost:3000/api/github-notify', payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-github-event': 'pull_request',
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✅ Sucesso:');
    console.log(response.data);
  } catch (error) {
    if (error.response) {
      console.error('❌ Erro na resposta do servidor:');
      console.error(`Status: ${error.response.status}`);
      console.error(error.response.data);
    } else {
      console.error('❌ Erro na requisição:');
      console.error(error.message);
    }
  }
})();
