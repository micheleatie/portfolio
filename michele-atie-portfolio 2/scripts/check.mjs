import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('docs');
const errors=[]; let count=0;
for(const lang of ['fr','en']) {
  const files=(await readdir(`docs/${lang}`)).filter(n=>n.endsWith('.html'));
  for(const file of files) {
    count++;const full=path.resolve(root,lang,file),html=await readFile(full,'utf8');
    if(!html.includes(`<html lang="${lang}">`))errors.push(`${lang}/${file}: langue`);
    if((html.match(/<h1[ >]/g)||[]).length!==1)errors.push(`${lang}/${file}: h1`);
    if(/myportfolio\.com|adobe\.com|cdn\.myportfolio/.test(html))errors.push(`${file}: dépendance Adobe`);
    const visible=html.replace(/<[^>]*>/g,'');
    if(/Digital Art|Art Digital|Texte repris du portfolio original|Text carried over from the original portfolio|Notes et réflexions|Notes and reflections|Parcours scientifique/.test(visible))errors.push(`${lang}/${file}: contenu retiré encore présent`);
    if(file==='research.html' && /Ambiance Index|research-text/.test(html))errors.push(`${lang}/${file}: ancien parcours ou projet séparé`);
    if(/&amp;|&(?!#\d+;|#x[0-9a-f]+;|[a-z]+;)/i.test(visible))errors.push(`${lang}/${file}: esperluette visible`);
    for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const href=match[1]; if(/^(https?:|mailto:|#)/.test(href)||!href)continue;
      const target=path.resolve(path.dirname(full),href.split('#')[0]);
      try{await stat(target);}catch{errors.push(`${lang}/${file}: lien manquant ${href}`);}
    }
    try{await stat(path.resolve(root,lang==='fr'?'en':'fr',file));}catch{errors.push(`${file}: traduction absente`);}
  }
}
if(count!==12)errors.push(`Nombre inattendu de pages : ${count}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`${count} pages vérifiées : langues, liens locaux, titres et indépendance Adobe.`);
