import {readFile,readdir,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve('../../backups/adobe-portfolio-2026-10-04');
const records=JSON.parse(await readFile(root+'/inventaire-pages.json','utf8'));
const issues=[];
for(const page of records){for(const file of [`pages-brutes/${page.slug}.txt`,`pages-brutes/${page.slug}.html`,`pages-brutes/${page.slug}.json`,`captures/${page.slug}.jpg`,`copie-hors-ligne/${page.slug}.html`])try{if(!(await stat(root+'/'+file)).size)issues.push('Vide : '+file);}catch{issues.push('Absent : '+file);}
const html=await readFile(root+'/copie-hors-ligne/'+page.slug+'.html','utf8');
for(const m of html.matchAll(/\b(src|href|poster)="([^"]+)"/g)){const [_,kind,url]=m;if(/^(data:|mailto:|tel:|#)/.test(url))continue;if(/^https?:/.test(url)){if(kind!=='href')issues.push('Ressource distante : '+url);continue;}try{await stat(path.resolve(root,'copie-hors-ligne',url.split('#')[0]));}catch{issues.push('Lien absent : '+url);}}
}
const media=JSON.parse(await readFile(root+'/inventaire-medias.json','utf8'));
if(media.failures.length)issues.push('Téléchargements manquants');
const pdf=await readFile(root+'/documents/portfolio-indesign.pdf');if(pdf.subarray(0,5).toString()!=='%PDF-')issues.push('PDF invalide');
let bookSaved=false;try{const book=await readFile(root+'/documents/portfolio-architecture-2025.pdf');bookSaved=book.subarray(0,5).toString()==='%PDF-';if(!bookSaved)issues.push('Livre architectural invalide');}catch{}
const inventory=[];async function walk(dir){for(const entry of await readdir(root+'/'+dir,{withFileTypes:true})){const rel=dir?dir+'/'+entry.name:entry.name;if(entry.isDirectory())await walk(rel);else if(!['integrite-complete.json','verification.json'].includes(rel)){const bytes=await readFile(root+'/'+rel);inventory.push({file:rel,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}}await walk('');
await writeFile(root+'/integrite-complete.json',JSON.stringify(inventory,null,2));
const report={pages:records.length,resources:media.downloaded.length,files:inventory.length,totalBytes:inventory.reduce((n,e)=>n+e.bytes,0),issues,pdf39PagesStillNeeded:!bookSaved};
await writeFile(root+'/verification.json',JSON.stringify(report,null,2));console.log(report);if(issues.length)process.exit(1);
