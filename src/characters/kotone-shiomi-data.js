/** Kotone Shiomi — LOCAL, EDITABLE integration, never written into synced catalogs.
 * Profile: ordinary Global, Sync Mindscape off, no Mindscape Core.
 * Values are Lufel's published v5.1.0 character data (skill.js, ritual.js,
 * weapon.js, review.js, base_stats.js), last effective English definitions.
 * They are tooltip data, not combat-event scripts: see docs/KOTONE-SOURCE-AUDIT.md
 * and docs/KOTONE-IMPLEMENTATION.md for the timing ambiguities that remain.
 */
export const KOTONE_SHIOMI_ID = 'kotone-shiomi';
export const KOTONE_PROFILE_ID = 'global-ordinary-lufel-5.1.0-2026-09-26';
const LUFEL_BASE = 'https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4';
export const kotoneSourceAudit = Object.freeze({
  retrievedOn: '2026-09-26', profileId: KOTONE_PROFILE_ID, lufelVersion: '5.1.0',
  requested: [
    'https://lufel.net/en/character/kotone/',
    ...['skill.js', 'ritual.js', 'weapon.js', 'review.js', 'base_stats.js'].map(file => `${LUFEL_BASE}/${file}?v=5.1.0`)
  ],
  completeLufelScriptsRetrieved: true,
  verification: 'Complete Lufel v5.1.0 scripts read through their final assignments; tooltip data, not combat-event verified',
  ordinaryOnly: true, syncMindscapeImplemented: false
});

// Ordinary skill Mindscape (the LV5 skill upgrade). Distinct from Sync Mindscape
// and from Mindscape Core, neither of which is implemented.
export const KOTONE_MINDSCAPE_LEVELS = Object.freeze([0, 5]);
export const KOTONE_DEFAULT_MINDSCAPE = 5;

// Published maxima, columns in page order: LV10, LV10 + Mindscape 5, LV13, LV13 + Mindscape 5.
// A3 raises Skill 1 to LV13; A5 raises Skills 2 and 3. The Highlight is not raised.
export const kotoneSkillTables = Object.freeze({
  attackCap: [4684, 5164, 4972, 5452],
  s1Crit: [.195, .215, .207, .227],
  powerfulAttack: [.39, .43, .414, .454],
  powerfulPierce: [.146, .161, .155, .17],
  powerfulFinal: [.049, .054, .052, .057],
  s2Hit: [.539, .594, .572, .627],
  s2DamageTaken: [.293, .323, .311, .341],
  s2FortuneAddedPower: [2.928, 3.228, 3.108, 3.408],
  s3Attack: [.293, .323, .311, .341],
  highlightCrit: [.195, .215, .207, .227],
  highlightAttack: [.244, .269, .259, .284]
});
const fixedCoefficients = Object.freeze({
  s2Hits: 3, s2MissingEnemyBonus: .25, s2FortuneDown: 2,
  s3Copy: .30, a2CopyMultiplier: 1.25,
  passiveAttack: .09, passivePierce: .12,
  lunarAttack: .50, lunarPierce: .15, lunarCrit: .50,
  a1Crit: .30, a4Damage: .25, strategistFinal: .01
});
const SKILL_TABLE_KEYS = Object.freeze({
  S1: ['s1Crit', 'powerfulAttack', 'powerfulPierce', 'powerfulFinal'],
  S2: ['s2Hit', 's2DamageTaken', 's2FortuneAddedPower'],
  S3: ['s3Attack'],
  HL: ['highlightCrit', 'highlightAttack']
});
export function kotoneSkillLevels(awareness = 0) {
  return { S1: awareness >= 3 ? 13 : 10, S2: awareness >= 5 ? 13 : 10, S3: awareness >= 5 ? 13 : 10, HL: 10 };
}
export function kotoneCoefficientsFor({ awareness = 0, mindscape = KOTONE_DEFAULT_MINDSCAPE } = {}) {
  if (!KOTONE_MINDSCAPE_LEVELS.includes(mindscape)) throw new RangeError('Kotone skill Mindscape must be 0 or 5');
  const levels = kotoneSkillLevels(awareness);
  const column = slot => (levels[slot] === 13 ? 2 : 0) + (mindscape === 5 ? 1 : 0);
  const coefficients = { ...fixedCoefficients, skillLevels: levels, mindscape, attackCaps: {} };
  for (const [slot, keys] of Object.entries(SKILL_TABLE_KEYS)) {
    for (const key of keys) coefficients[key] = kotoneSkillTables[key][column(slot)];
    coefficients.attackCaps[slot] = kotoneSkillTables.attackCap[column(slot)];
  }
  return Object.freeze(coefficients);
}
// Default table: A0 with the default skill Mindscape.
export const kotoneCoefficients = kotoneCoefficientsFor();

// Natural level-80 stats by awareness (base_stats.js), for reference in Builds.
export const kotoneLevel80BaseStats = Object.freeze([
  { maxHp: 3419.97, attack: 1080.02, defense: 633.37 },
  { maxHp: 3481.57, attack: 1099.22, defense: 644.57 },
  { maxHp: 3543.17, attack: 1119.22, defense: 656.57 },
  { maxHp: 3604.77, attack: 1138.42, defense: 667.77 },
  { maxHp: 3666.37, attack: 1157.62, defense: 678.97 },
  { maxHp: 3727.97, attack: 1177.62, defense: 690.17 },
  { maxHp: 3789.57, attack: 1196.82, defense: 702.17 }
]);

export const kotoneAwareness = Object.freeze([
  { level: 0, name: 'Moment of Truth', implemented: true, note: 'One link; Lunar Bond 0–10; one Go for Broke.' },
  { level: 1, name: 'Echoing Strings', implemented: true, note: 'Link starts at Lunar 5 with one permanent Powerful Bond; free own Highlight on Go for Broke; S1 at three Bonds gives 30% crit damage.' },
  { level: 2, name: 'Team Mom', implemented: true, note: 'Fortune skill/Highlight durations +1. Skill 3 copy ratio 30% x 1.25 = 37.5%.' },
  { level: 3, name: 'Full Moon Night', implemented: true, note: 'Skill 1 uses its published LV13 values. Combat Tactics has no published numerical upgrade.' },
  { level: 4, name: 'Eternal Bonds', implemented: true, note: 'Highlight also gives the party 25% damage for two turns, before Fortune extension.' },
  { level: 5, name: 'Unquenchable Flames', implemented: true, note: 'Skills 2 and 3 use their published LV13 values.' },
  { level: 6, name: 'Song of the Soul', implemented: true, note: 'Two Go for Broke uses. S3 also copies Wonder-origin buffs onto the linked ally when neither selected nor linked target is Wonder.' }
]);
const skill = (slot, name, cost, target, extra = {}) => ({
  id: `${KOTONE_SHIOMI_ID}-${slot.toLowerCase()}`, slot, name, cost, target,
  element: slot === 'S2' ? 'fire' : 'support', power: 0,
  kotoneSkill: slot, supportExecutable: true, ...extra
});
export const kotoneSkills = Object.freeze([
  skill('S1', "Lyre's Melody", 20, 'ally', { note: 'Stack crit damage and Powerful Bond on the Arcana Link ally. Attack-scaled; three-turn base duration.' }),
  skill('S2', "Burning Moon's Cry", 20, 'all_enemies', { power: .539, note: 'Three Fire hits. Stronger against fewer enemies. Fortune adds power and removes two Down points.' }),
  skill('S3', 'Lunar Phaseshift', 22, 'ally', { cooldown: 2, note: 'Party Attack; select the ORIGINAL BUFF CASTER. Copies their eligible buffs already on the linked ally. Two normal-turn cooldown.' })
]);
export const kotoneHighlight = skill('HL', 'Kotone Shiomi Highlight', 0, 'all_allies', {
  note: 'Party crit damage and linked ally Attack. A4 adds party damage.'
});
export const kotoneShiomi = Object.freeze({
  id: KOTONE_SHIOMI_ID, slug: 'kotone-shiomi', sourceSlug: 'kotone',
  name: 'Kotone Shiomi', codename: 'Kotone Shiomi', origin: 'Persona 3 Portable',
  role: 'Strategist', element: 'fire', rarity: 5, portrait: 'K', awareness: 0,
  // Editable DEMO build inputs, not a claim about her natural level-80 stats.
  maxHp: 3200, maxSp: 240, attack: 2500, defense: 300, speed: 100, crit: .05, critMult: 1.5,
  defaultStatsStatus: 'illustrative non-weapon build inputs; replace in Builds',
  maxAmmo: 8, gunPower: .55, actionLimit: 1,
  skills: kotoneSkills, highlightSkill: kotoneHighlight,
  artwork: '/assets/characters/kotone-shiomi.webp', avatar: '/assets/characters/kotone-shiomi-avatar.webp',
  accent: '#e75c69', status: 'playable-experimental-tooltip-profile', playable: true,
  ruleset: 'global-ordinary', profileId: KOTONE_PROFILE_ID, mindscapeCore: false,
  sourceUrl: kotoneSourceAudit.requested[0], awarenessLevels: kotoneAwareness,
  passives: [
    { name: 'Leading the team', note: 'Granting a buff gives the selected ally 9% Attack for three turns.' },
    { name: 'Sweeping strike', note: 'Granting Powerful Bond gives 12% pierce for two turns.' }
  ]
});
export const kotoneWeapons = Object.freeze([
  { id: 'none', name: 'No weapon', rarity: 0, supportedEnhancements: [0], component: { attack: 0, maxHp: 0, defense: 0 }, staticAttack: [0,0,0,0,0,0,0] },
  // weapon.js publishes one raw stat block per weapon, not per enhancement.
  { id: 'ame-no-nuboko', name: 'Ame-no-Nuboko', rarity: 4, supportedEnhancements: [0,1,2,3,4,5,6],
    component: { attack: 570.52, maxHp: 1807.87, defense: 334.73 },
    staticAttack: [.12,.12,.16,.16,.20,.20,.24], grantAttack: [.073,.096,.096,.119,.119,.142,.142],
    stackCap: 3, duration: 3 },
  { id: 'vetri-vel-muruga', name: 'Vetri Vel Muruga', rarity: 5, supportedEnhancements: [0,1,2,3,4,5,6],
    component: { attack: 713.51, maxHp: 2259.46, defense: 418.4 },
    staticAttack: [.30,.30,.39,.39,.48,.48,.57],
    skillAmplification: [.10,.13,.13,.16,.16,.19,.19],
    powerfulCrit: [.06,.078,.078,.096,.096,.114,.114], lunarThreshold: 5 }
]);
export function kotoneWeaponProfile(weaponId = 'none', enhancement = 0) {
  const weapon = kotoneWeapons.find(item => item.id === weaponId);
  if (!weapon) throw new Error(`Unknown Kotone weapon: ${weaponId}`);
  if (!Number.isInteger(enhancement) || enhancement < 0 || enhancement > 6) throw new RangeError('Enhancement must be +0–+6');
  if (!weapon.supportedEnhancements.includes(enhancement)) throw new Error(`${weapon.name} +${enhancement}: exact enhancement data has not been verified; choose +0`);
  return { id: weapon.id, enhancement, component: { ...weapon.component },
    staticAttack: weapon.staticAttack[enhancement], grantAttack: weapon.grantAttack?.[enhancement] || 0,
    skillAmplification: weapon.skillAmplification?.[enhancement] || 0, powerfulCrit: weapon.powerfulCrit?.[enhancement] || 0 };
}
export const missingKotoneSource = Object.freeze([
  'Lufel data is tooltip data: Fortune end, the automatic Highlight/Theurgy tick, copied-buff expiry and Sick/Cold turn consumption are engine policies, not source-verified timing.',
  'Copy eligibility is not enumerated by the source; provenance and duplicate handling are engine policies.',
  'Skill 2 Fortune additional damage is applied as added skill power; the source wording does not settle the damage term.',
  'Vetri Skill Amplification has published tiers and a trigger but no published formula.',
  'A3 Combat Tactics has no published numerical upgrade; weapon stats are one raw block per weapon, not per enhancement.',
  'Automatic Theurgy for legacy S.E.E.S. kits is not source-verified.'
]);
export function requireKotoneCombatData(ruleset = 'global-ordinary') {
  if (ruleset !== 'global-ordinary') throw new Error('Kotone supports ordinary Global only; Sync Mindscape and Mindscape Core are not implemented');
  return kotoneCoefficients;
}
