const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const HOST = '0.0.0.0';

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  if (extname === '.css') contentType = 'text/css';
  if (extname === '.js') contentType = 'text/javascript';
  if (extname === '.png') contentType = 'image/png';
  if (extname === '.jpg') contentType = 'image/jpg';
  if (extname === '.gif') contentType = 'image/gif';
  if (extname === '.svg') contentType = 'image/svg+xml';
  if (extname === '.json') contentType = 'application/json';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - Fichier non trouvé</h1>', 'utf-8');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Serveur QR Code en cours d'exécution sur http://${HOST}:${PORT}`);
});
