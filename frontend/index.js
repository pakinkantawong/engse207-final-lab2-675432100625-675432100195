const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const envOrFallback = (keys, fallback) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return fallback;
};

const runtimeConfig = {
  AUTH_URL: envOrFallback(['AUTH_URL', 'VITE_AUTH_URL', 'NEXT_PUBLIC_AUTH_URL'], 'http://localhost:3001'),
  TASK_URL: envOrFallback(['TASK_URL', 'VITE_TASK_URL', 'NEXT_PUBLIC_TASK_URL'], 'http://localhost:3002'),
  USER_URL: envOrFallback(['USER_URL', 'VITE_USER_URL', 'NEXT_PUBLIC_USER_URL'], 'http://localhost:3003')
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }

      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const requestPath = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;

  if (requestPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (requestPath === '/config.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    res.end(`window.APP_CONFIG = ${JSON.stringify(runtimeConfig, null, 2)};\n`);
    return;
  }

  const routeMap = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/logs.html': 'logs.html'
  };

  const target = routeMap[requestPath];
  if (target) {
    sendFile(res, path.join(BASE_DIR, target));
    return;
  }

  const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
  const resolvedPath = path.join(BASE_DIR, safePath);

  if (!resolvedPath.startsWith(BASE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(resolvedPath, (error, stats) => {
    if (error || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    sendFile(res, resolvedPath);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Frontend server listening on ${HOST}:${PORT}`);
});
