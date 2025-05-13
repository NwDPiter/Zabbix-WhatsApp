require('dotenv').config();
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET; // Use o mesmo segredo do auth.js

const token = jwt.sign(
  {
    userId: 1,
    name: 'Client'
  },
  secret,
  { expiresIn: '1h' }
);

console.log('Token JWT válido:\n');
console.log(token);
