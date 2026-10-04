import {mkdir,cp} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const staging=path.resolve('.codex-scratch.nosync/private-upload/michele-atie-portfolio');
await mkdir(staging,{recursive:true});await mkdir('outputs',{recursive:true});
for(const item of ['source','scripts','docs','package.json','README.md','AGENTS.md','SOURCES.md','tasks.md','.gitignore'])await cp(item,path.join(staging,item),{recursive:true});
const result=spawnSync('/usr/bin/ditto',['-c','-k','--norsrc','--keepParent',staging,path.resolve('outputs/portfolio-code-prive.zip')],{stdio:'inherit'});
if(result.status)process.exit(result.status);console.log('Archive du code : outputs/portfolio-code-prive.zip');
