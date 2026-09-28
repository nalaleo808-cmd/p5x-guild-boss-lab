// Downloads Lufelnet Awareness (ritual.js) and weapon (weapon.js) records for
// the 20 imported characters. The existing 5.0.4 skill snapshot and generated
// catalog are left untouched; this writes a separate reference file.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const site = 'https://lufel.net';
const version = '5.1.0';

async function get(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'P5X-Guild-Boss-Simulator data sync' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

// Same brace-matching parser as sync-lufel-recent.mjs; returns null when the
// assignment is absent (for example, a character without English weapon text).
function assignedObject(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = source.indexOf('{', markerIndex + marker.length);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) {
      const literal = source.slice(start, index + 1).replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(literal);
    }
  }
  throw new Error(`Unterminated object: ${marker}`);
}

const snapshot = JSON.parse(await readFile(resolve(root, 'data/lufel-live-recent.json'), 'utf8'));
const records = [];
for (const { slug, sourceKey, codename } of snapshot.characters) {
  const base = `${site}/data/characters/${encodeURIComponent(sourceKey)}`;
  const urls = { ritual: `${base}/ritual.js?v=${version}`, weapon: `${base}/weapon.js?v=${version}`, skill: `${base}/skill.js?v=${version}` };
  const [ritualSource, weaponSource, skillSource] = await Promise.all(Object.values(urls).map(get));
  const awarenessEn = assignedObject(ritualSource, `window.enCharacterRitualData["${sourceKey}"]`);
  const weaponsEn = assignedObject(weaponSource, `window.enCharacterWeaponData["${sourceKey}"]`);
  records.push({
    slug, sourceKey, codename, urls,
    awareness: awarenessEn,
    awarenessKr: awarenessEn ? null : assignedObject(ritualSource, `window.ritualData["${sourceKey}"]`),
    weapons: weaponsEn,
    weaponsKr: assignedObject(weaponSource, `window.WeaponData["${sourceKey}"]`),
    skills: assignedObject(skillSource, `window.enCharacterSkillsData["${sourceKey}"]`)
  });
  console.log(`Synced ${records.length}/${snapshot.characters.length}: ${codename}`);
}

await writeFile(resolve(root, `data/lufel-awareness-weapons-${version}.json`), `${JSON.stringify({
  schemaVersion: '1.0', generatedAt: new Date().toISOString(),
  source: { name: 'Lufelnet', url: `${site}/en/character/`, version,
    note: 'Tooltip text only. Numbers here are sourced; timing and trigger order are not combat-script verified.' },
  characters: records
}, null, 2)}\n`);
console.log(`Saved data/lufel-awareness-weapons-${version}.json`);
