import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number.parseInt(process.env.PORT || '5174', 10);

const mime = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
]);

function resolveRequest(url) {
  const parsed = new URL(url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(parsed.pathname);
  const relative = pathname === '/' ? '/examples/browser-microscope/' : pathname;
  const fullPath = path.resolve(root, `.${relative}`);
  if (!fullPath.startsWith(root)) return null;
  return relative.endsWith('/') ? path.join(fullPath, 'index.html') : fullPath;
}

const server = http.createServer(async (request, response) => {
  const filePath = resolveRequest(request.url || '/');
  if (!filePath) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      'content-type': mime.get(path.extname(filePath)) || 'application/octet-stream',
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`ChewGum Dithering Gun microscope: http://localhost:${port}/examples/browser-microscope/`);
});
