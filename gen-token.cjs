const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 1 }, 'neon-secret-key-2077');
console.log(token);
