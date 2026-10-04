import { mkdir, writeFile, cp, rm, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { articles } from '../source/articles.mjs';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const data = {
  fr: {
    nav:['À propos','Recherche','Blog','Design architectural'], skip:'Aller au contenu', menu:'Menu',
    role:'Architecte diplômée d’État · Docteure · Enseignante', headline:'Architecture, ambiances<br>et recherche.',
    intro:'Michèle Atié s’intéresse à la perception et à l’expérience des espaces intérieurs. Son travail associe recherche, enseignement et création d’outils pour accompagner la conception architecturale.',
    researchLink:'Voir les travaux de recherche ↗', disciplineTitle:'Disciplines',
    disciplines:[['Conception architecturale','Concevoir des espaces attentifs au bien-être, à la perception et à l’expérience des personnes qui les habitent.'],['Recherche et enseignement','Comprendre comment les personnes ressentent et vivent les espaces, à travers les ambiances et les usages. Relier l’enquête, l’expérimentation et la transmission en architecture pour nourrir la conception et la pédagogie.'],['Création d’outils','Créer des outils et des moyens pour trouver des solutions en lien avec les enjeux actuels de l’habitat.']],
    researchTitle:'Travaux de recherche', researchIntro:'Une recherche collective dans l’objectif de proposer des solutions aux enjeux de l’habitat.', current:'Projets en cours',
    projects:[['Habitat et Ambiances','Une recherche participative qui recueille les expériences des habitants et les besoins des experts de l’habitat, pour identifier des problématiques et imaginer des solutions.','Découvrir le projet','https://micheleatie.github.io/habitat-et-ambiances/']],
    scientific:'Publications et travaux scientifiques', development:'Travaux professionnels',
    blogTitle:'Articles', blogIntro:'', read:'Lire l’article',
    artIntro:'Dessins numériques réalisés avec Linea Sketch. Couleurs, lignes et compositions : un terrain d’exploration visuelle.', artAlt:'Dessin numérique de Michèle Atié', enlarge:'Agrandir le dessin', close:'Fermer',
    designTitle:'Design architectural', construction:'En construction', designIntro:'Cet espace accueillera une sélection de projets de design architectural.', designNote:'Les projets seront présentés ici au fur et à mesure de leur préparation.',
    footer:'Architecture, recherche et création', rights:'Œuvres et textes : Michèle Atié.', contact:'Contact', back:'← Tous les articles', references:'Références', author:'Par Michèle Atié'
  },
  en: {
    nav:['About','Research','Blog','Architectural Design'], skip:'Skip to content', menu:'Menu',
    role:'French State-qualified architecture graduate · PhD · Educator', headline:'Architecture, atmospheres<br>and research.',
    intro:'Michèle Atié is interested in the perception and experience of interior spaces. Her work combines research, teaching and the development of tools to support architectural design.',
    researchLink:'View the research ↗', disciplineTitle:'Disciplines',
    disciplines:[['Architectural design','Designing spaces with attention to well-being, perception and the experience of the people who inhabit them.'],['Research and education','Understanding how people feel and experience spaces through atmospheres and everyday use. Connecting inquiry, experimentation and architectural education to inform design and teaching.'],['Tool development','Creating tools and methods to find solutions to current housing challenges.']],
    researchTitle:'Research', researchIntro:'Collective research aimed at proposing solutions to housing challenges.', current:'Current projects',
    projects:[['Habitat et Ambiances','Participatory research gathering residents’ experiences and housing experts’ needs to identify challenges and imagine solutions.','Discover the project','https://micheleatie.github.io/habitat-et-ambiances/']],
    scientific:'Publications and scientific work', development:'Professional work',
    blogTitle:'Articles', blogIntro:'', read:'Read the article',
    artIntro:'Digital drawings created with Linea Sketch. Colours, lines and compositions: a space for visual exploration.', artAlt:'Digital drawing by Michèle Atié', enlarge:'Enlarge drawing', close:'Close',
    designTitle:'Architectural Design', construction:'Under construction', designIntro:'This space will feature a selection of architectural design projects.', designNote:'Projects will be introduced as they are prepared for publication.',
    footer:'Architecture, research and creative practice', rights:'Artwork and writing: Michèle Atié.', contact:'Contact', back:'← All articles', references:'References', author:'By Michèle Atié'
  }
};
const pages = ['index.html','research.html','blog.html','design.html'];
const stylesheet = `style-${createHash('sha256').update(await readFile('source/style.css')).digest('hex').slice(0,12)}.css`;
const date = (iso, lang) => new Intl.DateTimeFormat(lang, {day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(iso));
const link = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`;
const heading = (label, title, intro) => `<header class="page-heading"><p class="eyebrow">${esc(label)}</p><h1>${esc(title)}</h1>${intro?`<p class="lead">${esc(intro)}</p>`:''}</header>`;
function layout(lang, page, title, description, body) {
  const t=data[lang], other=lang==='fr'?'en':'fr';
  const active = page.includes('neuroarchitecture')||page.includes('designing-for')?'blog.html':page;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} — Michèle Atié</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#121e2b"><link rel="alternate" hreflang="${other}" href="../${other}/${page}"><link rel="stylesheet" href="../assets/${stylesheet}"><script src="../assets/site.js" defer></script></head><body><a class="skip" href="#main">${t.skip}</a><div class="wrap"><header class="header"><a class="brand" href="index.html">MICHÈLE ATIÉ</a><button class="menu-button" type="button" aria-controls="navigation" aria-expanded="false">${t.menu}</button><nav id="navigation" class="navigation" aria-label="${lang==='fr'?'Navigation principale':'Main navigation'}">${pages.map((p,i)=>`<a href="${p}"${p===active?' aria-current="page"':''}>${t.nav[i]}</a>`).join('')}</nav><div class="lang" aria-label="${lang==='fr'?'Langue':'Language'}"><a href="../fr/${page}" lang="fr" class="${lang==='fr'?'selected':''}"${lang==='fr'?' aria-current="true"':''}>FR</a> <span aria-hidden="true">/</span> <a href="../en/${page}" lang="en" class="${lang==='en'?'selected':''}"${lang==='en'?' aria-current="true"':''}>EN</a></div></header><main id="main">${body}</main><footer class="footer"><div><p>Michèle Atié · ${t.footer}</p><small>${t.rights}</small></div><div>${link('mailto:atiemichele@gmail.com',t.contact)}${link('https://www.linkedin.com/in/mich%C3%A8le-ati%C3%A9-658783193/','LinkedIn')}</div></footer></div></body></html>`;
}
await mkdir('docs/assets/images', {recursive:true});
await cp('source/media','docs/assets/images',{recursive:true});
await cp('source/style.css',`docs/assets/${stylesheet}`);
await cp('source/site.js','docs/assets/site.js');
for (const lang of ['fr','en']) {
  const t=data[lang]; await mkdir(`docs/${lang}`,{recursive:true});
  const save = async (page,title,intro,body)=>writeFile(`docs/${lang}/${page}`,layout(lang,page,title,intro,body));
  await save('index.html',t.nav[0],t.intro,`<section class="hero"><div><p class="eyebrow">${t.role}</p><h1>${t.headline}</h1><p class="lead">${t.intro}</p><a class="text-link" href="research.html">${t.researchLink}</a></div><img class="portrait" src="../assets/images/about.jpg" width="906" height="874" alt="Michèle Atié" fetchpriority="high"></section><section class="section"><h2>${t.disciplineTitle}</h2><div class="disciplines">${t.disciplines.map(([name,text])=>`<div><h3>${name}</h3><p>${text}</p></div>`).join('')}</div></section>`);
  await save('research.html',t.researchTitle,t.researchIntro,`${heading(t.nav[1],t.researchTitle,t.researchIntro)}<section aria-label="${t.current}"><h2>${t.current}</h2>${t.projects.map(([name,text,action,href],i)=>`<div class="project"><span class="number">0${i+1}</span><h3>${name}</h3><div><p>${text}</p><a class="text-link" href="${href}">${action} ↗</a></div></div>`).join('')}</section><section class="section"><h2>${t.development}</h2><p>${link('https://www.pepite-pdl.fr/projets/archimmersion/','Pépite Archimmersion ↗')}</p></section><section class="section"><h2>${t.scientific}</h2><div class="scholar-links">${link('https://scholar.google.fr/citations?user=Gt-c0GMAAAAJ&hl='+lang+'&oi=ao','Google Scholar')}${link('https://www.researchgate.net/profile/Michele-Atie?ev=hdr_xprf','ResearchGate')}${link('https://cv.hal.science/michele-atie','HAL')}</div></section>`);
  await save('blog.html',t.blogTitle,t.blogIntro,`${heading('Blog',t.blogTitle,t.blogIntro)}<div class="blog-list">${[...articles].reverse().map(a=>`<a class="article-card" href="${a.slug}.html" aria-label="${t.read} : ${a.title[lang]}"><time datetime="${a.date}">${date(a.date,lang)}</time><div><h2>${a.title[lang]}</h2><p>${a.subtitle[lang]}</p></div><span class="arrow" aria-hidden="true">↗</span></a>`).join('')}</div>`);
  // Artworks remain in the source archive, but this section is not published.
  await rm(`docs/${lang}/digital-art.html`, {force:true});
  await save('design.html',t.designTitle,t.designIntro,`${heading(t.nav[3],t.designTitle,t.designIntro)}<div class="construction"><span class="status">${t.construction}</span><p>${t.designNote}</p></div>`);
  for (const a of articles) {
    const body=a.body[lang].map(([tag,value])=>tag==='ul'?`<ul>${value.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`:`<${tag}>${esc(value)}</${tag}>`).join('');
    await save(`${a.slug}.html`,a.title[lang],a.subtitle[lang],`<article class="reading"><header><a class="text-link" href="blog.html">${t.back}</a><h1>${a.title[lang]}</h1><p class="subtitle">${a.subtitle[lang]}</p><p class="meta">${t.author} · <time datetime="${a.date}">${date(a.date,lang)}</time></p></header>${body}<section class="references"><h2>${t.references}</h2><ul>${a.references.map(([text,href])=>`<li>${link(href,text.replaceAll(" & ", lang==="fr"?" et ":" and "))}</li>`).join('')}</ul></section></article>`);
  }
}
await writeFile('docs/index.html','<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=fr/index.html"><title>Michèle Atié — Architecture, recherche et création</title></head><body><h1>Michèle Atié</h1><p><a href="fr/index.html">Français</a> · <a href="en/index.html">English</a></p></body></html>');
await writeFile('docs/.nojekyll','');
console.log('12 pages bilingues et accueil générés dans docs/.');

