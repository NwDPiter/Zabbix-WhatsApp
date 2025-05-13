// gerar-token.js
const jwt = require('jsonwebtoken');

const payload = { username: 'github-bot' };
const secret = 'SEU_SECRET'; // mesma usada no backend
const options = { expiresIn: '10y' }; 

const token = jwt.sign(payload, secret, options);
console.log(token);
