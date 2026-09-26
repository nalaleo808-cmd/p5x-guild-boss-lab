// Builds a single-file executable that embeds the app and serves it locally.
// Uses Node's single executable application support: the app files become SEA
// assets, scripts/sea-main.cjs is the entry point, and the blob is injected into
// a copy of the running node binary with postject.
// Output: dist-exe/P5X-Guild-Boss-Lab(.exe)
import { copyFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { delimiter, dirname, join, relative, sep } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'dist-exe');
const exeName = process.platform === 'win32' ? 'P5X-Guild-Boss-Lab.exe' : 'P5X-Guild-Boss-Lab';
const exe = join(out, exeName);
const blob = join(out, 'sea-prep.blob');
const configPath = join(out, 'sea-config.json');

// Same file set that scripts/build.mjs copies to dist/.
const APP_PATHS = ['index.html', 'manifest.webmanifest', 'src', 'data', 'assets'];

async function listFiles(path) {
  const entries = await readdir(path, { withFileTypes: true }).catch(() => null);
  if (!entries) return [path];
  const nested = await Promise.all(entries.map(entry => listFiles(join(path, entry.name))));
  return nested.flat();
}

// Clear the contents rather than the folder: Windows locks a folder that a shell has open.
await mkdir(out, { recursive: true });
for (const entry of await readdir(out)) await rm(join(out, entry), { recursive: true, force: true });

const assets = {};
for (const path of APP_PATHS) {
  for (const file of await listFiles(join(root, path))) {
    assets[relative(root, file).split(sep).join('/')] = file;
  }
}

await writeFile(configPath, JSON.stringify({
  main: join(root, 'scripts', 'sea-main.cjs'),
  output: blob,
  disableExperimentalSEAWarning: true,
  useSnapshot: false,
  useCodeCache: false,
  assets
}, null, 2));

execFileSync(process.execPath, ['--experimental-sea-config', configPath], { stdio: 'inherit' });
await copyFile(process.execPath, exe);

const postjectArgs = [exe, 'NODE_SEA_BLOB', blob, '--sentinel-fuse', 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2'];
if (process.platform === 'darwin') postjectArgs.push('--macho-segment-name', 'NODE_SEA');
// Run npm's bundled npx through node directly so paths with spaces need no shell quoting.
const npxCli = process.platform === 'win32'
  ? join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js')
  : join(dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npx-cli.js');
// npx launches postject's bin shim with `node` by name, so put this node first on PATH.
const pathKey = Object.keys(process.env).find(key => key.toUpperCase() === 'PATH') || 'PATH';
const env = { ...process.env, [pathKey]: [dirname(process.execPath), process.env[pathKey]].filter(Boolean).join(delimiter) };
execFileSync(process.execPath, [npxCli, '--yes', 'postject@1.0.0-alpha.6', ...postjectArgs], { stdio: 'inherit', env });

await rm(blob, { force: true });
await rm(configPath, { force: true });
console.log(`Built ${Object.keys(assets).length} embedded files into ${relative(root, exe)}`);
