/**
 * 本地预览网关：静态 docs + 反代 /api → Next(:5000)
 * 供已对外的 cloudflared 隧道继续挂 8765，不改公网域名。
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../docs');
const PORT = Number(process.env.PREVIEW_PORT || 8765);
const API_ORIGIN = process.env.API_ORIGIN || 'http://127.0.0.1:5000';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function proxyApi(req, res) {
  const target = new URL(req.url, API_ORIGIN);
  const headers = { ...req.headers, host: target.host };
  delete headers['accept-encoding'];
  const pReq = http.request(
    target,
    { method: req.method, headers },
    (pRes) => {
      const out = {
        ...pRes.headers,
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-allow-headers': 'Content-Type',
      };
      res.writeHead(pRes.statusCode || 502, out);
      pRes.pipe(res);
    }
  );
  pReq.on('error', (err) => {
    send(res, 502, `API proxy error: ${err.message}`, {
      'content-type': 'text/plain; charset=utf-8',
    });
  });
  req.pipe(pReq);
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    return send(res, 403, 'Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return send(res, 404, 'Not Found', { 'content-type': 'text/plain; charset=utf-8' });
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    return send(res, 204, null, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
    });
  }
  if ((req.url || '').startsWith('/api/')) return proxyApi(req, res);
  return serveStatic(req, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[preview-gateway] http://127.0.0.1:${PORT} → docs + ${API_ORIGIN}/api`);
});
