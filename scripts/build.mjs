import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const path of ['index.html', 'manifest.webmanifest', 'src', 'data', 'assets']) {
  await cp(join(root, path), join(dist, path), { recursive: true });
}
console.log('Built static app in dist/');
