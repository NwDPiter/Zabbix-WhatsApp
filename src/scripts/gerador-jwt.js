// geraToken.js
const jwt = require('jsonwebtoken');

const payload = {
  userId: 1,
  name: "Usuário Teste"
};

const secret = "SEU_SECRET"; // Substitua pela sua real JWT_SECRET

const token = jwt.sign(payload, secret, { expiresIn: '1h' });

console.log("Seu token JWT:");
console.log(token);
