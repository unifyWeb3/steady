import http from 'http';
import fs from 'fs';
import path from 'path';
const root = path.resolve('./app');
const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml' };
const s=http.createServer((req,res)=>{
  let p = req.url.split('?')[0];
  if(p==='/') p='/index.html';
  const file = path.join(root, p);
  if(!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if(!fs.existsSync(file)){ res.writeHead(404, {'Content-Type':'text/plain'}); return res.end('not found '+p); }
  const ext=path.extname(file);
  res.writeHead(200, {'Content-Type': mime[ext]||'text/plain', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-cache'});
  fs.createReadStream(file).pipe(res);
});
const port=5173;
s.listen(port,()=>console.log(`Steady static at http://localhost:${port} — serving app/`));
