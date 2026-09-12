export const PERSONA_EQUIP_SLOT_COUNT = 6;

const sameSkill = (left, right) => Boolean(left && right) && (
  (left.sourceName && right.sourceName && left.sourceName === right.sourceName)
  || left.name === right.name
);

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
  for (const innate of (persona?.skills || []).filter(skill => skill.kind === 'innate')) {
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
