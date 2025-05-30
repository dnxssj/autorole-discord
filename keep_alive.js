const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot online');
});

app.listen(3000, () => {
  console.log('🌐 Keep-alive server iniciado en el puerto 3000');
});
