export const PERSONA_EQUIP_SLOT_COUNT = 6;

const sameSkill = (left, right) => Boolean(left && right) && (
  (left.sourceName && right.sourceName && left.sourceName === right.sourceName)
  || left.name === right.name
);

function romanRankValue(value) {
  if (/^\d+$/.test(String(value || ''))) return Number(value);
  const roman = String(value || '').toUpperCase();
  if (!/^[IVXLCDM]+$/.test(roman)) return 0;
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  return [...roman].reduce((total, character, index, characters) => {
    const value = values[character];
    return total + (value < (values[characters[index + 1]] || 0) ? -value : value);
  }, 0);
}

export function highestRankPersonaPassive(persona) {
  const passives = Array.isArray(persona?.passive) ? persona.passive : [];
  if (!passives.length) return persona?.maxRankPassive || null;
  return [...passives].sort((left, right) => {
    const leftRank = Number.isFinite(Number(left.rankValue)) ? Number(left.rankValue) : romanRankValue(left.rank);
    const rightRank = Number.isFinite(Number(right.rankValue)) ? Number(right.rankValue) : romanRankValue(right.rank);
    return rightRank - leftRank || Number(right.sourceIndex || 0) - Number(left.sourceIndex || 0);
  })[0];
}

export function buildPersonaLoadoutCatalog(catalog, supplementalSkills = []) {
  const transferableSkills = [];
  const transferableSkillById = new Map();
  const skillById = new Map();

  for (const persona of catalog.personas || []) {
    for (const skill of persona.skills || []) skillById.set(skill.id, skill);
  }

  for (const skill of [...(catalog.personaSkills || []), ...supplementalSkills]) {
    if (!skill?.id || (skill.kind !== 'transferable' && skill.kind !== 'recorded')) continue;
    skillById.set(skill.id, skill);
    if (transferableSkillById.has(skill.id)) continue;
    transferableSkillById.set(skill.id, skill);
    transferableSkills.push(skill);
  }

  return { transferableSkills, transferableSkillById, skillById };
}

export function fixedPersonaSkills(persona) {
  return (persona?.skills || []).filter(skill => ['unique', 'highlight'].includes(skill.kind));
}

export function legalTransferableSkillsForPersona(persona, transferableSkills) {
  const fixed = fixedPersonaSkills(persona);
  return transferableSkills.filter(skill => !fixed.some(nativeSkill => sameSkill(nativeSkill, skill)));
}

export function sanitizePersonaSkillIds(persona, skillIds, transferableSkills, slotCount = PERSONA_EQUIP_SLOT_COUNT) {
  const legalIds = new Set(legalTransferableSkillsForPersona(persona, transferableSkills).map(skill => skill.id));
  const seen = new Set();
  return Array.from({ length: slotCount }, (_, index) => {
    const id = Array.isArray(skillIds) ? skillIds[index] : '';
    if (!id || seen.has(id) || !legalIds.has(id)) return '';
    seen.add(id);
    return id;
  });
}

export function defaultPersonaSkillIds(persona, transferableSkills, slotCount = PERSONA_EQUIP_SLOT_COUNT) {
  const legal = legalTransferableSkillsForPersona(persona, transferableSkills);
  const legalById = new Map(legal.map(skill => [skill.id, skill]));
  const bySourceName = new Map(legal.map(skill => [skill.sourceName, skill]));
  const byName = new Map(legal.map(skill => [skill.name, skill]));
  const candidates = [];

  for (const recommendation of persona?.recommendedSkills || []) {
    const skill = legalById.get(recommendation.skillId)
      || bySourceName.get(recommendation.sourceName)
      || byName.get(recommendation.name);
    if (skill) candidates.push(skill.id);
  }
  // Personas with a curated recommendation list default to exactly that list.
  for (const innate of persona?.recommendationsOnly ? [] : (persona?.skills || []).filter(skill => skill.kind === 'innate')) {
    const skill = bySourceName.get(innate.sourceName) || byName.get(innate.name);
    if (skill) candidates.push(skill.id);
  }

  return sanitizePersonaSkillIds(persona, [...new Set(candidates)], transferableSkills, slotCount);
}

export function battleSkillsForPersona(persona, skillIds, skillById, transferableSkills) {
  const equippedIds = sanitizePersonaSkillIds(persona, skillIds, transferableSkills);
  const fixed = fixedPersonaSkills(persona).filter(skill => skill.kind === 'unique' && skill.combat?.executable);
  const equipped = equippedIds.map(id => skillById.get(id)).filter(skill => skill?.combat?.executable);
  const seen = new Set();
  return [...fixed, ...equipped].filter(skill => {
    const key = skill.sourceName || skill.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const passiveElementWords = Object.freeze({
  physical: 'physical', gun: 'gun', fire: 'fire', ice: 'ice', electric: 'electric', wind: 'wind',
  nuclear: 'nuclear', psychokinesis: 'psychic', psy: 'psychic', bless: 'bless', curse: 'curse'
});

// Static stat passives read from a single-tier skill description, e.g.
// "Increase Ice damage by 10.8%." or "Increase Speed by 9. Decrease Defense
// by 4%." Conditional or timed text (start of battle, turns, when, after, if)
// and multi-tier summaries ("4.7%/6.7%") are skipped.
export function staticPassiveEffectsFromSkill(skill) {
  const text = String(skill?.description || '').trim();
  if (!text || text.includes('/') || /start of battle|\bturns?\b|\bwhen\b|\bafter\b|\bif\b|taken/i.test(text)) return [];
  const effects = [];
  const element = text.match(/^Increases? (\w+) damage by ([\d.]+)%/i);
  if (element && passiveElementWords[element[1].toLowerCase()]) {
    effects.push({ stat: 'elementDamage', element: passiveElementWords[element[1].toLowerCase()], value: Number(element[2]) / 100 });
  } else {
    const damage = text.match(/^Increases? damage by ([\d.]+)%/i);
    if (damage) effects.push({ stat: 'damage', value: Number(damage[1]) / 100 });
  }
  const crit = text.match(/Increases? critical rate by ([\d.]+)%/i);
  if (crit) effects.push({ stat: 'critRate', value: Number(crit[1]) / 100 });
  const speed = text.match(/Increases? Speed by (\d+(?:\.\d+)?)(?![\d.]*%)/i);
  if (speed) effects.push({ stat: 'speed', value: Number(speed[1]) });
  const defense = text.match(/Decreases? Defense by ([\d.]+)%/i);
  if (defense) effects.push({ stat: 'defense', value: -Number(defense[1]) / 100 });
  return effects.map(effect => ({ ...effect, skillName: skill.name }));
}
