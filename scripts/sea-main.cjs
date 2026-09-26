// Entry point for the single-file Windows executable (see scripts/build-exe.mjs).
// Serves the embedded app from Node SEA assets on 127.0.0.1 and opens the browser.
// CommonJS because Node 24 single executable applications require a CommonJS main.
const { createServer } = require('node:http');
const { extname } = require('node:path');
const { spawn } = require('node:child_process');
const sea = require('node:sea');

const port = Number(process.env.PORT || 4173);
const url = `http://127.0.0.1:${port}/`;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function openBrowser() {
  if (process.env.P5X_NO_BROWSER) return;
  if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
  else spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
}

function readAsset(pathname) {
  let key = pathname.replace(/^\/+/, '');
  if (key === '' || key.endsWith('/')) key += 'index.html';
  try {
    return { key, body: Buffer.from(sea.getAsset(key)) };
  } catch {
    return null;
  }
}

const server = createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, url).pathname);
  } catch {
    pathname = '';
  }
  const asset = pathname && !pathname.includes('..') ? readAsset(pathname) : null;
  if (!asset) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, {
    'content-type': mime[extname(asset.key)] || 'application/octet-stream',
    'cache-control': 'no-store'
  });
  response.end(asset.body);
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    // Another copy is already running on this port: reuse it.
    console.log(`P5X Guild Boss Lab is already running. Opening ${url}`);
    openBrowser();
    setTimeout(() => process.exit(0), 1000);
    return;
  }
  console.error(error);
  process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`P5X Guild Boss Lab running at ${url}`);
  console.log('Close this window to stop the simulator.');
  openBrowser();
});
