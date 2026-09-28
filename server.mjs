import http from 'node:http';
import {stat,readFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.mp4':'video/mp4','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(file===root)file=path.join(root,'index.html');
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 const s=await stat(file);res.setHeader('Content-Type',types[path.extname(file)]??'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.setHeader('Accept-Ranges','bytes');
 const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range??'');
 if(match){const start=Number(match[1]),end=Math.min(match[2]?Number(match[2]):s.size-1,s.size-1);if(start>end){res.writeHead(416,{'Content-Range':`bytes */${s.size}`});res.end();return;}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${s.size}`,'Content-Length':end-start+1});createReadStream(file,{start,end}).pipe(res);}
 else{res.setHeader('Content-Length',s.size);createReadStream(file).pipe(res);}
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(5186,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:5186'));
