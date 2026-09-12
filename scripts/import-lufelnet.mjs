import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const sourceArg = process.argv.indexOf('--source');
const sourceRoot = resolve(root, sourceArg >= 0 ? process.argv[sourceArg + 1] : 'vendor/lufelnet-data-source');
const outputJson = resolve(root, 'data/lufel-catalog.json');
const outputModule = resolve(root, 'src/generated/lufel-catalog.js');

const elementMap = {
  '주원': 'curse', '저주': 'curse', '물리': 'physical', '염동': 'psychic', '질풍': 'wind',
  '화염': 'fire', '빙결': 'ice', '전격': 'electric', '축복': 'bless', '만능': 'almighty',
  '핵열': 'nuclear', '총격': 'gun', '회복': 'support', '보조': 'support', '버프': 'support',
  '방어': 'support', 'gun': 'gun'
};

const englishElementMap = {
  physical: 'physical', gun: 'gun', fire: 'fire', ice: 'ice', electric: 'electric',
  wind: 'wind', psychokinesis: 'psychic', psychic: 'psychic', nuclear: 'nuclear',
  bless: 'bless', curse: 'curse', almighty: 'almighty', buff: 'support', support: 'support'
};

const roleMap = {
  '지배': 'Sweeper', '반항': 'Assassin', '우월': 'Support', '굴복': 'Saboteur',
  '구원': 'Medic', '방위': 'Guardian', '해명': 'Strategist', '자율': 'Vanguard'
};

const slug = value => String(value || '').toLowerCase().normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'record';

function inferElement(value, fallback = 'almighty') {
  const text = String(value || '').toLowerCase();
  for (const [source, normalized] of Object.entries(elementMap)) if (text.startsWith(source.toLowerCase())) return normalized;
  for (const [source, normalized] of Object.entries(englishElementMap)) if (text.includes(source)) return normalized;
  return fallback;
}

function extractJsonObject(source) {
  const recordMarker = source.indexOf('window.personaFiles[');
  const assignment = source.indexOf('=', recordMarker);
  const start = source.indexOf('{', assignment);
  const end = source.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Object literal not found');
  return JSON.parse(source.slice(start, end + 1));
}

function numericTiers(description) {
  const match = description.match(/(?:equal to|by)\s+((?:[\d.]+%\s*\/\s*){0,4}[\d.]+%)/i);
  return match ? (match[1].match(/[\d.]+(?=%)/g) || []).map(value => Number(value) / 100).filter(Number.isFinite) : [];
}

function durationFrom(description) {
  const match = description.match(/for\s+(\d+)\s+turn/i);
  return match ? Number(match[1]) : 2;
}

function normalizeSkill(skill, personaId, kind, index) {
  const name = skill.name_en || skill.name || `${kind} ${index + 1}`;
  const description = skill.desc_en || skill.desc || '';
  const tiers = numericTiers(description);
  const sp = Number(String(skill.cost || '').match(/SP\s*(\d+)/i)?.[1] || 0);
  const target = /all allies|party/i.test(description) ? 'party'
    : /ally/i.test(description) && !/foe|enemy/i.test(description) ? 'ally'
      : /all foes|all enemies/i.test(description) ? 'all_enemies'
        : /foe|enemy/i.test(description) ? 'boss' : 'self';
  const lower = `${name} ${description}`.toLowerCase();
  let element = elementMap[skill.icon] || elementMap[skill.icon_gl] || null;
  if (!element) element = Object.values(elementMap).find(item => lower.includes(item)) || 'almighty';
  const combat = { executable: false, confidence: 'reference-only' };
  if (tiers.length && /\bdeal(?:s)?\b[^.]*\bdamage\b/i.test(description)) {
    combat.executable = true;
    combat.confidence = 'source-described';
    combat.powerTiers = tiers;
    combat.power = tiers.at(-1);
  }
  const vulnerability = description.match(/increase (?:all )?foes?'?\s*(?:(\w+)\s+)?damage taken by\s+([\d.]+)%/i);
  if (vulnerability) {
    const vulnerabilityElement = vulnerability[1]?.toLowerCase();
    combat.executable = true;
    combat.confidence = 'source-described';
    combat.debuff = {
      id: vulnerabilityElement && Object.values(elementMap).includes(vulnerabilityElement) ? `${vulnerabilityElement}_vuln` : 'damage_taken',
      name: vulnerabilityElement ? `${vulnerabilityElement.toUpperCase()} EXPOSED` : 'DAMAGE TAKEN ↑',
      value: Number(vulnerability[2]) / 100,
      duration: durationFrom(description)
    };
  }
  if (/increase(?:s)?(?:.*?)critical rate by/i.test(description) && tiers.length && ['ally', 'party', 'self'].includes(target)) {
    combat.executable = true;
    combat.confidence = 'source-described';
    combat.buff = {
      id: 'crit_rate_up', name: 'CRIT RATE ↑', stat: 'critRate',
      value: tiers.at(-1), duration: durationFrom(description)
    };
  }
  if (/increase(?:s)?(?:.*?)(?:attack|atk) by/i.test(description) && tiers.length && ['ally', 'party', 'self'].includes(target)) {
    combat.executable = true;
    combat.confidence = 'source-described';
    combat.buff = { id: 'attack_up', name: 'ATK ↑', stat: 'attack', value: tiers.at(-1), duration: durationFrom(description) };
  } else if (/increase(?:s)?(?:.*?)(?:damage|damage dealt) by/i.test(description) && tiers.length && ['ally', 'party', 'self'].includes(target)) {
    combat.executable = true;
    combat.confidence = 'source-described';
    combat.buff = { id: 'damage_up', name: 'DMG ↑', stat: 'damage', value: tiers.at(-1), duration: durationFrom(description) };
  }
  if (/패시브|passive/i.test(skill.type || '')) {
    combat.executable = false;
    combat.confidence = 'reference-only';
    delete combat.buff;
    delete combat.debuff;
    delete combat.power;
    delete combat.powerTiers;
  }
  return {
    id: `persona-${personaId}-${kind}-${slug(name)}-${index + 1}`,
    name, sourceName: skill.name || name, kind, description, cost: sp, target, element,
    level: skill.level || null, learnLevel: skill.learn_level || null,
    priority: skill.priority ?? null, combat
  };
}

function normalizeCharacter(raw, sourceKey) {
  const name = raw.name_en || raw.name || sourceKey;
  const codename = raw.codename_en || raw.codename || name;
  return {
    id: `lufel-character-${slug(`${codename}-${sourceKey}`)}`,
    sourceKey, name, codename,
    names: { en: raw.name_en || null, jp: raw.name_jp || null, cn: raw.name_cn || null, kr: raw.name || sourceKey },
    persona: raw.persona_en || raw.persona || null,
    role: roleMap[raw.position] || (raw.role_en?.includes('Healer') ? 'Medic' : 'Vanguard'),
    roleDescription: raw.role_en || null,
    position: raw.position || null,
    element: elementMap[raw.element] || 'almighty',
    accent: raw.color || '#e61d2f', rarity: Number(raw.rarity || 5),
    releaseOrder: Number(raw.release_order || 0), tags: raw.tag_en || raw.tag || '',
    formulaStatus: 'estimated-kit'
  };
}

function normalizePersona(raw) {
  const personaId = String(raw.id || slug(raw.name_en || raw.name));
  const skills = [];
  if (raw.uniqueSkill) skills.push(normalizeSkill(raw.uniqueSkill, personaId, 'unique', 0));
  if (raw.highlight) skills.push(normalizeSkill(raw.highlight, personaId, 'highlight', 0));
  for (const [index, skill] of (raw.innate_skill || []).entries()) skills.push(normalizeSkill(skill, personaId, 'innate', index));
  if (personaId === '266') skills.find(skill => skill.kind === 'unique').name = 'Venomous Spiral';
  return {
    id: `lufel-persona-${personaId}`,
    sourceId: personaId,
    name: raw.name_en || raw.name,
    sourceName: raw.name,
    names: { en: raw.name_en || null, jp: raw.name_jp || null, cn: raw.name_cn || null, kr: raw.name || null },
    grade: Number(raw.grade || 0), stars: Number(raw.star || 0), position: raw.position || null,
    element: elementMap[raw.element] || 'almighty', tier: raw.tier || null,
    description: raw.tier_desc_en || raw.comment_en || '',
    passive: (raw.passive_skill || []).map(item => ({ name: item.name_en || item.name, description: item.desc_en || item.desc, rank: item.name_en?.match(/[IVX]+$/)?.[0] || null })),
    recommendedSkills: (raw.recommendSkill || []).map(item => ({ sourceName: item.name, name: item.name, priority: item.priority })),
    skills
  };
}

function valueFromSeries(description, pattern) {
  const match = description.match(pattern);
  if (!match) return null;
  const values = (match[1].match(/[\d.]+/g) || []).map(Number).filter(Number.isFinite);
  return values.length ? values.at(-1) / 100 : null;
}

function normalizeRecentSkill(raw, characterId, key, index) {
  const name = raw.name || (key.startsWith('skill_highlight') ? 'Highlight' : `Skill ${index + 1}`);
  const description = raw.description || '';
  const dealsDamage = /deal(?:s)? .*?damage/i.test(description);
  const supportTarget = /all allies|all party members|\bparty\b/i.test(description) ? 'party'
    : /1 ally|one ally|an ally/i.test(description) && !/foe|enemy/i.test(description) ? 'ally' : 'self';
  const target = dealsDamage && (/all foes|all enemies|each foe/i.test(description) || /aoe/i.test(raw.type || '')) ? 'all_enemies'
    : dealsDamage && /foe|enemy|target/i.test(description) ? 'boss'
      : supportTarget === 'party' ? 'party'
        : supportTarget === 'ally' ? 'ally'
          : /all foes|all enemies|each foe/i.test(description) || /aoe/i.test(raw.type || '') ? 'all_enemies'
            : /foe|enemy|target/i.test(description) ? 'boss' : 'self';
  const tiers = numericTiers(description);
  const defenseDown = valueFromSeries(description, /decrease (?:the )?(?:target'?s?|foes?'?) defense by\s+((?:[\d.]+%\s*\/\s*){0,4}[\d.]+%)/i);
  const damageTaken = valueFromSeries(description, /increase (?:the )?(?:target'?s?|foes?'?) damage taken by\s+((?:[\d.]+%\s*\/\s*){0,4}[\d.]+%)/i);
  const attackUp = valueFromSeries(description, /increase (?:the )?(?:target'?s?|allies?'?|party'?s?|own)?\s*(?:attack|atk) by\s+((?:[\d.]+%\s*\/\s*){0,4}[\d.]+%)/i);
  const damageUp = valueFromSeries(description, /increase (?:the )?(?:target'?s?|allies?'?|party'?s?|own)?\s*(?:damage|damage dealt|skill damage) by\s+((?:[\d.]+%\s*\/\s*){0,4}[\d.]+%)/i);
  const restoreClause = description.match(/restore[^\n]*?hp[^\n]*/i)?.[0] || '';
  const healAttack = valueFromSeries(restoreClause, /(?:equal to|by)\s+((?:[\d.]+%\s*\/\s*){0,4}[\d.]+%) of .*?attack/i);
  const healMaxHp = valueFromSeries(restoreClause, /((?:[\d.]+%\s*\/\s*){0,4}[\d.]+%) of (?:their |the target'?s? |own )?max hp/i);
  const healFlatTiers = (restoreClause.match(/attack\s*\+\s*([\d.]+(?:\s*\/\s*[\d.]+){0,4})/i)?.[1]
    || restoreClause.match(/hp\s+by\s+([\d.]+(?:\s*\/\s*[\d.]+){0,4})/i)?.[1]
    || '').split('/').map(Number).filter(value => Number.isFinite(value) && value > 0);
  const describedCooldown = Number(description.match(/cooldown time:\s*(\d+)/i)?.[1] || 0);
  const spRestore = Number(description.match(/restore\s+(\d+)\s+sp/i)?.[1] || 0);
  const skill = {
    id: `${characterId}-${slug(name)}-${index + 1}`,
    slot: key.startsWith('skill_highlight') ? 'HL' : `S${index + 1}`,
    name, element: inferElement(raw.element), cost: Number(raw.sp || 0), hpCost: Number(raw.hp || 0),
    cooldown: Number(raw.cool || describedCooldown || 0), power: dealsDamage ? (tiers.at(-1) || 0) : 0, powerTiers: dealsDamage ? tiers : [],
    target, description, note: description, formulaStatus: tiers.length ? 'source-described' : 'reference-only'
  };
  if (defenseDown != null) skill.debuff = { id: 'def_down', name: 'DEF ↓', value: defenseDown, duration: durationFrom(description) };
  else if (damageTaken != null) skill.debuff = { id: 'damage_taken', name: 'DAMAGE TAKEN ↑', value: damageTaken, duration: durationFrom(description) };
  if (attackUp != null) skill.buff = { id: 'attack_up', name: 'ATK ↑', stat: 'attack', value: attackUp, duration: durationFrom(description) };
  else if (damageUp != null) skill.buff = { id: 'damage_up', name: 'DMG ↑', stat: 'damage', value: damageUp, duration: durationFrom(description) };
  if (healAttack != null) skill.healAttack = healAttack;
  if (healFlatTiers.length) skill.healFlat = healFlatTiers.at(-1);
  if (healMaxHp != null) skill.heal = healMaxHp;
  if (healAttack != null || healFlatTiers.length || healMaxHp != null) skill.healTarget = supportTarget;
  if (spRestore) skill.spRestore = spRestore;
  if (/grant allies extra turns?/i.test(description)) skill.actionBonus = 1;
  const crit = valueFromSeries(description, /critical rate by\s+((?:[\d.]+%\s*\/\s*){0,4}[\d.]+%)/i);
  if (crit != null) skill.buff = { id: 'crit_rate_up', name: 'CRIT RATE ↑', stat: 'critRate', value: crit, duration: durationFrom(description) };
  if (skill.buff) skill.buffTarget = supportTarget;
  if (name === 'Beach Basket') {
    skill.scalingStat = 'maxHp';
    skill.debuff = {
      id: 'bewitching_blossoms', name: 'BEWITCHING BLOSSOMS', damageTaken: true, value: 0.114, duration: 3,
      scaling: { stat: 'maxHp', base: 0.114, per: 1200, step: 0.04, cap: 13632 }
    };
  }
  if (name === 'Gentle Sea Breeze') skill.medicinePrescription = { amount: 2, max: 2 };
  if (name === 'Two Masks as One') skill.target = 'boss';
  return skill;
}

function normalizeRecentCharacter(raw, index, revelationMapping) {
  const id = `lufel-recent-${raw.slug}`;
  const skillEntries = Object.entries(raw.skills || {}).filter(([key]) => /^skill\d+$|^skill_support$/.test(key));
  const highlightEntry = Object.entries(raw.skills || {}).find(([key]) => key.startsWith('skill_highlight'));
  const base = raw.stats?.a0_lv1 || {};
  const level80 = raw.stats?.a6_lv80 || raw.stats?.a0_lv80 || {};
  const passives = Object.entries(raw.skills || {}).filter(([key]) => key.startsWith('passive')).map(([, value]) => value);
  return {
    id, sourceKey: raw.sourceKey, slug: raw.slug, name: raw.skills?.name || raw.codename, codename: raw.codename,
    role: raw.role, element: raw.element, accent: '#e61d2f', rarity: 5, releaseOrder: 20 - index,
    awareness: 6, skillLevel: 13,
    maxHp: Math.round(Number(level80.HP || base.HP * 11.25 || 4050) / 4.5),
    maxSp: Number(base.SP || 100), attack: Math.round(Number(level80.attack || base.attack * 11.25 || 1100) / 4.6),
    defense: Math.round(Number(level80.defense || base.defense * 11.25 || 900) / 4.6),
    crit: Number(base.crit_rate || 5) / 100, critMult: Number(base.crit_mult || 150) / 100, speed: Number(base.speed || 100),
    formulaStatus: 'source-described', sourceUrl: raw.pageUrl, artwork: `/assets/characters/${raw.slug}.webp`, sourceStats: raw.stats, passives,
    recommendedRevelations: {
      main: (raw.setting?.main_revelation || []).map(name => revelationMapping[name] || name),
      sets: (raw.setting?.sub_revelation || []).map(name => revelationMapping[name] || name)
    },
    skillPriority: raw.setting?.skill_priority || null,
    skills: skillEntries.map(([key, value], skillIndex) => normalizeRecentSkill(value, id, key, skillIndex)),
    highlightSkill: highlightEntry ? normalizeRecentSkill(highlightEntry[1], id, highlightEntry[0], skillEntries.length) : null
  };
}

class LiteralParser {
  constructor(source, env = {}) { this.source = source; this.index = 0; this.env = env; }
  skip() {
    while (this.index < this.source.length) {
      if (/\s/.test(this.source[this.index])) { this.index += 1; continue; }
      if (this.source.startsWith('//', this.index)) { this.index = this.source.indexOf('\n', this.index); if (this.index < 0) this.index = this.source.length; continue; }
      if (this.source.startsWith('/*', this.index)) { const end = this.source.indexOf('*/', this.index + 2); this.index = end < 0 ? this.source.length : end + 2; continue; }
      break;
    }
  }
  string() {
    const quote = this.source[this.index++]; let value = '';
    while (this.index < this.source.length) {
      const char = this.source[this.index++];
      if (char === quote) return value;
      if (char === '\\') {
        const next = this.source[this.index++];
        value += ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v' })[next] ?? next;
      } else value += char;
    }
    throw new Error('Unterminated string');
  }
  identifier() {
    const start = this.index;
    while (/[A-Za-z0-9_$]/.test(this.source[this.index] || '')) this.index += 1;
    return this.source.slice(start, this.index);
  }
  value() {
    this.skip(); const char = this.source[this.index];
    if (char === '{') return this.object();
    if (char === '[') return this.array();
    if ('"\'`'.includes(char)) return this.string();
    if (/[\d.-]/.test(char)) { const start = this.index; while (/[\d.eE+-]/.test(this.source[this.index] || '')) this.index += 1; return Number(this.source.slice(start, this.index)); }
    const id = this.identifier();
    if (id === 'true') return true; if (id === 'false') return false; if (id === 'null') return null;
    if (Object.hasOwn(this.env, id)) return this.env[id];
    return id;
  }
  object() {
    const output = {}; this.index += 1;
    while (this.index < this.source.length) {
      this.skip(); if (this.source[this.index] === '}') { this.index += 1; return output; }
      const key = '"\'`'.includes(this.source[this.index]) ? this.string() : this.identifier();
      this.skip(); if (this.source[this.index++] !== ':') throw new Error(`Expected colon near ${this.index}`);
      output[key] = this.value(); this.skip();
      if (this.source[this.index] === ',') this.index += 1;
    }
    throw new Error('Unterminated object');
  }
  array() {
    const output = []; this.index += 1;
    while (this.index < this.source.length) {
      this.skip(); if (this.source[this.index] === ']') { this.index += 1; return output; }
      output.push(this.value()); this.skip();
      if (this.source[this.index] === ',') this.index += 1;
    }
    throw new Error('Unterminated array');
  }
}

function parseConstObject(source, name, env = {}) {
  const marker = new RegExp(`const\\s+${name}\\s*=`, 'm').exec(source);
  if (!marker) throw new Error(`${name} not found`);
  const start = source.indexOf('{', marker.index + marker[0].length);
  const parser = new LiteralParser(source.slice(start), env);
  return parser.value();
}

function parseObjectAfter(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`${marker} not found`);
  const start = source.indexOf('{', markerIndex + marker.length);
  if (start < 0) throw new Error(`Object after ${marker} not found`);
  return new LiteralParser(source.slice(start)).value();
}

function revelationCombat(set2 = '', set4 = '') {
  const combat = {};
  const attack = set2.match(/(?:attack|ATK)(?:\s+is)?\s*(?:increased|increase)?(?:\s+by)?\s*(\d+(?:\.\d+)?)%/i) || set2.match(/Increase Attack by\s*(\d+(?:\.\d+)?)%/i);
  const damage = set2.match(/(?:DMG Dealt|damage dealt)(?:\s+is)?\s*(?:increased|increase)?(?:\s+by)?\s*(\d+(?:\.\d+)?)%/i);
  const hp = set2.match(/(?:Increase |increased by )?HP(?:\s+is)?\s*(?:increased)?(?:\s+by)?\s*(\d+(?:\.\d+)?)%/i);
  const crit = set2.match(/Crit Rate(?:\s+is)?\s*(?:increased)?(?:\s+by)?\s*(\d+(?:\.\d+)?)%/i);
  const element = set2.match(/(Physical|Fire|Ice|Electric|Wind|Psychic|Nuclear|Bless|Curse)\s+(?:DMG|damage)\s+(?:is\s+)?increased by\s*(\d+(?:\.\d+)?)%/i);
  if (attack) combat.attackPercent = Number(attack[1]) / 100;
  if (damage) combat.damageBonus = Number(damage[1]) / 100;
  if (hp) combat.hpPercent = Number(hp[1]) / 100;
  if (crit) combat.critRate = Number(crit[1]) / 100;
  if (element) combat.elementBonus = { element: element[1].toLowerCase(), value: Number(element[2]) / 100 };
  const highlight = set4.match(/recovers\s+(\d+(?:\.\d+)?)%\s+of HIGHLIGHT/i);
  if (highlight) combat.highlightStart = Number(highlight[1]);
  return combat;
}

const personaFiles = (await readdir(join(sourceRoot, 'data/persona')))
  .filter(name => name.endsWith('.js') && !['order.js', 'nonorder.js'].includes(name));
const personaCatalog = [];
for (const file of personaFiles) {
  const source = await readFile(join(sourceRoot, 'data/persona', file), 'utf8');
  try { personaCatalog.push(normalizePersona(extractJsonObject(source))); }
  catch (error) { console.warn(`Skipped ${basename(file)}: ${error.message}`); }
}
personaCatalog.sort((a, b) => b.grade - a.grade || a.name.localeCompare(b.name));

const personaSkillSource = JSON.parse(await readFile(resolve(root, 'data/lufel-live-persona-skills.json'), 'utf8'));
const transferablePersonaCatalog = Object.entries(personaSkillSource.skills || {}).map(([sourceName, skill], index) => normalizeSkill({
  ...skill, name: sourceName, desc: skill.description || '', desc_en: skill.description_en || '', cost: skill.cost || ''
}, 'global', 'transferable', index));

const personaSkillBySourceName = new Map();
for (const skill of transferablePersonaCatalog) personaSkillBySourceName.set(skill.sourceName, skill);
for (const persona of personaCatalog) {
  for (const skill of persona.skills) if (!personaSkillBySourceName.has(skill.sourceName)) personaSkillBySourceName.set(skill.sourceName, skill);
}
for (const persona of personaCatalog) {
  persona.recommendedSkills = persona.recommendedSkills.map(item => {
    const resolved = personaSkillBySourceName.get(item.sourceName);
    return { ...item, name: resolved?.name || item.sourceName, skillId: resolved?.kind === 'transferable' ? resolved.id : null };
  }).sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
}

const revelationSource = await readFile(join(sourceRoot, 'data/en/revelations/revelations.js'), 'utf8');
const mapping = parseConstObject(revelationSource, 'mapping_en');
const revelationRaw = parseConstObject(revelationSource, 'enRevelationData', { mapping_en: mapping });
const revelationMains = Object.entries(revelationRaw.main || {}).map(([name, compatibleSubs]) => ({ id: `rev-main-${slug(name)}`, name, compatibleSubs }));
const revelationSets = Object.entries(revelationRaw.sub_effects || {}).map(([name, effect]) => ({
  id: `rev-set-${slug(name)}`, name, set2: effect.set2 || '', set4: effect.set4 || '', tags: effect.type || [],
  compatibleMains: revelationRaw.sub?.[name] || [], combat: revelationCombat(effect.set2, effect.set4)
}));

const recentSource = JSON.parse(await readFile(resolve(root, 'data/lufel-live-recent.json'), 'utf8'));
const characterCatalog = recentSource.characters.map((character, index) => normalizeRecentCharacter(character, index, mapping));

let commit = 'unknown';
try { commit = execFileSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
if (commit === 'unknown') {
  try {
    const head = (await readFile(join(sourceRoot, '.git', 'HEAD'), 'utf8')).trim();
    if (head.startsWith('ref: ')) commit = (await readFile(join(sourceRoot, '.git', head.slice(5)), 'utf8')).trim();
    else if (/^[0-9a-f]{40}$/i.test(head)) commit = head;
  } catch {}
}
if (commit === 'unknown') {
  try {
    const archivedCommit = (await readFile(join(sourceRoot, 'SOURCE-COMMIT.txt'), 'utf8')).trim();
    if (/^[0-9a-f]{40}$/i.test(archivedCommit)) commit = archivedCommit;
  } catch {}
}
const catalog = {
  schemaVersion: '2.0', generatedAt: new Date().toISOString(),
  source: { name: 'Lufelnet', repository: 'https://github.com/nalaleo808-cmd/lufelnet', commit, characterPage: recentSource.source },
  counts: { personas: personaCatalog.length, personaSkills: personaCatalog.reduce((sum, persona) => sum + persona.skills.length, 0), transferablePersonaSkills: transferablePersonaCatalog.length, characters: characterCatalog.length, revelationMains: revelationMains.length, revelationSets: revelationSets.length },
  personas: personaCatalog, personaSkills: transferablePersonaCatalog, characters: characterCatalog, revelationMains, revelationSets
};

await mkdir(resolve(root, 'data'), { recursive: true });
await mkdir(resolve(root, 'src/generated'), { recursive: true });
await writeFile(outputJson, `${JSON.stringify(catalog, null, 2)}\n`);
await writeFile(outputModule, `// Generated by scripts/import-lufelnet.mjs. Do not edit by hand.\nexport const lufelCatalog = ${JSON.stringify(catalog, null, 2)};\n`);
console.log(`Imported ${catalog.counts.personas} Personas, ${catalog.counts.personaSkills} skills, ${catalog.counts.characters} characters, ${catalog.counts.revelationMains} Revelation mains, and ${catalog.counts.revelationSets} Revelation sets.`);
