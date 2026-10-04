import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('docs');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg'};
http.createServer(async(req,res)=>{
  try {
    let target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403);return res.end();}
    if((await stat(target)).isDirectory())target=path.join(target,'index.html');
    res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream'});
    res.end(await readFile(target));
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(4180,'127.0.0.1',()=>console.log('Portfolio : http://127.0.0.1:4180/fr/index.html'));
