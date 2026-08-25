const http=require('http'),fs=require('fs'),p=require('path');
const tip={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer((q,s)=>{
  const f=p.join(__dirname, q.url==='/'?'index.html':q.url.split('?')[0]);
  fs.readFile(f,(e,d)=>{ if(e){s.writeHead(404);s.end('yok');return;}
    s.writeHead(200,{'Content-Type':tip[p.extname(f)]||'text/plain'});s.end(d);});
}).listen(8778,()=>console.log('http://localhost:8778'));
