// Tiny zero-dependency static server for the Prieseity site.
// Usage: node serve.js   ->  http://localhost:5173
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'site');
const port = process.env.PORT || 5173;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.webm': 'video/webm', '.mp4': 'video/mp4',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, path.normalize(p));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    const ok = !err && st.isFile();
    const target = ok ? file : path.join(root, '404.html');
    const type = types[path.extname(target)] || 'application/octet-stream';
    // byte ranges so videos can seek
    const range = ok && req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {
      const start = range[1] ? +range[1] : 0;
      const end = range[2] ? Math.min(+range[2], st.size - 1) : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      return fs.createReadStream(target, { start, end }).pipe(res);
    }
    res.writeHead(ok ? 200 : 404, { 'Content-Type': type, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(target).pipe(res);
  });
}).listen(port, () => console.log(`Prieseity running at http://localhost:${port}`));
