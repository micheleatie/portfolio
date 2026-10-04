import {readFile,writeFile,readdir,mkdir,copyFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve('../../backups/adobe-portfolio-2026-10-04');
const pages=[];
for(const name of await readdir(root+'/pages-brutes'))if(name.endsWith('.json'))pages.push(JSON.parse(await readFile(root+'/pages-brutes/'+name,'utf8')));
await mkdir(root+'/medias',{recursive:true});await mkdir(root+'/copie-hors-ligne',{recursive:true});
const urls=new Set();const add=(u,base)=>{if(!u||/^(data:|blob:|inline-svg:)/.test(u))return;try{const v=new URL(u.replaceAll('&amp;','&'),base).href;if(/^https?:/.test(v))urls.add(v);}catch{}};
for(const p of pages){for(const r of p.resources){if(r.tag!=='SCRIPT'&&r.tag!=='IFRAME'){add(r.src,p.url);add(r.poster,p.url);if(r.href&&r.tag==='LINK'&&!r.href.includes('myportfolio.com/'+p.slug))add(r.href,p.url);for(const s of (r.srcset||'').split(','))add(s.trim().split(/\s+/)[0],p.url);}}for(const m of p.html.matchAll(/url\(\s*["']?([^\s)"']+)/g))add(m[1],p.url);}
const bundle=JSON.parse(await readFile(root+'/ressources-navigateur/manifest.json','utf8'));
const map=new Map();const failures=[];const downloaded=[];
try{for(const item of JSON.parse(await readFile(root+'/inventaire-medias.json','utf8')).downloaded){await stat(root+'/medias/'+item.file);map.set(item.url,item.file);}}catch{}
for(const p of pages)for(const m of p.html.matchAll(/\bdata-src="([^"]+)"/g))add(m[1],p.url);
for(const a of bundle.assets){if(a.url?.startsWith('http')){const file=path.basename(a.path);await copyFile(root+'/ressources-navigateur/'+file,root+'/medias/'+file);map.set(a.url,file);}}
// Canonical URLs are pages, not resources. Do not fetch analytics or tracking pixels.
const todo=[...urls].filter(u=>!pages.some(p=>p.url===u)&&!map.has(u)&&!u.includes('p.typekit.net/'));
async function download(url){try{const res=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!res.ok)throw Error('HTTP '+res.status);const type=res.headers.get('content-type')||'';if(type.includes('text/html'))throw Error('Réponse HTML, pas un média');let ext=path.extname(new URL(url).pathname)||({ 'font/woff2':'.woff2','font/woff':'.woff','application/x-font-opentype':'.otf','text/css':'.css'}[type.split(';')[0]]||'.bin');if(ext.length>10)ext='.bin';const file=createHash('sha256').update(url).digest('hex').slice(0,18)+ext;const bytes=Buffer.from(await res.arrayBuffer());if(!bytes.length)throw Error('Fichier vide');await writeFile(root+'/medias/'+file,bytes);map.set(url,file);downloaded.push({url,file,bytes:bytes.length,type});}catch(e){failures.push({url,error:e.message});}}
let index=0;await Promise.all(Array.from({length:6},async()=>{while(index<todo.length)await download(todo[index++]);}));
// Preserve and localize CSS resources, including their font/background URLs.
for(const [url,file] of [...map])if(file.endsWith('.css')){let css=await readFile(root+'/medias/'+file,'utf8');const cssUrls=[...css.matchAll(/url\(\s*["']?([^\s)"']+)/g)].map(m=>m[1]);for(const value of cssUrls){if(value.startsWith('data:'))continue;try{await stat(root+'/medias/'+value);continue;}catch{}const abs=new URL(value,url).href;if(!map.has(abs))await download(abs);if(map.has(abs))css=css.replaceAll(value,map.get(abs));}await writeFile(root+'/medias/'+file,css);}
const video=JSON.parse(await readFile(root+'/video-source.json','utf8'));
const mp4=video.sources.find(u=>new URL(u).pathname.endsWith('.mp4'));
let videoFile=null;if(mp4){await download(mp4);videoFile=map.get(mp4)||null;}
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const localPage=new Map(pages.map(p=>[p.url,p.slug+'.html']));
for(const p of pages){let html=p.html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<div id="codex-browser-sidebar-comments-root"[\s\S]*?<\/div>/g,'').replace(/\son\w+="[^"]*"/g,'');
html=html.replace(/\b(src|href|poster)="([^"]+)"/g,(match,key,value)=>{if(/^(data:|mailto:|tel:|#)/.test(value))return match;let u;try{u=new URL(value.replaceAll('&amp;','&'),p.url);}catch{return match;}const hash=u.hash;u.hash='';if(key==='href'&&localPage.has(u.href))return `${key}="${localPage.get(u.href)+hash}"`;if(map.has(u.href))return `${key}="../medias/${map.get(u.href)}${hash}"`;return `${key}="${escape(new URL(value.replaceAll('&amp;','&'),p.url).href)}"`;});
html=html.replace(/\bsrcset="([^"]+)"/g,(_,value)=>`srcset="${value.split(',').filter(s=>s.trim()).map(s=>{const [u,...size]=s.trim().split(/\s+/);let abs;try{abs=new URL(u,p.url).href;}catch{return s;}return (map.has(abs)?'../medias/'+map.get(abs):abs)+' '+size.join(' ');}).join(', ')}"`);
for(const [url,file] of map)html=html.replaceAll(url,'../medias/'+file).replaceAll(url.replaceAll('&','&amp;'),'../medias/'+file);
html=html.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi,videoFile&&p.slug==='music-and-visual-animation'?`<video controls preload="metadata" style="width:100%" src="../medias/${videoFile}"></video>`:'<p>Contenu externe : consulter l’inventaire des liens.</p>');
html=html.replace(/<form\b[\s\S]*?<\/form>/gi,'<p>Formulaire de contact archivé : envoi désactivé dans cette copie.</p>');
html=html.replace('</head>','<style>body.transition-enabled{opacity:1!important}img.js-lazy{height:auto!important;padding-bottom:0!important}.js-responsive-nav,.js-lightbox-wrap{display:none!important}@media(max-width:768px){.site-header nav{display:block!important}} html{scroll-behavior:auto!important}</style></head>');
await writeFile(root+'/copie-hors-ligne/'+p.slug+'.html','<!doctype html>'+html);
}
await writeFile(root+'/index.html',`<!doctype html><html lang="fr"><meta charset="utf-8"><title>Archive Adobe Portfolio — Michèle Atié</title><style>body{max-width:850px;margin:40px auto;padding:20px;font:16px/1.6 system-ui}a{color:#17456c}li{margin:12px 0}</style><h1>Archive du portfolio Adobe</h1><p>Michèle Atié · sauvegarde du 4 octobre 2026</p><p>Copie statique privée pour consultation et reconstruction. Les fonctions Adobe et le formulaire ne sont pas actifs. Les captures conservent la présentation d’origine.</p><ul>${pages.map(p=>`<li><a href="copie-hors-ligne/${p.slug}.html">${escape(p.title)}</a> · <a href="pages-brutes/${p.slug}.txt">Texte</a> · <a href="captures/${p.slug}.jpg">Capture complète</a></li>`).join('')}</ul>`);
const links=pages.flatMap(p=>[...p.links.map(l=>({page:p.slug,...l,source:'lien'})),...[...p.text.matchAll(/https?:\/\/[^\s<>\u200b-\u200f]+/g)].map(m=>({page:p.slug,href:m[0],source:'texte'}))]);await writeFile(root+'/liens.json',JSON.stringify(links,null,2));
await writeFile(root+'/inventaire-medias.json',JSON.stringify({downloaded:[...map].map(([url,file])=>({url,file})),video:videoFile,failures},null,2));
const checks=[];for(const [url,file] of map){const bytes=await readFile(root+'/medias/'+file);checks.push({file:'medias/'+file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}await writeFile(root+'/integrite.json',JSON.stringify(checks,null,2));
console.log(JSON.stringify({pages:pages.length,resources:map.size,bytes:checks.reduce((n,c)=>n+c.bytes,0),video:videoFile,failures},null,2));
