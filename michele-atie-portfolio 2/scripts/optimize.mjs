import { readdir, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await mkdir('source/media', { recursive: true });
for (const name of await readdir('source/assets')) {
  const output = `source/media/${name.replace(/\.[^.]+$/, '.jpg')}`;
  const result = spawnSync('/usr/bin/sips', ['-Z', '1600', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', `source/assets/${name}`, '--out', output], { encoding: 'utf8' });
  if (result.status) throw new Error(result.stderr);
  console.log(output);
}
