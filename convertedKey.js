const fs = require('fs');

const json = fs.readFileSync('./firebase-service-key.json', 'utf8');
const encoded = Buffer.from(json).toString('base64');
console.log(encoded); // ✅ copy this output only
