/** Kotone Shiomi — LOCAL, EDITABLE integration, never written into synced catalogs.
 * Profile: ordinary Global/JP tooltip snapshot, not Sync Mindscape.
 * Numerical transcription is provisional pending the complete live Lufel scripts.
 * See docs/KOTONE-IMPLEMENTATION.md for the intentionally exposed ambiguities.
 */
export const KOTONE_SHIOMI_ID = 'kotone-shiomi';
export const KOTONE_PROFILE_ID = 'global-ordinary-tooltip-2026-09-26';
export const kotoneSourceAudit = Object.freeze({
  retrievedOn: '2026-09-26', profileId: KOTONE_PROFILE_ID,
  requested: [
    'https://lufel.net/en/character/kotone/',
    ...['skill.js', 'ritual.js', 'weapon.js'].map(file => `https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/${file}`)
  ],
  completeLufelScriptsRetrieved: false,
  fallbackTooltip: 'https://gamewith.jp/p5x/566709',
  fallbackFiveStar: 'https://gamewith.jp/p5x/578642',
  verification: 'Secondary published tooltip transcription; NOT live-script-verified',
  ordinaryOnly: true, syncMindscapeImplemented: false
});
export const kotoneCoefficients = Object.freeze({
  attackCap: 4684,
  s1Crit: .195, powerfulAttack: .39, powerfulPierce: .146, powerfulFinal: .049,
  s2Hit: .539, s2Hits: 3, s2MissingEnemyBonus: .25, s2DamageTaken: .293,
  s2FortuneAddedPower: 2.928, s2FortuneDown: 2,
  s3Attack: .293, s3Copy: .30,
  highlightCrit: .195, highlightAttack: .244,
  passiveAttack: .09, passivePierce: .12,
  lunarAttack: .50, lunarPierce: .15, lunarCrit: .50,
  a1Crit: .30, a4Damage: .25, strategistFinal: .01
});
export const kotoneAwareness = Object.freeze([
  { level: 0, name: 'Arcana Link', implemented: true, note: 'One link; Lunar Bond 0–10; one Go for Broke.' },
  { level: 1, name: 'Fortune opening', implemented: true, note: 'Link starts at Lunar 5 with one permanent Powerful Bond; free own Highlight on Go for Broke; S1 at three Bonds gives 30% crit damage.' },
  { level: 2, name: 'Longer Fortune', implemented: true, note: 'Fortune skill/Highlight durations +1. Copy-ratio interpretation is an explicit build setting.' },
  { level: 3, name: 'S1 / Highlight skill-level increase', implemented: false, note: 'Level-specific upgraded coefficient tables not retrieved. This profile freezes the displayed tooltip values.' },
  { level: 4, name: 'Highlight damage support', implemented: true, note: 'Highlight also gives the party 25% damage for two turns, before Fortune extension.' },
  { level: 5, name: 'S2 / S3 skill-level increase', implemented: false, note: 'Level-specific upgraded coefficient tables not retrieved. This profile freezes the displayed tooltip values.' },
  { level: 6, name: 'Wonder as additional SOURCE', implemented: true, note: 'Two Go for Broke uses. S3 also copies Wonder-origin buffs onto the linked ally when neither selected nor linked target is Wonder.' }
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
  { id: 'ame-no-nuboko', name: 'Ame-no-Nuboko', rarity: 4, supportedEnhancements: [0],
    component: { attack: 570, maxHp: 1807, defense: 334 },
    staticAttack: [.12,null,null,null,null,null,null], grantAttack: [.073,null,null,null,null,null,null],
    stackCap: 3, duration: 3,
    note: '+0 only. +1–+6 are deliberately unavailable until their exact arrays are retrieved.' },
  { id: 'vetri-vel-muruga', name: 'Vetri Vel Muruga', rarity: 5, supportedEnhancements: [0,1,2,3,4,5,6],
    component: { attack: 713, maxHp: 2259, defense: 418 },
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
  'Complete live Lufel scripts and trailing overrides have not been retrieved.',
  'A3/A5 skill-level coefficients are not available; the displayed tooltip snapshot is held fixed.',
  'Ame-no-Nuboko +1–+6 are unavailable, not interpolated.',
  'A2 copy ratio, Fortune S2 coefficient interpretation, stack refresh and turn clocks remain explicit provisional policies.',
  'Natural level-80 base stats and automatic Theurgy for legacy S.E.E.S. kits are not source-verified.'
]);
export function requireKotoneCombatData(ruleset = 'global-ordinary') {
  if (ruleset !== 'global-ordinary') throw new Error('Kotone supports ordinary Global only; Sync Mindscape and Mindscape Core are not implemented');
  return kotoneCoefficients;
}
