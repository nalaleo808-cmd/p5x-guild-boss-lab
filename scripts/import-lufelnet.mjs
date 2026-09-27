import { normalizeCosmicYuiRecord } from '../src/cosmic-yui-data.js';
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
  wind: 'wind', psychokinesis: 'psychic', psychic: 'psychic', psy: 'psychic', nuclear: 'nuclear',
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

const percentSeriesPattern = String.raw`([\d.]+%?(?:\s*\/\s*[\d.]+%?){0,6})`;

function numberSeries(value, divisor = 1) {
  return (String(value || '').match(/[\d.]+/g) || [])
    .map(item => Number(item) / divisor)
    .filter(Number.isFinite);
}

function percentSeries(value) {
  return numberSeries(value, 100);
}

function percentTiersFrom(description, pattern) {
  const match = String(description || '').match(pattern);
  return match ? percentSeries(match[1]) : [];
}

function numericTiers(description) {
  return percentTiersFrom(description, new RegExp(`(?:equal to|by)\\s+${percentSeriesPattern}`, 'i'));
}

function damageTiers(description) {
  const standard = percentTiersFrom(description, new RegExp(`\\bdeal(?:s)?\\b[^.]*?\\bdamage\\b[^.]*?(?:equal to|by)\\s+${percentSeriesPattern}`, 'i'));
  if (standard.length) return standard;
  return percentTiersFrom(description, new RegExp(`\\bdeal(?:s)?\\s+${percentSeriesPattern}\\s+(?:of )?(?:the user'?s )?(?:atk|attack)\\b[^.]*?\\bdmg\\b`, 'i'));
}

function durationFrom(description) {
  const match = description.match(/for\s+(\d+)\s+turn/i);
  return match ? Number(match[1]) : 2;
}

function sourcedDurationFrom(description) {
  const match = String(description || '').match(/for\s+(\d+)\s+turn/i);
  return match ? Number(match[1]) : null;
}

function sentenceFrom(description, marker) {
  const text = String(description || '');
  const start = text.search(marker);
  if (start < 0) return '';
  const remainder = text.slice(start);
  const end = remainder.search(/\.(?=\s+[A-Z\[])/);
  return end < 0 ? remainder : remainder.slice(0, end);
}

function hitCountFrom(description) {
  const damageClause = sentenceFrom(description, /\bdeal(?:s)?\b/i);
  const range = damageClause.match(/\((\d+)\s+(?:to|~|-)\s+(\d+)\s+hits?\)/i);
  if (range) return { hitCountRange: [Number(range[1]), Number(range[2])] };
  const exact = damageClause.match(/\((\d+)\s+hits?\)/i) || damageClause.match(/\b(\d+)\s+times\b/i);
  return exact ? { hitCount: Number(exact[1]) } : {};
}

function targetFromText(value, fallback = 'self') {
  const text = String(value || '');
  if (/all allies|all party members|party'?s/i.test(text)) return 'party';
  if (/\b(?:the )?(?:user|self|own)\b/i.test(text) && !/foe|enemy/i.test(text)) return 'self';
  if (/\bally\b|1 ally|one ally/i.test(text) && !/foe|enemy/i.test(text)) return 'ally';
  if (/all foes|all enemies|each foe/i.test(text)) return 'all_enemies';
  if (/foe|enemy|target/i.test(text)) return 'boss';
  return fallback;
}

function skillCostFields(value) {
  const raw = String(value || '').trim();
  const fixedSp = raw.match(/\bSP\s*(\d+)\b/i);
  if (fixedSp) return { cost: Number(fixedSp[1]), costType: 'sp_fixed', costSource: raw };
  const hp = raw.match(/(?:\bHP|체력)\s*([\d.]+)%/i);
  if (hp) return { cost: 0, hpCost: Number(hp[1]), costType: 'hp_percent', costSource: raw };
  if (/\bSP\b/i.test(raw)) return { cost: 0, costType: 'sp_formula', costFormula: raw, costSource: raw };
  return { cost: 0, costType: 'missing' };
}

const ailmentIds = {
  burn: 'burn', freeze: 'freeze', shock: 'shock', windswept: 'windswept',
  sleep: 'sleep', forget: 'forget', fear: 'fear', despair: 'despair',
  brainwash: 'brainwash', rage: 'rage', enrage: 'rage', confuse: 'confuse',
  confusion: 'confuse', dizzy: 'dizzy'
};

const spiritualAilments = new Set(['sleep', 'forget', 'fear', 'despair', 'brainwash', 'rage', 'confuse', 'dizzy']);
const elementalAilments = new Set(['burn', 'freeze', 'shock', 'windswept']);

function normalizeAilmentName(value) {
  const name = String(value || '').trim().replace(/\s+(?:state|status)$/i, '').toLowerCase();
  return ailmentIds[name] || slug(name);
}

function makeExecutable(combat) {
  combat.executable = true;
  combat.confidence = 'source-described';
}

function romanRankValue(value) {
  const digits = String(value || '').match(/^\d+$/);
  if (digits) return Number(digits[0]);
  const roman = String(value || '').toUpperCase();
  if (!/^[IVXLCDM]+$/.test(roman)) return 0;
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  return [...roman].reduce((total, character, index, characters) => {
    const value = values[character];
    return total + (value < (values[characters[index + 1]] || 0) ? -value : value);
  }, 0);
}

const runtimePersonaPassiveStats = new Set(['attack', 'defense', 'critRate', 'critDamage', 'healing', 'elementDamage']);

function passiveLimitations(text, hasParsedOpening) {
  const limitations = [];
  if (/\b(?:at the start|at the end|each turn|for \d+ turns?|lasts? for|per turn)\b/i.test(text)) {
    limitations.push('Battle-start, turn-timed, and duration clauses are reference-only.');
  }
  if (/\b(?:when|after|before|if|while|only|whenever|upon|below|above|less than|more than)\b/i.test(text)) {
    limitations.push('Conditional and triggered clauses are reference-only.');
  }
  if (/\bstacks?\b|\bspend\b|\bconsume/i.test(text)) limitations.push('Stack generation and consumption clauses are reference-only.');
  if (/\b(?:SP|HP) cost\b/i.test(text)) limitations.push('Skill-cost modification clauses are reference-only.');
  if (/insta-?kill/i.test(text)) limitations.push('Instant-kill clauses are reference-only.');
  if (!hasParsedOpening || !limitations.length) limitations.push('Remaining passive text is reference-only.');
  return [...new Set(limitations)];
}

function normalizePersonaPassive(item, index) {
  const name = item.name_en || item.name || `Passive ${index + 1}`;
  const description = String(item.desc_en || item.desc || '').replace(/\s+/g, ' ').trim();
  const rank = name.match(/(?:^|\s)([IVXLCDM]+|\d+)$/i)?.[1] || null;
  const firstSentence = description.match(/^.*?[.!?](?=\s|$)/)?.[0] || description;
  const statMatch = firstSentence.match(/^Increase(?:s)?\s+(Attack|ATK|Defense|DEF|critical rate|critical damage|ailment accuracy|ailment resistance|healing(?: effect)?|(?:max )?HP)\s+(?:by\s+)?([\d.]+)%/i);
  const elementMatch = firstSentence.match(/^Increase(?:s)?\s+(Physical|Gun|Fire|Ice|Electric|Wind|Psychic|Psychokinesis|Nuclear|Bless|Curse)\s+damage(?: dealt)?\s+(?:by\s+)?([\d.]+)%/i);
  const effects = [];
  let parsedLength = 0;
  if (statMatch) {
    const key = statMatch[1].toLowerCase();
    const stat = key === 'attack' || key === 'atk' ? 'attack'
      : key === 'defense' || key === 'def' ? 'defense'
        : key === 'critical rate' ? 'critRate'
          : key === 'critical damage' ? 'critDamage'
            : key === 'ailment accuracy' ? 'ailmentAccuracy'
              : key === 'ailment resistance' ? 'ailmentResistance'
                : key.startsWith('healing') ? 'healing' : 'maxHp';
    effects.push({
      id: `static_${stat}`, stat, value: Number(statMatch[2]) / 100,
      scope: 'self', timing: 'while_active', runtimeSupported: runtimePersonaPassiveStats.has(stat),
      sourceText: statMatch[0]
    });
    parsedLength = statMatch[0].length;
  } else if (elementMatch) {
    effects.push({
      id: `static_${inferElement(elementMatch[1])}_damage`, stat: 'elementDamage',
      element: inferElement(elementMatch[1]), value: Number(elementMatch[2]) / 100,
      scope: 'self', timing: 'while_active', runtimeSupported: true, sourceText: elementMatch[0]
    });
    parsedLength = elementMatch[0].length;
  }

  const unsupportedText = [firstSentence.slice(parsedLength).replace(/^[\s.,;:]+/, ''), description.slice(firstSentence.length)]
    .filter(Boolean).join(' ').trim();
  const limitations = unsupportedText ? passiveLimitations(unsupportedText, effects.length > 0) : [];
  for (const effect of effects.filter(candidate => !candidate.runtimeSupported)) {
    limitations.push(effect.stat === 'maxHp'
      ? 'Max HP passives are not applied until Persona-switch HP semantics are sourced.'
      : 'Ailment accuracy and resistance passives are not applied until the conversion formula is sourced.');
  }
  const runtimeEffects = effects.filter(effect => effect.runtimeSupported);
  return {
    name, description, rank, rankValue: romanRankValue(rank), sourceIndex: index,
    combat: {
      confidence: effects.length ? 'source-explicit' : 'reference-only',
      runtimeStatus: runtimeEffects.length ? (limitations.length ? 'partial' : 'implemented') : 'reference-only',
      effects,
      limitations: [...new Set(limitations)]
    }
  };
}

function highestRankPassive(passives) {
  return [...passives].sort((left, right) => Number(right.rankValue || 0) - Number(left.rankValue || 0)
    || Number(right.sourceIndex || 0) - Number(left.sourceIndex || 0))[0] || null;
}

function normalizeSkill(skill, personaId, kind, index) {
  const name = skill.name_en || skill.name || `${kind} ${index + 1}`;
  const description = skill.desc_en || skill.desc || '';
  const tiers = damageTiers(description);
  const cost = skillCostFields(skill.cost);
  const primaryClause = description.split('.')[0] || description;
  const target = targetFromText(primaryClause, targetFromText(description));
  const lower = `${name} ${description}`.toLowerCase();
  const sourcedDuration = sourcedDurationFrom(description);
  let element = elementMap[skill.icon] || elementMap[skill.icon_gl] || null;
  if (!element) element = inferElement(lower);
  const combat = { executable: false, confidence: 'reference-only' };
  if (tiers.length) {
    makeExecutable(combat);
    combat.powerTiers = tiers;
    combat.power = tiers.at(-1);
    Object.assign(combat, hitCountFrom(description));
    if (combat.hitCountRange) {
      combat.hitCountModel = 'uniform-unverified';
      combat.limitations = [...(combat.limitations || []), 'Hit-count probability weighting is not published; the simulator samples the sourced range uniformly.'];
    }
    const critTiers = percentTiersFrom(description, new RegExp(`increase(?: this skill'?s)? critical rate by\\s+${percentSeriesPattern}`, 'i'));
    if (critTiers.length) {
      combat.critBonusTiers = critTiers;
      combat.critBonus = critTiers.at(-1);
    }
    const accuracyTiers = percentTiersFrom(description, new RegExp(`decrease(?: this skill'?s)? accuracy by\\s+${percentSeriesPattern}`, 'i'));
    if (accuracyTiers.length) {
      combat.accuracyModifierTiers = accuracyTiers.map(value => -value);
      combat.accuracyModifier = -accuracyTiers.at(-1);
      combat.limitations = [...(combat.limitations || []), 'Base hit-rate and evasion formulas are not present in the sourced tooltip.'];
    }
    if (/ignoring (?:their|the target'?s?) defense/i.test(description)) combat.ignoreDefense = true;
  }

  const vulnerability = description.match(new RegExp(`increase(?:s)? (?:all |1 )?foe(?:s'?|'s)?\\s*(?:(fire|ice|electric|wind|psy|psychic|nuclear|bless|curse|physical|gun|almighty)\\s+)?(?:damage|dmg) taken by\\s+${percentSeriesPattern}`, 'i'));
  if (vulnerability) {
    const vulnerabilityElement = vulnerability[1] ? inferElement(vulnerability[1]) : null;
    const vulnerabilityTiers = percentSeries(vulnerability[2]);
    const debuff = {
      id: vulnerabilityElement ? `${vulnerabilityElement}_vuln` : 'damage_taken',
      name: vulnerabilityElement ? `${vulnerabilityElement.toUpperCase()} EXPOSED` : 'DAMAGE TAKEN UP',
      value: vulnerabilityTiers.at(-1), valueTiers: vulnerabilityTiers,
      duration: sourcedDuration
    };
    if (vulnerabilityElement) {
      debuff.elementDamageTaken = vulnerabilityElement;
      debuff.elementDamageTakenValue = vulnerabilityTiers.at(-1);
    } else debuff.damageTaken = true;
    if (sourcedDuration != null) {
      makeExecutable(combat);
      combat.debuff = debuff;
    } else combat.limitations = [...(combat.limitations || []), 'The tooltip does not state this effect duration.'];
  }

  const healClause = sentenceFrom(description, /\b(?:restore|heal)\b/i);
  const healAttackTiers = percentTiersFrom(healClause, new RegExp(`(?:hp[^.]*?(?:by|equal to)|heal[^.]*?for)\\s+${percentSeriesPattern}\\s+(?:of )?(?:the user'?s )?attack`, 'i'));
  const healFlatMatch = healClause.match(/attack\s*\+\s*([\d.]+(?:\s*\/\s*[\d.]+){0,6})/i);
  const healFlatTiers = healFlatMatch ? numberSeries(healFlatMatch[1]) : [];
  if (healAttackTiers.length || healFlatTiers.length) {
    makeExecutable(combat);
    if (healAttackTiers.length) {
      combat.healAttackTiers = healAttackTiers;
      combat.healAttack = healAttackTiers.at(-1);
    }
    if (healFlatTiers.length) {
      combat.healFlatTiers = healFlatTiers;
      combat.healFlat = healFlatTiers.at(-1);
    }
    combat.healTarget = targetFromText(healClause, target);
  }
  const spRestore = Number(description.match(/restore (?:party'?s|all allies'?|1 ally'?s|the user'?s)?\s*sp by\s+(\d+)/i)?.[1] || 0);
  if (spRestore > 0) {
    makeExecutable(combat);
    combat.spRestore = spRestore;
    combat.healTarget = /party|all allies/i.test(description) ? 'party' : targetFromText(description, target);
  }

  if (['ally', 'party', 'self'].includes(target)) {
    const buffDefinitions = [
      ['attack_up', 'ATK UP', 'attack', new RegExp(`increase[^.]*?\\b(?:attack|atk)\\b by\\s+${percentSeriesPattern}`, 'i')],
      ['defense_up', 'DEF UP', 'defense', new RegExp(`increase[^.]*?\\b(?:defense|def)\\b by\\s+${percentSeriesPattern}`, 'i')],
      ['crit_rate_up', 'CRIT RATE UP', 'critRate', new RegExp(`increase[^.]*?critical rate by\\s+${percentSeriesPattern}`, 'i')],
      ['crit_damage_up', 'CRIT DMG UP', 'critDamage', new RegExp(`increase[^.]*?critical (?:damage|effect) by\\s+${percentSeriesPattern}`, 'i')],
      ['damage_up', 'DMG UP', 'damage', new RegExp(`increase[^.]*?(?:damage dealt|skill damage|damage) by\\s+${percentSeriesPattern}`, 'i')]
    ];
    const buffs = [];
    for (const [id, buffName, stat, pattern] of buffDefinitions) {
      const values = percentTiersFrom(description, pattern);
      if (!values.length) continue;
      if (sourcedDuration != null) buffs.push({ id, name: buffName, stat, value: values.at(-1), valueTiers: values, duration: sourcedDuration });
      else combat.limitations = [...(combat.limitations || []), `The tooltip does not state the ${buffName} duration.`];
    }
    const scalingMatch = description.match(new RegExp(`for every\\s+([\\d.]+)\\s+of the user'?s\\s+(attack|defense|max hp|hp)[^.]*?by\\s+${percentSeriesPattern}\\s+more,?\\s+up to\\s+${percentSeriesPattern}`, 'i'));
    if (scalingMatch) {
      const stat = scalingMatch[2].toLowerCase().replace('max hp', 'maxHp').replace(/^hp$/, 'maxHp');
      const scaledBuff = buffs.find(item => item.stat === (stat === 'maxHp' ? 'maxHp' : stat));
      const stepTiers = percentSeries(scalingMatch[3]);
      const capTiers = percentSeries(scalingMatch[4]);
      if (scaledBuff && stepTiers.length && capTiers.length) {
        scaledBuff.scaling = { stat, base: scaledBuff.value, per: Number(scalingMatch[1]), step: stepTiers.at(-1), maxBonus: capTiers.at(-1) };
      }
    }
    if (buffs.length) {
      makeExecutable(combat);
      combat.buffs = buffs;
      combat.buff = buffs[0];
      combat.buffTarget = target;
    }
  }

  const defenseDownTiers = percentTiersFrom(description, new RegExp(`decrease(?:s)?[^.]*?foe(?:s'?|'s)?\\s+(?:defense|def) by\\s+${percentSeriesPattern}`, 'i'));
  if (defenseDownTiers.length) {
    if (sourcedDuration != null) {
      makeExecutable(combat);
      const debuff = { id: 'def_down', name: 'DEF DOWN', stat: 'defenseDown', value: defenseDownTiers.at(-1), valueTiers: defenseDownTiers, duration: sourcedDuration };
      combat.debuff = combat.debuff || debuff;
      combat.debuffs = [...(combat.debuffs || (combat.debuff ? [combat.debuff] : []))];
      if (!combat.debuffs.some(item => item.id === debuff.id)) combat.debuffs.push(debuff);
    } else combat.limitations = [...(combat.limitations || []), 'The tooltip does not state the Defense Down duration.'];
  }

  const ailmentMatch = description.match(new RegExp(`${percentSeriesPattern}\\s+(?:base )?chance to inflict\\s+([a-z][a-z -]*?)(?:\\s+on\\s+(?:1 foe|all foes|foes|the target))?\\s+for\\s+(\\d+)\\s+turn`, 'i'));
  if (ailmentMatch) {
    const chances = percentSeries(ailmentMatch[1]);
    const ailmentId = normalizeAilmentName(ailmentMatch[2]);
    const debuff = {
      id: ailmentId, name: ailmentId.toUpperCase(), ailment: true,
      chance: chances.at(-1), chanceTiers: chances, duration: Number(ailmentMatch[3]),
      spiritualAilment: spiritualAilments.has(ailmentId), elementalAilment: elementalAilments.has(ailmentId)
    };
    makeExecutable(combat);
    combat.limitations = [...(combat.limitations || []), 'The tooltip provides base ailment chance but not the ailment-accuracy and resistance conversion formula.'];
    combat.debuff = combat.debuff || debuff;
    combat.debuffs = [...(combat.debuffs || (combat.debuff ? [combat.debuff] : []))];
    if (!combat.debuffs.some(item => item.id === debuff.id)) combat.debuffs.push(debuff);
  }

  const technicalMatch = description.match(new RegExp(`increase damage by\\s+${percentSeriesPattern}\\s+for foes with an?\\s+(spiritual|elemental) ailment`, 'i'));
  if (/\bTechnical\b/i.test(description) && technicalMatch) {
    const values = percentSeries(technicalMatch[1]);
    combat.technical = {
      sourceUrl: 'https://lufel.net/en/persona/',
      ailmentIds: technicalMatch[2].toLowerCase() === 'spiritual' ? [...spiritualAilments] : [...elementalAilments],
      activation: 'compatible_ailment', damageMultiplier: 1 + values.at(-1)
    };
    combat.technicalDamageTiers = values;
  }

  if (/insta-kill/i.test(description)) {
    combat.limitations = [...(combat.limitations || []), 'The tooltip does not quantify the instant-kill chance or missing-HP scaling.'];
  }
  if (combat.executable && /\b(?:if|when|for each|automatically|cooldown|random)\b|\bstacks?\b/i.test(description)) {
    combat.limitations = [...new Set([...(combat.limitations || []), 'Conditional, triggered, stack, or cooldown clauses remain reference-only unless represented by structured combat fields.'])];
  }
  if (kind === 'transferable' && name === 'Tempest Slash'
    && combat.hitCountRange?.[0] === 2 && combat.hitCountRange?.[1] === 3) {
    combat.executable = false;
    combat.confidence = 'reference-only';
    combat.limitations = [...(combat.limitations || []), 'This duplicate record has no current Persona assignment or verified English Lufel page.'];
  }
  if (/패시브|passive/i.test(skill.type || '')) {
    combat.executable = false;
    combat.confidence = 'reference-only';
    delete combat.buff;
    delete combat.buffs;
    delete combat.debuff;
    delete combat.debuffs;
    delete combat.power;
    delete combat.powerTiers;
    delete combat.healAttack;
    delete combat.healAttackTiers;
    delete combat.healFlat;
    delete combat.healFlatTiers;
  }
  return {
    id: `persona-${personaId}-${kind}-${slug(name)}-${index + 1}`,
    name, sourceName: skill.name || name, kind, description, ...cost, target, element,
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
  const passives = (raw.passive_skill || []).map(normalizePersonaPassive);
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
    comment: raw.comment_en || '', event: Boolean(raw.event), bestPersona: Boolean(raw.best_persona),
    wildEmblemRainbow: Boolean(raw.wild_emblem_rainbow), craftingCost: raw.cost || null,
    combinations: Array.isArray(raw.combination) ? raw.combination : [],
    passive: passives,
    maxRankPassive: highestRankPassive(passives),
    recommendedSkills: (raw.recommendSkill || []).map(item => ({ sourceName: item.name, name: item.name, priority: item.priority })),
    skills
  };
}

function findWeaponRecord(value, path = []) {
  if (!value || typeof value !== 'object' || path.length > 10) return null;
  if (!Array.isArray(value) && Object.keys(value).some(key => /^weapon[345]-\d+$/.test(key))) return { value, path };
  for (const [key, child] of Object.entries(value)) {
    const found = findWeaponRecord(child, [...path, key]);
    if (found) return found;
  }
  return null;
}

function normalizeWeapon(characterSlug, sourcePath, sourceKey, raw) {
  const rarity = Number(sourceKey.match(/^weapon(\d)/)?.[1] || 0);
  return {
    id: `weapon-${characterSlug}-${sourceKey}`,
    characterSlug, sourceKey, sourcePath, rarity,
    category: rarity === 5 ? 'signature' : rarity === 4 ? 'four-star' : rarity === 3 ? 'three-star' : 'other',
    name: raw.name || sourceKey, skillName: raw.skill_name || null,
    stats: {
      maxHp: Number(raw.health || raw.stats?.HP || 0),
      attack: Number(raw.attack || raw.stats?.attack || 0),
      defense: Number(raw.defense || raw.stats?.defense || 0)
    },
    description: raw.description || '', formulaStatus: 'source-described'
  };
}

async function loadCharacterWeapons() {
  const catalog = [];
  const researchRoot = resolve(root, 'data/character-research');
  for (const file of await readdir(researchRoot)) {
    if (!file.endsWith('.json')) continue;
    const raw = JSON.parse(await readFile(join(researchRoot, file), 'utf8'));
    const found = findWeaponRecord(raw);
    if (!found) continue;
    for (const [sourceKey, weapon] of Object.entries(found.value)) {
      if (!/^weapon[345]-\d+$/.test(sourceKey) || !weapon || typeof weapon !== 'object') continue;
      catalog.push(normalizeWeapon(raw.slug || file.replace(/\.json$/, ''), found.path.join('.'), sourceKey, weapon));
    }
  }
  return catalog;
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
  if (raw.slug === 'bui-cosmic') return normalizeCosmicYuiRecord(raw);
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

const personaRoot = join(sourceRoot, 'data/persona');
const personaFiles = (await readdir(personaRoot))
  .filter(name => name.endsWith('.js') && !['order.js', 'nonorder.js'].includes(name))
  .map(name => ({ path: join(personaRoot, name), availability: 'ordered' }));
const referencePersonaRoot = join(personaRoot, 'nonorder');
for (const name of await readdir(referencePersonaRoot)) {
  if (name.endsWith('.js')) personaFiles.push({ path: join(referencePersonaRoot, name), availability: 'reference' });
}
const personaCatalog = [];
const personaIds = new Set();
for (const file of personaFiles) {
  const source = await readFile(file.path, 'utf8');
  try {
    const persona = normalizePersona(extractJsonObject(source));
    if (personaIds.has(persona.id)) continue;
    personaIds.add(persona.id);
    persona.availability = file.availability;
    personaCatalog.push(persona);
  } catch (error) { console.warn(`Skipped ${basename(file.path)}: ${error.message}`); }
}
personaCatalog.sort((a, b) => (a.availability === 'ordered' ? -1 : 1) - (b.availability === 'ordered' ? -1 : 1)
  || b.grade - a.grade || a.name.localeCompare(b.name));

const personaCostBySourceName = new Map();
for (const persona of personaCatalog) {
  for (const skill of persona.skills) {
    if (!skill.sourceName || skill.costType === 'missing' || personaCostBySourceName.has(skill.sourceName)) continue;
    personaCostBySourceName.set(skill.sourceName, {
      cost: skill.cost, costType: skill.costType,
      ...(skill.hpCost != null ? { hpCost: skill.hpCost } : {}),
      ...(skill.costFormula ? { costFormula: skill.costFormula } : {}),
      ...(skill.costSource ? { costSource: skill.costSource } : {})
    });
  }
}

const personaSkillSource = JSON.parse(await readFile(resolve(root, 'data/lufel-live-persona-skills.json'), 'utf8'));
const transferablePersonaCatalog = Object.entries(personaSkillSource.skills || {}).map(([sourceName, skill], index) => {
  const normalized = normalizeSkill({
    ...skill, name: sourceName, desc: skill.description || '', desc_en: skill.description_en || '', cost: skill.cost || ''
  }, 'global', 'transferable', index);
  const joinedCost = normalized.costType === 'missing' ? personaCostBySourceName.get(sourceName) : null;
  return joinedCost ? { ...normalized, ...joinedCost } : normalized;
});

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
const weaponCatalog = await loadCharacterWeapons();
const cosmicSource = recentSource.characters.find(character => character.slug === 'bui-cosmic');
for (const [category, weapon] of Object.entries(cosmicSource?.weaponData || {})) {
  const sourceKey = category === 'signature' ? 'weapon5-1' : category === 'four-star' ? 'weapon4-1' : category;
  weaponCatalog.push({
    ...normalizeWeapon('bui-cosmic', 'lufel-live-recent.weaponData', sourceKey, weapon),
    category, refinementEffects: Object.fromEntries(Object.entries(weapon).filter(([, value]) => Array.isArray(value)))
  });
}
weaponCatalog.sort((a, b) => a.characterSlug.localeCompare(b.characterSlug) || b.rarity - a.rarity || a.name.localeCompare(b.name));

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
  counts: { personas: personaCatalog.length, orderedPersonas: personaCatalog.filter(persona => persona.availability === 'ordered').length, personaSkills: personaCatalog.reduce((sum, persona) => sum + persona.skills.length, 0), transferablePersonaSkills: transferablePersonaCatalog.length, characters: characterCatalog.length, weapons: weaponCatalog.length, revelationMains: revelationMains.length, revelationSets: revelationSets.length },
  personas: personaCatalog, personaSkills: transferablePersonaCatalog, characters: characterCatalog, weapons: weaponCatalog, revelationMains, revelationSets
};

await mkdir(resolve(root, 'data'), { recursive: true });
await mkdir(resolve(root, 'src/generated'), { recursive: true });
await writeFile(outputJson, `${JSON.stringify(catalog, null, 2)}\n`);
await writeFile(outputModule, `// Generated by scripts/import-lufelnet.mjs. Do not edit by hand.\nexport const lufelCatalog = ${JSON.stringify(catalog, null, 2)};\n`);
console.log(`Imported ${catalog.counts.personas} Personas, ${catalog.counts.personaSkills} skills, ${catalog.counts.characters} characters, ${catalog.counts.weapons} weapons, ${catalog.counts.revelationMains} Revelation mains, and ${catalog.counts.revelationSets} Revelation sets.`);
