import { mkdir, readFile, writeFile } from 'node:fs/promises';
const items=JSON.parse(await readFile(new URL('../source/assets.json',import.meta.url),'utf8'));
const directory=new URL('../source/assets/',import.meta.url);
await mkdir(directory,{recursive:true});
await Promise.all(items.map(async item=>{
 const res=await fetch(item.url);
 if(!res.ok||!res.headers.get('content-type')?.startsWith('image/'))throw Error(`Image inaccessible : ${item.name} (${res.status})`);
 const bytes=Buffer.from(await res.arrayBuffer());
 if(bytes.length<100)throw Error(`Image vide : ${item.name}`);
 await writeFile(new URL(item.name,directory),bytes);
 console.log(item.name,bytes.length);
}));
