import http from 'http';
import fs from 'fs';
import path from 'path';
const roots = {
  '/': path.resolve('./app'),
  '/lib': path.resolve('./lib'),
};
const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml' };
const s=http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split('?')[0]);
  if(p==='/') p='/index.html';
  const mount = p === '/lib' || p.startsWith('/lib/') ? '/lib' : '/';
  const relative = mount === '/lib' ? p.slice('/lib'.length) : p;
  const root = roots[mount];
  const file = path.resolve(root, `.${relative}`);
  if(file !== root && !file.startsWith(`${root}${path.sep}`)) { res.writeHead(403); return res.end(); }
  if (mount === '/lib' && path.extname(file) !== '.js') { res.writeHead(404); return res.end('not found '+p); }
  if(!fs.existsSync(file)){ res.writeHead(404, {'Content-Type':'text/plain'}); return res.end('not found '+p); }
  const ext=path.extname(file);
  res.writeHead(200, {'Content-Type': mime[ext]||'text/plain', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-cache'});
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
});
const port=5173;
s.listen(port,()=>console.log(`Steady static at http://localhost:${port} — serving app/`));
