
const express = require('express');
const path = require('path');
const app = express();

// Cloud Run/Firebase inyecta el puerto en la variable de entorno PORT
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Servir archivos estáticos
app.use(express.static(__dirname));

// Soporte para Single Page Application (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = app.listen(PORT, HOST, () => {
  console.log(`>>> Servidor TPRM iniciado`);
  console.log(`>>> Escuchando en http://${HOST}:${PORT}`);
});

// Manejo básico de señales de terminación para despliegues limpios
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Servidor cerrado por SIGTERM');
  });
});
