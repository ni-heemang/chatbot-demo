const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 8080;
const PUBLIC_DIR = __dirname;
const LOCAL_SITE_KEY = 'pk_19fad37d1a2089fa935727fe76b47ccf';
const LOCAL_WIDGET_LOADER = 'http://localhost:3001';
const STAGING_WIDGET_LOADER = 'https://staging.chatbot.officeagent.kr/widget-loader.js';

// MIME type mapping
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function resolvePath(pathname) {
  // Remove leading slash
  let requestPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;

  // Root path
  if (requestPath === '' || requestPath === '/') {
    return path.join(PUBLIC_DIR, 'index.html');
  }

  // Directory with trailing slash → index.html
  if (requestPath.endsWith('/')) {
    return path.join(PUBLIC_DIR, requestPath, 'index.html');
  }

  // Clean URL support: /price → price.html
  const filePath = path.join(PUBLIC_DIR, requestPath);

  // Check if the exact file exists
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  // Try adding .html extension
  const htmlPath = filePath + '.html';
  if (fs.existsSync(htmlPath)) {
    return htmlPath;
  }

  // Try as directory with index.html
  const indexPath = path.join(filePath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return indexPath;
  }

  return null;
}

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Internal Server Error\n');
      console.error(`Error reading file: ${filePath}`, err.message);
      return;
    }

    const mimeType = getMimeType(filePath);
    let body = data;
    if (path.extname(filePath).toLowerCase() === '.html') {
      body = data
        .toString('utf8')
        .replace(/__SITE_KEY__/g, LOCAL_SITE_KEY)
        .replace(/__CHATBOT_DOMAIN__/g, LOCAL_WIDGET_LOADER)
        .split(STAGING_WIDGET_LOADER).join(LOCAL_WIDGET_LOADER);
    }
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(body);
  });
}

function serve404(res) {
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!DOCTYPE html>\n<html>\n<head><title>404 Not Found</title></head>\n<body><h1>404 Not Found</h1></body>\n</html>\n');
}

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

  console.log(`${req.method} ${pathname}`);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('405 Method Not Allowed\n');
    return;
  }

  const filePath = resolvePath(pathname);

  if (!filePath) {
    serve404(res);
    return;
  }

  // Security: ensure resolved path is within PUBLIC_DIR
  const realPath = path.resolve(filePath);
  const realPublicDir = path.resolve(PUBLIC_DIR);

  if (!realPath.startsWith(realPublicDir)) {
    serve404(res);
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      serve404(res);
      return;
    }

    serveFile(filePath, res);
  });
});

server.listen(PORT, () => {
  console.log(`Static server running on http://localhost:${PORT}`);
  console.log(`Serving files from: ${PUBLIC_DIR}`);
});
