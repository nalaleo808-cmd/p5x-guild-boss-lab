import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { get, assignedObject } from './lib/lufel-source.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const site = 'https://lufel.net';
const version = '5.0.4';

// Retained existing roster plus explicitly requested Cosmic Yui. Runtime bespoke mechanics use the versioned source snapshot.
const recentCharacters = [
  ['bui-cosmic', 'YUI·스텔라', 'Cosmic Yui', 'Assassin', 'nuclear'],
  ['blitz', '카타야마', 'BLITZ', 'Saboteur', 'electric'],
  ['berry', '이치고', 'BERRY', 'Assassin', 'curse'],
  ['puppet-wavecatcher', '미유·여름', 'PUPPET·Wavecatcher', 'Sweeper', 'ice'],
  ['marian-beachflower', '미나미·여름', 'MARIAN·Beachflower', 'Strategist', 'bless'],
  ['miku', '미쿠', 'MIKU', 'Elucidator', 'support'],
  ['akihiko', '사나다', 'AKIHIKO', 'Sweeper', 'electric'],
  ['yukari', '유카리', 'YUKARI', 'Medic', 'wind'],
  ['makoto', '유키 마코토', 'MAKOTO', 'Assassin', 'fire'],
  ['ange', '마나카', 'ANGE', 'Elucidator', 'support'],
  ['luce', '쇼키', 'LUCE', 'Strategist', 'bless'],
  ['crow', '아케치', 'CROW', 'Sweeper', 'almighty'],
  ['turbo', '마유미', 'TURBO', 'Strategist', 'physical'],
  ['violet', '카스미', 'VIOLET', 'Assassin', 'bless'],
  ['rin-firecracker', '야오링·사자무', 'RIN·Firecracker', 'Sweeper', 'fire'],
  ['matoi', '미오', 'MATOI', 'Saboteur', 'ice'],
  ['wind-tempest', '리코·매화', 'WIND·Tempest', 'Strategist', 'wind'],
  ['howler', '루우나', 'HOWLER', 'Saboteur', 'fire'],
  ['mont-frostgale', '몽타뉴·백조', 'MONT·Frostgale', 'Assassin', 'wind'],
  ['j-c', 'J&C', 'J&C', 'Virtuoso', 'almighty'],
  ['noir', '하루', 'NOIR', 'Sweeper', 'psychic']
];

async function download(url, path) {
  const response = await fetch(url, { headers: { 'user-agent': 'P5X-Guild-Boss-Simulator artwork sync' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  await writeFile(path, new Uint8Array(await response.arrayBuffer()));
}

const records = [];
const personaSkillSource = await get(`${site}/data/kr/wonder/skills.js?v=${version}`);
const personaSkills = assignedObject(personaSkillSource, 'const personaSkillList =');
for (const [slug, sourceKey, codename, role, element] of recentCharacters) {
  const pageUrl = `${site}/en/character/${slug}/`;
  await get(pageUrl);
  const base = `${site}/data/characters/${encodeURIComponent(sourceKey)}`;
  const urls = {
    skills: `${base}/skill.js`,
    stats: `${base}/base_stats.js`,
    setting: `${base}/setting.js`
  };
  const [skillSource, statsSource, settingSource] = await Promise.all(Object.values(urls).map(url => get(`${url}?v=${version}`)));
  records.push({
    slug, sourceKey, codename, role, element, pageUrl,
    skills: assignedObject(skillSource, `window.enCharacterSkillsData["${sourceKey}"]`),
    stats: assignedObject(statsSource, `window.basicStatsData["${sourceKey}"]`),
    setting: assignedObject(settingSource, `window.characterSetting["${sourceKey}"]`)
  });
  console.log(`Synced ${records.length}/${recentCharacters.length}: ${codename}`);
}

const output = {
  schemaVersion: '1.0', generatedAt: new Date().toISOString(),
  source: { name: 'Lufelnet English', url: `${site}/en/character/`, version, spoilers: false },
  characters: records
};
await mkdir(resolve(root, 'data'), { recursive: true });
const artworkDirectory = resolve(root, 'assets/characters');
await mkdir(artworkDirectory, { recursive: true });
const artworkCharacters = [
  ...recentCharacters.map(([slug, sourceKey]) => [slug, sourceKey, true]),
  ['wonder', '원더', false], ['joker', '렌', true], ['rin', '야오링', true], ['mona', '모르가나', true], ['okyann', '카요', true]
];
let artworkCount = 0;
for (const [slug, sourceKey, required] of artworkCharacters) {
  try {
    await download(`${site}/assets/img/character-detail/${encodeURIComponent(sourceKey)}.webp`, resolve(artworkDirectory, `${slug}.webp`));
    artworkCount += 1;
  } catch (error) {
    if (required) throw error;
    console.warn(`Artwork unavailable for ${slug}; keeping the local fallback.`);
  }
}
await writeFile(resolve(root, 'data/lufel-live-recent.json'), `${JSON.stringify(output, null, 2)}\n`);
await writeFile(resolve(root, 'data/lufel-live-persona-skills.json'), `${JSON.stringify({
  schemaVersion: '1.0', generatedAt: output.generatedAt,
  source: { name: 'Lufelnet Persona Skill Catalog', url: `${site}/en/persona/`, version },
  skills: personaSkills
}, null, 2)}\n`);
console.log('Saved data/lufel-live-recent.json');
console.log(`Saved ${Object.keys(personaSkills).length} Persona skills`);
console.log(`Saved ${artworkCount} character artwork files`);
