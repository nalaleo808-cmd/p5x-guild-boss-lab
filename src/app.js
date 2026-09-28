import { applyCurrentSkillNames, withPersonaRecommendations } from './persona-recommendations.js';
import { withPersonaAdditions } from './persona-additions.js';
import { withRevelationMainOverlay, withRevelationSetOverlay } from './revelation-overlay.js';
import { AWARENESS_LEVELS, awarenessCoverage, awarenessStatDefaults, migrateAwarenessLoadout, resolveAwareness, setLoadoutAwareness } from './awareness.js';
import { COSMIC_YUI_AWARENESS, COSMIC_YUI_COEFFICIENTS, COSMIC_YUI_LIMITATIONS, COSMIC_YUI_WEAPONS } from './cosmic-yui-data.js';
import { renderKotonePreview } from './kotone-preview.js';
import { kotoneShiomi, KOTONE_SHIOMI_ID, kotoneLevel80BaseStats, kotoneWeaponProfile } from './characters/kotone-shiomi-data.js';
import { withLocalCharacters } from './characters/kotone-overlay.js';
import { normalizeKotoneLoadout, normalizeKotoneDraft } from './characters/kotone-shiomi-mechanics.js';
import { kotoneBuildEditor, bindKotoneBuild, kotoneStatusMarkup, kotoneSkillSummary } from './characters/kotone-shiomi-ui.js';
import { BattleEngine, calculateNightmareScore, simulate } from './engine.js';
import { adaptRegisteredCharacter, characterModuleFor } from './characters/registry.js';
import { bosses, elementMeta, navigator as baseNavigator, nightmareModes, recordedNightmareBenchmark, roster as baseRoster } from './data.js';
import { lufelCatalog } from './generated/lufel-catalog.js';
import { applyRecordedDefaultStats, ichigoStatsPreset, berrySpPreset, marianRevelationPreset, marianSpPreset, wonderWeaponPreset, liveStatsPresetFields, wonderStatsPreset } from './default-presets.js';
import {
  getDefaultWonderWeaponProfileId,
  getWonderWeaponDefinition,
  getWonderWeaponProfile,
  listWonderWeaponDefinitions
} from './wonder-weapons.js';
import {
  HachimanRecordedEngine, HACHIMAN_RECORDED_SEED, NAVIGATOR_SHARED_STATS, OBSERVED_STAT_EVIDENCE, PERSONA_SKILL_ADAPTERS,
  adaptPersonaSkill, createHachimanRecordedConfig, hachimanScoreDerivation, playHachimanRecordedRoute
} from './hachiman-recorded-team.js';
import {
  PERSONA_EQUIP_SLOT_COUNT,
  battleSkillsForPersona,
  buildPersonaLoadoutCatalog,
  defaultPersonaSkillIds,
  fixedPersonaSkills,
  highestRankPersonaPassive,
  legalTransferableSkillsForPersona,
  sanitizePersonaSkillIds,
  staticPassiveEffectsFromSkill
} from './persona-loadout.js';

const root = document.querySelector('#app');
const roster = baseRoster.map(adaptRegisteredCharacter);
const navigator = adaptRegisteredCharacter(baseNavigator);
const format = value => Math.round(value).toLocaleString();
const pct = (value, max) => Math.max(0, Math.min(100, (value / max) * 100));
const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
const jcMaskShort = Object.freeze({ mischief: 'MISCHIEF', service: 'SERVICE', absurdity: 'ABSURDITY', luck: 'LUCK' });
const medicineDisplayNames = Object.freeze({ attack_tablet: 'Attacker Tablet' });
const substantialKitSlugs = new Set(['berry', 'puppet-wavecatcher', 'marian-beachflower', 'miku', 'j-c', 'rin-firecracker', 'matoi', 'akihiko', 'yukari', 'makoto', 'bui-cosmic']);
const wonderWeaponDefinitions = listWonderWeaponDefinitions();

function wonderWeaponOptions(selectedWeaponId) {
  return [
    `<option value="" ${!selectedWeaponId ? 'selected' : ''}>None equipped</option>`,
    ...wonderWeaponDefinitions.map(weapon => `<option value="${escapeHtml(weapon.id)}" ${weapon.id === selectedWeaponId ? 'selected' : ''}>${'★'.repeat(weapon.rarity)} ${escapeHtml(weapon.name)}</option>`)
  ].join('');
}

function setWonderWeaponSelection(loadout, weaponId) {
  loadout.weaponId = weaponId || null;
  loadout.weaponProfileId = weaponId ? getDefaultWonderWeaponProfileId(weaponId) : null;
  loadout.weaponProcGranularity = null;
  loadout.weaponPresetId = wonderWeaponPreset.id;
}

function actionCooldown(action) {
  return Math.max(0, Number(action?.cooldownRemaining ?? action?.remaining ?? action?.cooldown ?? 0) || 0);
}

function jcMaskCooldown(unit, mask) {
  const clocks = unit?.highlightCooldowns || unit?.maskHighlightCooldowns || unit?.selectedMaskHighlightCooldowns || {};
  const value = clocks?.[mask] ?? clocks?.[String(mask).toUpperCase()] ?? clocks?.[String(mask).toLowerCase()];
  return Math.max(0, Number(value) || 0);
}

function medicineName(action) {
  return medicineDisplayNames[action?.id] || action?.name || 'Medicine';
}

function medicineBaseText(action) {
  if (action?.baseValue != null && action?.baseDuration != null) {
    const value = Number(action.baseValue);
    const amount = Number.isFinite(value) && Math.abs(value) < 1 ? `${(value * 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%` : String(action.baseValue);
    return `${amount} for ${action.baseDuration} turn${Number(action.baseDuration) === 1 ? '' : 's'}`;
  }
  return action?.baseNote || action?.baseEffectText || action?.note || 'Base effect shown before Marian modifiers.';
}

function medicineEffectiveText(action) {
  if (action?.effectiveValue != null && action?.effectiveDuration != null) {
    const value = Number(action.effectiveValue);
    const amount = Number.isFinite(value) && Math.abs(value) < 1 ? `${(value * 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%` : String(action.effectiveValue);
    return `${amount} for ${action.effectiveDuration} turns. The observed 1.58 multiplier's source is unresolved.`;
  }
  return action?.effectiveNote || action?.effectiveEffectText || 'Applied value and duration appear in Active effects after use.';
}

function coverageFor(unit) {
  if (unit?.id === KOTONE_SHIOMI_ID) return { kind: 'partial', label: 'PLAYABLE · EXPERIMENTAL', detail: 'Lufel v5.1.0 ordinary Global values with A3/A5 skill levels and skill Mindscape. Fortune, copy and Cold timing are engine policies, not source-verified.' };
  const research = characterModuleFor(unit)?.research;
  if (research && unit.slug !== 'bui-cosmic') return {
    kind: 'partial', label: 'RESEARCHED · PARTIAL MECHANICS',
    detail: `${research.name || unit.codename}: ${(research.implemented || []).join('; ') || 'Source and implementation audit available'}. ${(research.missing || []).length} documented gaps.`
  };
  if (!unit?.id?.startsWith('lufel-recent-')) return null;
  if (unit.slug === 'bui-cosmic') return { kind: 'substantial', label: 'SOURCE-MODELED · COSMIC', detail: 'Dedicated Veggie Knight, energy, Harvest Havoc and All-Out damage logic. Current Lufel coefficients; unverified timing and extra party All-Out scaling are disclosed, not claimed as live-calibrated.' };
  return substantialKitSlugs.has(unit.slug)
    ? { kind: 'partial', label: 'CORE MECHANICS PARTIAL', detail: 'This character has a substantial tested state machine, but the full source kit is not implemented.' }
    : { kind: 'generic', label: 'GENERIC DIRECT EFFECTS ONLY', detail: 'Direct coefficients and simple effects run. The source kit is not fully implemented.' };
}

// Collapsed by default during battle, open on results. The battle screen re-renders
// after every action, so the open state is remembered per location.
const limitationsOpen = { battle: false, results: true };
function limitationsMarkup(source, location = 'battle') {
  const limitations = Array.isArray(source?.mechanicsLimitations) ? source.mechanicsLimitations.filter(Boolean) : [];
  if (!limitations.length) return '';
  const open = limitationsOpen[location] ?? false;
  return `<details class="mechanics-limitations ${location}" data-limitations="${location}" ${open ? 'open' : ''}><summary><b>SIMULATION LIMITATIONS · ${limitations.length}</b><small>These mechanics are not represented in this run. ${open ? 'Hide' : 'Show'}</small></summary><ul>${limitations.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></details>`;
}
function bindLimitationsToggle() {
  document.querySelectorAll('[data-limitations]').forEach(panel => panel.addEventListener('toggle', () => {
    limitationsOpen[panel.dataset.limitations] = panel.open;
    const hint = panel.querySelector('summary small');
    if (hint) hint.textContent = `These mechanics are not represented in this run. ${panel.open ? 'Hide' : 'Show'}`;
  }));
}
// Restore the existing recorded-team Persona to the picker. The source importer
// labels its raw text reference-only, but this UI already supplies these exact
// observed values in personaDefinitionsFromLoadout below. No new coefficients.
const importedPersonaBase = withPersonaAdditions(lufelCatalog.personas).map(persona => persona.id !== 'lufel-persona-267' ? persona : {
  ...persona,
  skills: persona.skills.map(skill => skill.id !== 'persona-267-unique-chilling-depth-1' ? skill : {
    ...skill, cost: 22,
    combat: { ...skill.combat, executable: true, confidence: 'existing-recorded-ui-adapter', power: 1.1,
      debuff: { id: 'ice_vuln', name: 'ICE DAMAGE TAKEN', value: 0.088, duration: 2 } }
  })
}).filter(persona => persona.skills.some(skill => skill.kind === 'unique' && (skill.combat.executable || PERSONA_SKILL_ADAPTERS[skill.name])));
const revelationMains = withRevelationMainOverlay(lufelCatalog.revelationMains);
const revelationSets = withRevelationSetOverlay(lufelCatalog.revelationSets);
const importedWeapons = lufelCatalog.weapons || [];
const recordedMaziodyne = {
  id: 'recorded-maziodyne', name: 'Maziodyne', sourceName: 'Maziodyne', kind: 'recorded',
  description: 'Deal Electric damage to all foes equal to 66.9% of Attack.',
  cost: 21, target: 'all_enemies', element: 'electric',
  combat: { executable: true, confidence: 'recorded', power: 0.669 }
};
const hasExecutableMaziodyne = (lufelCatalog.personaSkills || []).some(skill => skill.name === 'Maziodyne' && skill.combat?.executable);
const personaLoadoutCatalog = buildPersonaLoadoutCatalog(lufelCatalog, hasExecutableMaziodyne ? [] : [recordedMaziodyne]);
const transferablePersonaSkills = personaLoadoutCatalog.transferableSkills;
applyCurrentSkillNames([...new Set([...transferablePersonaSkills, ...personaLoadoutCatalog.skillById.values()])]);
const importedPersonas = withPersonaRecommendations(importedPersonaBase, transferablePersonaSkills);
const skillById = personaLoadoutCatalog.skillById;
transferablePersonaSkills.sort((a, b) => a.name.localeCompare(b.name));

const roleStats = {
  Sweeper: [860, 175, 238, .14], Assassin: [835, 170, 252, .2], Support: [900, 205, 196, .12],
  Saboteur: [890, 195, 205, .13], Medic: [920, 215, 188, .1], Guardian: [1020, 175, 195, .11],
  Strategist: [875, 205, 202, .12], Elucidator: [890, 220, 190, .1], Virtuoso: [880, 210, 215, .14],
  Vanguard: [930, 180, 220, .14]
};

const characterArtworkOverrides = Object.freeze({
  'lufel-recent-marian-beachflower': '/assets/characters/marian-beachflower-goofy.png',
  'lufel-recent-puppet-wavecatcher': '/assets/characters/puppet-wavecatcher-goofy.png',
  'lufel-recent-j-c': '/assets/characters/j-c-goofy.png'
});

function importedCharacterDefinition(record) {
  record = adaptRegisteredCharacter(record);
  if (record.formulaStatus === 'source-described' && record.skills?.length) {
    return {
      ...record, actionLimit: 1, maxAmmo: record.maxAmmo || 8, gunPower: record.gunPower || .56,
      portrait: (record.codename || record.name || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 1).toUpperCase() || '?',
      skills: record.skills.map(skill => ({ ...skill }))
    };
  }
  const [maxHp, maxSp, attack, crit] = roleStats[record.role] || roleStats.Vanguard;
  const offenseElement = record.element === 'support' ? 'almighty' : record.element;
  const id = record.id;
  const utility = record.role === 'Medic'
    ? { id: `${id}-aid`, slot: 'S2', name: 'Recovery', element: 'support', cost: 24, power: 0, heal: .4, target: 'ally', note: 'Estimated recovery action.' }
    : record.role === 'Saboteur'
      ? { id: `${id}-break`, slot: 'S2', name: 'Defense Break', element: 'support', cost: 20, power: 0, target: 'boss', debuff: { id: 'def_down', name: 'DEF ↓', value: .25, duration: 2 }, note: 'Estimated debuff action.' }
      : record.role === 'Guardian'
        ? { id: `${id}-guard`, slot: 'S2', name: 'Fortify', element: 'support', cost: 18, power: 0, target: 'party', buff: { id: `${id}-fortify`, name: 'FORTIFY', value: .15, duration: 2 }, note: 'Estimated party support action.' }
        : { id: `${id}-amp`, slot: 'S2', name: 'Team Drive', element: 'support', cost: 20, power: 0, target: 'party', buff: { id: `${id}-drive`, name: 'DMG ↑', value: .18, duration: 2 }, note: 'Estimated party support action.' };
  return {
    ...record, maxHp, maxSp, attack, crit, actionLimit: 1, maxAmmo: 8, gunPower: .56,
    portrait: (record.codename || record.name || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 1).toUpperCase() || '?',
    skills: [
      { id: `${id}-strike`, slot: 'S1', name: `${elementMeta[offenseElement]?.label || 'ARCANE'} Strike`, element: offenseElement, cost: 18, power: record.role === 'Sweeper' ? 1.35 : 1.55, target: record.role === 'Sweeper' ? 'all_enemies' : 'boss', note: 'Estimated executable kit derived from imported role and element.' },
      utility,
      { id: `${id}-finisher`, slot: 'S3', name: `${record.persona || record.codename} Finisher`, element: offenseElement, cost: 27, power: 2.05, target: 'boss', critBonus: record.role === 'Assassin' ? .2 : 0, note: 'Estimated simulator finisher.' }
    ]
  };
}

const fixedIdentityKeys = new Set(roster.slice(1).flatMap(unit => [unit.codename, unit.name]).map(value => value.toUpperCase()));
const importedCharacters = (lufelCatalog.characters || [])
  .map(record => importedCharacterDefinition({ ...record, artwork: characterArtworkOverrides[record.id] || record.artwork }))
  .filter(unit => !fixedIdentityKeys.has(unit.codename.toUpperCase()) && !fixedIdentityKeys.has(unit.name.toUpperCase()));
const navigatorCharacterIds = new Set(['lufel-recent-ange', 'lufel-recent-miku']);

function importedNavigatorDefinition(unit) {
  return {
    ...unit, id: `navigator-${unit.slug}`, sourceCharacterId: unit.id,
    skills: unit.skills.map((skill, index) => ({
      ...skill, id: `navigator-${unit.slug}-${index + 1}`, power: 0,
      cooldown: skill.cooldown || 4, note: skill.description || skill.note || 'Navigator interrupt action.'
    }))
  };
}

const navigatorCandidates = [
  navigator,
  ...['ANGE', 'MIKU'].map(codename => importedCharacters.find(unit => unit.codename === codename)).filter(Boolean).map(importedNavigatorDefinition)
];
const selectableCharacters = withLocalCharacters([...roster, ...importedCharacters.filter(unit => !navigatorCharacterIds.has(unit.id))]);
// Every existing combatant and navigator is editable, including off-party units.
const buildableCharacters = [...selectableCharacters, ...navigatorCandidates];
const isNavigatorBuild = unit => navigatorCandidates.some(candidate => candidate.id === unit.id);


function loadNavigatorId() {
  const saved = localStorage.getItem('p5x-navigator-v1');
  return navigatorCandidates.some(unit => unit.id === saved) ? saved : navigator.id;
}

function selectedNavigator() {
  return navigatorCandidates.find(unit => unit.id === ui.navigatorId) || navigatorCandidates[0];
}

function saveNavigatorId() {
  localStorage.setItem('p5x-navigator-v1', ui.navigatorId);
  clearHachimanRecordedPreset();
  ui.engine = null;
}

function loadModeOptions() {
  const defaults = { devourer: { lifeSustainment: false } };
  try {
    const saved = JSON.parse(localStorage.getItem('p5x-mode-options-v1'));
    return {
      devourer: {
        lifeSustainment: saved?.devourer?.lifeSustainment === true
      }
    };
  } catch {
    return defaults;
  }
}

function saveModeOptions(invalidateEngine = true) {
  localStorage.setItem('p5x-mode-options-v1', JSON.stringify(ui.modeOptions));
  if (invalidateEngine) ui.engine = null;
}

function executableSkills(persona) {
  return persona?.skills.filter(skill => skill.combat.executable) || [];
}

// A Persona slot with skills named as they appear in game; Warrior's Unity
// resolves to the catalog's Spirit Harmony.
function presetPersonaSlot(name, skillNames = []) {
  const slot = defaultPersonaSlot(name);
  const persona = importedPersonas.find(item => item.name === name);
  if (!persona || !skillNames?.length) return slot;
  const aliases = { "Warrior's Unity": 'Spirit Harmony' };
  const ids = skillNames.map(skillName => {
    const target = aliases[skillName] || skillName;
    return transferablePersonaSkills.find(skill => skill.name === target || skill.sourceName === target)?.id || '';
  });
  return { ...slot, skillIds: sanitizePersonaSkillIds(persona, ids, transferablePersonaSkills) };
}

function defaultPersonaSlot(name) {
  const persona = importedPersonas.find(item => item.name === name) || importedPersonas[0];
  return { personaId: persona.id, skillIds: defaultPersonaSkillIds(persona, transferablePersonaSkills) };
}

function defaultBuildContentsFor(characterId) {
  if (characterId === KOTONE_SHIOMI_ID) return applyRecordedDefaultStats(characterId, { ...normalizeKotoneDraft(), revelationMain: 'Trust', revelationSet: 'Prosperity', baseStats: { attack: 2500, maxHp: 3200, defense: 300, maxSp: 240 } });
  if (characterId === 'wonder') return applyRecordedDefaultStats(characterId, { personas: wonderStatsPreset.personaNames.map(name => presetPersonaSlot(name, wonderStatsPreset.personaSkills?.[name])), personaPresetId: wonderStatsPreset.id });
  if (characterId === 'joker') return { revelationMain: 'Nativity', revelationSet: 'Power' };
  if (characterId === 'rin') return { revelationMain: 'Resolve', revelationSet: 'Virtue' };
  if (characterId === 'mona') return { revelationMain: 'Faith', revelationSet: 'Peace' };
  const character = buildableCharacters.find(unit => unit.id === characterId);
  const preferredMain = character?.recommendedRevelations?.main?.find(name => revelationMains.some(main => main.name === name));
  const main = revelationMains.find(item => item.name === preferredMain) || revelationMains[0];
  const preferredSet = character?.recommendedRevelations?.sets?.find(name => revelationSets.some(set => set.name === name));
  return applyRecordedDefaultStats(characterId, { revelationMain: main?.name || '', revelationSet: preferredSet || main?.compatibleSubs?.[0] || revelationSets[0]?.name || '', ...(character?.slug === 'j-c' ? { jcMasks: ['mischief', 'absurdity'] } : {}) });
}

// Character level-80 base plus weapon component stats. Attack % buffs scale
// this in battle (live Miyu 2026-09-27). Only for equipped totals where the
// weapon is known; otherwise the engine keeps its older whole-stat model.
function statScalingBase(unit, loadout = {}) {
  if (loadout.statsMode !== 'equipped') return null;
  const awareness = resolveAwareness(unit, loadout);
  if (unit.id === KOTONE_SHIOMI_ID) {
    const natural = kotoneLevel80BaseStats[awareness];
    let weapon;
    try { weapon = kotoneWeaponProfile(loadout.weaponId || 'none', loadout.enhancement || 0).component; } catch { return null; }
    if (!natural || !loadout.weaponId || loadout.weaponId === 'none') return null;
    return { attack: natural.attack + weapon.attack, maxHp: natural.maxHp + weapon.maxHp, defense: natural.defense + weapon.defense };
  }
  const source = unit.sourceStats?.[`a${awareness}_lv80`];
  const weaponKind = loadout.characterResearch?.weapon;
  if (!source || !weaponKind || weaponKind === 'none') return null;
  const weapon = importedWeapons.find(item => item.characterSlug === unit.slug && item.category === weaponKind && item.sourceKey.endsWith('-1'));
  if (!weapon?.stats) return null;
  return {
    attack: Number(source.attack) + Number(weapon.stats.attack || 0),
    maxHp: Number(source.HP ?? source.maxHp) + Number(weapon.stats.maxHp || 0),
    defense: Number(source.defense) + Number(weapon.stats.defense || 0)
  };
}

function defaultLoadoutFor(characterId) {
  const unit = buildableCharacters.find(item => item.id === characterId) || { id: characterId };
  const contents = isNavigatorBuild(unit) ? (liveStatsPresetFields(characterId, {}) || {}) : defaultBuildContentsFor(characterId);
  return { ...contents, awareness: resolveAwareness(unit, contents) };
}

function defaultLoadouts() {
  return Object.fromEntries(buildableCharacters.map(unit => [unit.id, defaultLoadoutFor(unit.id)]));
}

const HACHIMAN_RECORDED_FLAG_KEY = 'p5x-hachiman-recorded-v1';

function hachimanRecordedFlagSaved() {
  try { return localStorage.getItem(HACHIMAN_RECORDED_FLAG_KEY) === '1'; } catch { return false; }
}

function clearHachimanRecordedPreset() {
  if (!ui.hachimanRecordedPreset) return;
  ui.hachimanRecordedPreset = false;
  ui.hachimanRouteOutcome = null;
  try { localStorage.removeItem(HACHIMAN_RECORDED_FLAG_KEY); } catch { /* ignore */ }
}

// Loads the recorded Multidimensional Dreamscape Hachiman party exactly as the
// checkpoint comparison runs it: observed maximum HP totals, sourced-cap lower
// bounds, the Labor and Reconcilation set effects, and the reference-only
// Persona skills bridged from their tooltips. See HACHIMAN-STAT-EVIDENCE-2026-09-06.md.
function loadHachimanRecordedPreset() {
  stopAuto();
  const { config, dionysus, vasuki, janosik } = createHachimanRecordedConfig(HACHIMAN_RECORDED_SEED);
  ui.selectedBoss = config.bossId;
  ui.selectedMode = config.modeId;
  ui.seed = HACHIMAN_RECORDED_SEED;
  ui.teamIds = [...config.teamIds];
  ui.loadouts.wonder = {
    ...structuredClone(config.loadouts.wonder),
    personas: [dionysus, vasuki, janosik].map(entry => {
      const persona = importedPersonas.find(item => item.id === entry.definition.id);
      return { personaId: entry.definition.id, skillIds: sanitizePersonaSkillIds(persona, entry.equippedSkillIds, transferablePersonaSkills) };
    })
  };
  for (const id of ui.teamIds.filter(id => id !== 'wonder')) ui.loadouts[id] = structuredClone(config.loadouts[id]);
  ui.navigatorId = 'navigator-miku';
  // These recorded presets represent A6 builds, not the last edited ranks.
  for (const id of [...ui.teamIds, ui.navigatorId]) {
    const member = buildableCharacters.find(unit => unit.id === id);
    if (member) setLoadoutAwareness(member, ensureLoadout(id), 6);
  }
  localStorage.setItem('p5x-navigator-v1', ui.navigatorId);
  saveLoadouts();
  saveTeamIds();
  ui.hachimanRecordedPreset = true;
  ui.hachimanRouteOutcome = null;
  try { localStorage.setItem(HACHIMAN_RECORDED_FLAG_KEY, '1'); } catch { /* ignore */ }
  ui.engine = null;
  render();
}

function replayHachimanRecordedRoute() {
  stopAuto();
  const engine = new HachimanRecordedEngine(createHachimanRecordedConfig(ui.seed).config);
  const outcome = playHachimanRecordedRoute(engine);
  ui.engine = engine;
  ui.hachimanRouteOutcome = { completed: outcome.completed, resolved: outcome.resolved.length, turn: outcome.turn, failedLabel: outcome.failedLabel, error: outcome.error?.message || null };
  ui.commandTab = 'moves';
  ui.pendingAction = null;
  ui.replayIndex = 0;
  ui.screen = engine.state.phase === 'results' ? 'results' : 'battle';
  render();
  requestAnimationFrame(() => window.scrollTo(0, 0));
}

function hachimanPresetNoteMarkup() {
  if (!ui.hachimanRecordedPreset) return '';
  const rows = [];
  for (const [slug, label] of [['j-c', 'J&C'], ['wonder', 'Wonder'], ['marian-beachflower', 'Marian'], ['berry', 'Berry']]) {
    for (const [key, entry] of Object.entries(OBSERVED_STAT_EVIDENCE[slug])) {
      if (typeof entry !== 'object' || entry.value == null) continue;
      rows.push(`${label} ${key} ${format(entry.value)} (${entry.kind.replace('_', ' ')})`);
    }
  }
  return `<section class="score-evidence provisional"><b>HACHIMAN RECORDED TEAM · SEED ${HACHIMAN_RECORDED_SEED}</b>
    <p>Party order J&C, Wonder, Marian, Berry with MIKU. Observed maximum HP and sourced-cap lower bounds replace catalog defaults: ${escapeHtml(rows.join(' · '))}.</p>
    <small>MIKU Labor 4-set party ATK/DEF +8% and J&C Reconcilation 4-set ATK/DEF +15% are applied. Rakunda, Auto-Mataru IV and Tarukaja scaling are bridged from their tooltips. MIKU shares +${format(NAVIGATOR_SHARED_STATS.partyBonus.attack)} ATK, +${NAVIGATOR_SHARED_STATS.partyBonus.critRate}% crit rate, +${NAVIGATOR_SHARED_STATS.partyBonus.critMult}% crit mult, +${NAVIGATOR_SHARED_STATS.partyBonus.damageBonus}% damage and +${NAVIGATOR_SHARED_STATS.partyBonus.pierceRate}% pierce with the party. ${escapeHtml(OBSERVED_STAT_EVIDENCE.berry.reconciled)}</small></section>`;
}

function hachimanDerivationMarkup(state) {
  if (!state.scoreBreakdown?.turnScoreBuckets?.length) return '';
  const derivation = hachimanScoreDerivation(state);
  const rows = derivation.buckets.map(bucket => `<tr><td>Turn ${bucket.normalTurn}${bucket.normalTurn === 5 ? ' + Concert' : ''}</td><td>${format(Math.round(bucket.rawDamage))}</td><td>x${bucket.multiplier}</td><td>${format(Math.round(bucket.weightedPoints))}</td></tr>`).join('');
  const outcome = ui.hachimanRouteOutcome;
  const routeNote = outcome ? (outcome.completed
    ? `The recorded T1 to T8 route resolved all ${outcome.resolved} actions.`
    : `The recorded route stopped at ${escapeHtml(outcome.failedLabel || outcome.turn)}: ${escapeHtml(outcome.error || 'illegal action')}.`) : 'Manual battle. Points follow the same turn weights as the recorded comparison.';
  return `<section class="score-evidence provisional hachiman-derivation"><b>HOW THE PROJECTED SCORE IS BUILT</b>
    <p>${escapeHtml(routeNote)}</p>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:9px;font-weight:800">
      <thead><tr><th style="text-align:left">Normal turn</th><th style="text-align:right">Score-eligible damage</th><th style="text-align:right">Weight</th><th style="text-align:right">Weighted points</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td>Foe Defense Points (rounded once)</td><td></td><td></td><td style="text-align:right">${format(derivation.foeDefensePoints)}</td></tr>
        <tr><td>+ Turns Survived Bonus (observed on this route)</td><td></td><td></td><td style="text-align:right">${format(derivation.survivalBonus)}</td></tr>
        <tr><td>x Difficulty</td><td></td><td></td><td style="text-align:right">x${derivation.difficultyBonus}</td></tr>
        <tr><td><strong>Projected score</strong></td><td></td><td></td><td style="text-align:right"><strong>${format(derivation.projectedFinalScore)}</strong></td></tr>
        <tr><td>Recorded result</td><td></td><td></td><td style="text-align:right">${format(derivation.recordedFinalScore)}</td></tr>
      </tfoot>
    </table></div>
    <small>${escapeHtml(derivation.survivalBonusNote)} ${escapeHtml(derivation.limitation)} Damage on Daisoujou idols is excluded from points. Virtual Concert damage keeps the weight of the normal turn it interrupts.</small></section>`;
}

function loadRecordedBenchmarkPreset() {
  const sahimochi = importedPersonas.find(persona => persona.name === 'Sahimochi-no-kami');
  const oneFathom = sahimochi?.skills.find(skill => skill.name === 'Chilling Depth');
  const maziodyne = transferablePersonaSkills.find(skill => skill.name === 'Maziodyne');
  const revolution = transferablePersonaSkills.find(skill => skill.name === 'Revolution');
  if (!sahimochi || !oneFathom || !maziodyne || !revolution) {
    throw new Error('The recorded Wonder loadout could not be resolved from the local catalog.');
  }
  ui.teamIds = ['wonder', 'lufel-recent-marian-beachflower', 'lufel-recent-puppet-wavecatcher', 'lufel-recent-j-c'];
  ui.loadouts.wonder = {
    baseStats: {},
    personas: [
      { personaId: sahimochi.id, skillIds: sanitizePersonaSkillIds(sahimochi, [maziodyne.id, revolution.id], transferablePersonaSkills) },
      defaultPersonaSlot('Alice'),
      defaultPersonaSlot('Trumpeter')
    ]
  };
  for (const id of ui.teamIds.slice(1)) ui.loadouts[id] = { baseStats: {}, revelationMain: '', revelationSet: '', ...(id === 'lufel-recent-j-c' ? { jcMasks: ['mischief', 'service'] } : {}) };
  ui.navigatorId = 'navigator-miku';
  // These recorded presets represent A6 builds, not the last edited ranks.
  for (const id of [...ui.teamIds, ui.navigatorId]) {
    const member = buildableCharacters.find(unit => unit.id === id);
    if (member) setLoadoutAwareness(member, ensureLoadout(id), 6);
  }
  localStorage.setItem('p5x-navigator-v1', ui.navigatorId);
  saveLoadouts();
  saveTeamIds();
  ui.engine = null;
  render();
}

function loadLoadouts() {
  const defaults = defaultLoadouts();
  try {
    const saved = JSON.parse(localStorage.getItem('p5x-loadouts-v3'));
    if (!saved || typeof saved !== 'object') return defaults;
    const merged = { ...saved };
    for (const unit of buildableCharacters) {
      const id = unit.id;
      const prior = saved[id] || (unit.sourceCharacterId && saved[unit.sourceCharacterId]) || {};
      merged[id] = migrateAwarenessLoadout(unit, defaults[id], prior, applyRecordedDefaultStats(id, prior));
      // Live screenshot presets replace saved stats and awareness once.
      const live = liveStatsPresetFields(id, prior);
      if (live) merged[id] = { ...merged[id], ...live };
    }
    if (!Array.isArray(merged.wonder.personas) || merged.wonder.personas.length !== 3) merged.wonder.personas = defaults.wonder.personas;
    // Apply the live Persona trio once; later deliberate changes survive.
    if (saved.wonder?.personaPresetId !== wonderStatsPreset.id) {
      merged.wonder.personas = defaults.wonder.personas;
      merged.wonder.personaPresetId = wonderStatsPreset.id;
    }
    merged.wonder.personas = merged.wonder.personas.map((slot, index) => {
      const personaId = importedPersonas.some(persona => persona.id === slot?.personaId) ? slot.personaId : defaults.wonder.personas[index].personaId;
      const persona = importedPersonas.find(item => item.id === personaId);
      const rawSkillIds = Array.isArray(slot?.skillIds) ? slot.skillIds : defaults.wonder.personas[index].skillIds;
      return { ...defaults.wonder.personas[index], ...slot, personaId, skillIds: sanitizePersonaSkillIds(persona, rawSkillIds, transferablePersonaSkills) };
    });
    delete merged.wonder.revelationMain;
    delete merged.wonder.revelationSet;
    if (saved[ichigoStatsPreset.characterId]?.statsPresetId !== ichigoStatsPreset.id
      || saved[berrySpPreset.characterId]?.spPresetId !== berrySpPreset.id
      || saved[marianRevelationPreset.characterId]?.revelationPresetId !== marianRevelationPreset.id
      || saved[marianSpPreset.characterId]?.spPresetId !== marianSpPreset.id
      || saved.wonder?.weaponPresetId !== wonderWeaponPreset.id) {
      localStorage.setItem('p5x-loadouts-v3', JSON.stringify(merged));
    }
    localStorage.setItem('p5x-loadouts-v3', JSON.stringify(merged));
    return merged;
  } catch { return defaults; }
}

function loadTeamIds() {
  const fallback = ['wonder', 'lufel-recent-blitz', 'lufel-recent-berry', 'lufel-recent-puppet-wavecatcher'];
  try {
    const saved = JSON.parse(localStorage.getItem('p5x-team-v2'));
    if (!Array.isArray(saved) || saved.length !== 4 || !saved.includes('wonder') || new Set(saved).size !== 4) return fallback;
    if (!saved.every(id => selectableCharacters.some(unit => unit.id === id))) return fallback;
    return saved;
  } catch { return fallback; }
}

function selectedTeam() {
  return ui.teamIds.map(id => selectableCharacters.find(unit => unit.id === id)).filter(Boolean);
}

function ensureLoadout(characterId) {
  const unit = buildableCharacters.find(item => item.id === characterId) || { id: characterId };
  const loadout = ui.loadouts[characterId] ||= defaultLoadoutFor(characterId);
  setLoadoutAwareness(unit, loadout, resolveAwareness(unit, loadout));
  return loadout;
}

function awarenessFor(unit) {
  return resolveAwareness(unit, ensureLoadout(unit.id));
}

function awarenessSelect(unit) {
  const rank = awarenessFor(unit);
  return `<label class="quick-awareness">Awareness<select data-awareness-select="${escapeHtml(unit.id)}" aria-label="${escapeHtml(unit.codename)} awareness">${AWARENESS_LEVELS.map(level => `<option value="${level}" ${rank === level ? 'selected' : ''}>A${level}</option>`).join('')}</select></label>`;
}

function awarenessEditor(unit, loadout) {
  const rank = resolveAwareness(unit, loadout);
  const coverage = awarenessCoverage(unit);
  return `<section class="build-section awareness-editor" aria-label="Awareness settings">
    <div class="awareness-heading"><div><span>CHARACTER AWARENESS</span><h3>${escapeHtml(unit.codename)} <b data-current-awareness>A${rank}</b></h3></div><em>${coverage.hasSourcedStats ? 'SOURCED STATS + EXISTING MECHANICS' : 'PROFILE SETTING ONLY'}</em></div>
    <div class="awareness-segments" role="group" aria-label="Choose awareness rank">${AWARENESS_LEVELS.map(level => `<button type="button" data-awareness-rank="${level}" data-awareness-unit="${escapeHtml(unit.id)}" aria-label="Set ${escapeHtml(unit.codename)} awareness A${level}" aria-pressed="${rank === level}" class="${rank === level ? 'active' : ''}">A${level}</button>`).join('')}</div>
    <p class="awareness-note">${escapeHtml(coverage.note)}</p>
    ${unit.id === 'wonder' ? '<p class="awareness-note">Wonder keeps his Persona system. This profile does not create a separate in-game awakening system.</p>' : ''}
  </section>`;
}

function bindAwarenessControls() {
  const change = (id, value) => {
    const unit = buildableCharacters.find(item => item.id === id);
    if (!unit) return;
    stopAuto();
    setLoadoutAwareness(unit, ensureLoadout(id), value);
    ui.engine = null;
    saveLoadouts();
    render();
  };
  document.querySelectorAll('[data-awareness-rank]').forEach(button => button.addEventListener('click', () => change(button.dataset.awarenessUnit, button.dataset.awarenessRank)));
  document.querySelectorAll('[data-awareness-select]').forEach(select => select.addEventListener('change', () => change(select.dataset.awarenessSelect, select.value)));
}


function saveTeamIds() {
  localStorage.setItem('p5x-team-v2', JSON.stringify(ui.teamIds));
  clearHachimanRecordedPreset();
  ui.engine = null;
}

function teammateOptions(selectedId, slotIndex) {
  const occupied = new Set(ui.teamIds.filter((_, index) => index !== slotIndex));
  return selectableCharacters.filter(unit => unit.id !== 'wonder' && (!occupied.has(unit.id) || unit.id === selectedId)).map(unit =>
    `<option value="${escapeHtml(unit.id)}" ${unit.id === selectedId ? 'selected' : ''}>${escapeHtml(unit.codename)} — ${escapeHtml(unit.name)}</option>`
  ).join('');
}

function saveLoadouts() {
  localStorage.setItem('p5x-loadouts-v3', JSON.stringify(ui.loadouts));
  clearHachimanRecordedPreset();
}

function selectedPersonaRecords() {
  return (ui.loadouts.wonder.personas || []).map(slot => importedPersonas.find(persona => persona.id === slot.personaId)).filter(Boolean);
}

function battleSkillsWithAdapters(source, skillIds) {
  const adaptedSource = { ...source, skills: (source.skills || []).map(adaptPersonaSkill) };
  const adaptedSkillById = new Map();
  for (const [id, skill] of skillById) adaptedSkillById.set(id, adaptPersonaSkill(skill));
  return battleSkillsForPersona(adaptedSource, skillIds, adaptedSkillById, transferablePersonaSkills);
}

function personaDefinitionsFromLoadout() {
  return (ui.loadouts.wonder.personas || []).map(slot => {
    const source = importedPersonas.find(persona => persona.id === slot.personaId);
    if (!source) return null;
    const selected = battleSkillsWithAdapters(source, slot.skillIds);
    const passive = highestRankPersonaPassive(source);
    return {
      id: source.id, name: source.name, arcana: source.position || `Grade ${source.grade}`, element: source.element,
      role: source.role || (source.position === '우월' ? 'Strategist' : source.position),
      trait: passive?.name || source.description || 'Imported Persona', source: 'Lufelnet',
      passive: passive ? structuredClone(passive) : null,
      // Equipped stat passives (Boosts, Battle Acumen, Apt Pupil, Agility Master).
      staticPassives: (slot.skillIds || []).map(id => personaLoadoutCatalog.transferableSkillById.get(id)).flatMap(staticPassiveEffectsFromSkill),
      skills: selected.map((skill, index) => {
        const combat = skill.combat || {};
        const chillingDepth = source.name === 'Sahimochi-no-kami' && skill.name === 'Chilling Depth';
        const revolution = source.name === 'Sahimochi-no-kami' && skill.name === 'Revolution';
        return {
          id: skill.id, slot: `S${index + 1}`,
          name: chillingDepth ? 'One-Fathom Fang' : skill.name,
          element: skill.element || source.element,
          cost: chillingDepth ? 22
            : source.name === 'Sahimochi-no-kami' && skill.name === 'Maziodyne' ? 21
              : revolution ? 22 : skill.cost || 0,
          hpCost: skill.hpCost,
          power: chillingDepth ? 1.1 : combat.power || 0,
          target: skill.target, scalingStat: skill.scalingStat,
          critBonus: combat.critBonus,
          accuracyModifier: combat.accuracyModifier,
          hitCount: combat.hitCount,
          hitCountRange: combat.hitCountRange ? structuredClone(combat.hitCountRange) : undefined,
          ignoreDefense: combat.ignoreDefense,
          technical: combat.technical ? structuredClone(combat.technical) : undefined,
          debuff: chillingDepth
            ? { id: 'ice_vuln', name: 'ICE DAMAGE TAKEN', elementDamageTaken: 'ice', elementDamageTakenValue: 0.088, value: 0.088, duration: 2 }
            : combat.debuff ? structuredClone(combat.debuff) : undefined,
          debuffs: chillingDepth ? undefined : combat.debuffs ? structuredClone(combat.debuffs) : undefined,
          buff: revolution
            ? { id: 'revolution', name: 'CRIT RATE UP', stat: 'critRate', value: 0.065, duration: 3 }
            : combat.buff ? structuredClone(combat.buff) : undefined,
          buffs: revolution ? undefined : combat.buffs ? structuredClone(combat.buffs) : undefined,
          buffTarget: combat.buffTarget,
          heal: combat.heal,
          healAttack: combat.healAttack,
          healFlat: combat.healFlat,
          healTarget: combat.healTarget,
          spRestore: combat.spRestore,
          limitations: combat.limitations ? structuredClone(combat.limitations) : undefined,
          note: [skill.description || `${skill.kind} skill`, ...(combat.limitations || []).map(item => `Simulator limit: ${item}`)].join(' '),
          sourceConfidence: combat.confidence,
          ...(skill.runnerPer500Attack ? { runnerPer500Attack: skill.runnerPer500Attack, runnerPer500AttackCap: skill.runnerPer500AttackCap } : {})
        };
      })
    };
  }).filter(Boolean);
}

function revelationFor(characterId) {
  const loadout = ui.loadouts[characterId] || {};
  return revelationSets.find(set => set.name === loadout.revelationSet);
}

function buildEngineConfig() {
  const personaDefinitions = personaDefinitionsFromLoadout();
  const team = selectedTeam();
  const navigatorUnit = selectedNavigator();
  return {
    bossId: ui.selectedBoss, modeId: ui.selectedMode, seed: ui.seed, mechanicsProfile: 'live-2026-09-04', navigatorDefinition: selectedNavigator(),
    lifeSustainment: ui.selectedMode === 'nexus' || (ui.selectedMode === 'devourer' && ui.modeOptions.devourer.lifeSustainment),
    encounterThresholds: ui.selectedBoss === 'vishnu' ? structuredClone(ui.vishnuThresholds) : null,
    personaDefinitions, personaIds: personaDefinitions.map(persona => persona.id),
    characterDefinitions: team, teamIds: team.map(unit => unit.id),
    characterOptions: Object.fromEntries([...team, navigatorUnit].filter(unit => unit.slug).map(unit => [unit.slug, structuredClone(ensureLoadout(unit.id).characterResearch || {})])),
    // Account-wide effect follows the saved J&C build even when she is off-party.
    jcA6Unlocked: awarenessFor(buildableCharacters.find(unit => unit.slug === 'j-c') || { id: 'missing-jc', awareness: 0 }) >= 6,
    loadouts: Object.fromEntries([...team, navigatorUnit].map(unit => {
      const loadout = ensureLoadout(unit.id);
      const researchOptions = { characterResearch: structuredClone(loadout.characterResearch || {}), sourceTier: loadout.characterResearch?.sourceTier ?? loadout.sourceTier };
      if (isNavigatorBuild(unit)) return [unit.id, { awareness: awarenessFor(unit), ...researchOptions, baseStats: structuredClone(loadout.baseStats || {}), revelationMain: loadout.revelationMain, revelationSet: loadout.revelationSet, navigatorShare: structuredClone(loadout.navigatorShare || null) }];
      if (unit.id === 'wonder') return [unit.id, { awareness: awarenessFor(unit), baseStats: structuredClone(loadout.baseStats || {}), elementBonus: loadout.elementBonus, statsMode: loadout.statsMode, weaponId: loadout.weaponId, weaponProfileId: loadout.weaponProfileId, weaponProcGranularity: loadout.weaponProcGranularity, revelationName: null, revelationCombat: {} }];
      const set = revelationFor(unit.id);
      if (unit.id === KOTONE_SHIOMI_ID) return [unit.id, { ...normalizeKotoneLoadout(loadout), statBase: statScalingBase(unit, loadout), revelationCombat: structuredClone(set?.combat || {}) }];
      return [unit.id, { statBase: statScalingBase(unit, loadout), awareness: awarenessFor(unit), ...researchOptions, baseStats: structuredClone(loadout.baseStats || {}), statsMode: loadout.statsMode, statsPresetId: loadout.statsPresetId, revelationMain: loadout.revelationMain, revelationSet: loadout.revelationSet, revelationName: [loadout.revelationMain, loadout.revelationSet].filter(Boolean).join(' / '), revelationCombat: structuredClone(set?.combat || {}), jcMasks: structuredClone(loadout.jcMasks || []), cosmicYui: structuredClone(loadout.cosmicYui || {}) }];
    }))
  };
}

const ui = {
  screen: 'setup',
  engine: null,
  selectedBoss: hachimanRecordedFlagSaved() ? 'hachiman' : bosses[0].id,
  selectedMode: hachimanRecordedFlagSaved() ? 'multidimensional' : 'nexus',
  modeOptions: loadModeOptions(),
  seed: hachimanRecordedFlagSaved() ? HACHIMAN_RECORDED_SEED : 808,
  hachimanRecordedPreset: hachimanRecordedFlagSaved(),
  hachimanRouteOutcome: null,
  vishnuThresholds: [0.75, 0.5],
  aiAssist: true,
  fullAuto: false,
  commandTab: 'moves',
  pendingAction: null,
  animation: null,
  autoTimer: null,
  replayIndex: 0,
  replayTimer: null,
  replayPlaying: false,
  importedDataset: null,
  logDetail: false,
  loadouts: loadLoadouts(),
  teamIds: loadTeamIds(),
  teamPickerSlot: null,
  navigatorId: loadNavigatorId(),
  navigatorPickerOpen: false,
  buildCharacterId: 'wonder',
  buildSearch: '',
  optimizerSearch: { status: 'idle', data: null },
  optimizerSeedComparison: false
};

function iconFor(element) {
  const meta = elementMeta[element] || elementMeta.almighty;
  return `<span class="element-icon" style="--element:${meta.color}" title="${meta.label}">${meta.glyph}</span>`;
}

function resistanceList(entity) {
  const values = Array.isArray(entity?.resistances) && entity.resistances.length ? entity.resistances : [entity?.resistance || 'none'];
  return values.filter(Boolean);
}

function resistanceMarkup(entity, includeNames = true) {
  return resistanceList(entity).map(element => `${iconFor(element)}${includeNames ? ` ${escapeHtml(elementMeta[element]?.label || String(element).toUpperCase())}` : ''}`).join(' ');
}

function portrait(unit, size = '') {
  return `<div class="portrait ${size} ${unit.artwork ? 'has-artwork' : ''} ${unit.avatar && unit.id !== KOTONE_SHIOMI_ID ? 'cosmic-portrait' : ''}" style="--accent:${unit.accent || '#e61d2f'}" aria-label="${escapeHtml(unit.codename || unit.name)} portrait">
    <span>${escapeHtml(unit.portrait || unit.name[0])}</span><i></i>${unit.artwork ? `<img src="${escapeHtml(unit.avatar || unit.artwork)}" alt="">` : ''}
  </div>`;
}

function characterModel(unit, size = '') {
  if (!unit.artwork) return portrait(unit, size === 'battle-model' ? 'field' : 'large');
  const cosmicColor = unit.cosmicYui?.color;
  const artwork = unit.slug === 'bui-cosmic' && ['eggplant', 'potato', 'mushroom', 'asparagus'].includes(cosmicColor)
    ? `/assets/characters/bui-cosmic-${cosmicColor}.png` : unit.artwork;
  return `<div class="character-model ${size} ${unit.slug === 'bui-cosmic' ? 'cosmic-model' : ''}" aria-label="${escapeHtml(unit.codename || unit.name)} character artwork"><img src="${escapeHtml(artwork)}" alt=""></div>`;
}

function bossVisual(boss, placement = 'dossier') {
  if (boss.artwork) return `<img class="boss-artwork ${placement}" src="${escapeHtml(boss.artwork)}" alt="">`;
  return placement === 'battle' ? '<div class="boss-mask">Ω</div>' : '<span>Ω</span>';
}

function header(active = ui.screen) {
  const navItems = [
    ['setup', 'Team'], ['builds', 'Builds'], ['battle', 'Battle'], ['lab', 'Optimizer'], ['data', 'Data'], ['kotone', 'Kotone']
  ];
  return `<header class="site-header">
    <button class="brand" data-nav="setup" aria-label="P5X Guild Boss Lab home">
      <span class="brand-mark">P5<span>X</span></span>
      <span class="brand-copy"><b>GUILD BOSS</b><small>SIMULATOR LAB</small></span>
    </button>
    <nav aria-label="Primary">${navItems.map(([id, label]) => `<button data-nav="${id}" class="${active === id ? 'active' : ''}" ${id === 'battle' && !ui.engine ? 'disabled' : ''}>${label}</button>`).join('')}</nav>
    <div class="header-meta"><span class="live-dot"></span> LOCAL SIM <b>v2.2</b></div>
  </header>${startErrorBanner()}`;
}

function teamPickerModal() {
  if (ui.teamPickerSlot === null) return '';
  const slotIndex = ui.teamPickerSlot;
  const occupied = new Set(ui.teamIds.filter((_, index) => index !== slotIndex));
  const candidates = selectableCharacters.filter(unit => unit.id !== 'wonder');
  return `<div class="roster-picker-backdrop" role="dialog" aria-modal="true" aria-label="Choose a teammate">
    <section class="roster-picker">
      <header><div><span class="eyebrow">PARTY SLOT ${slotIndex + 1}</span><h2>Choose teammate</h2><p>Select a combatant. Duplicate party members are disabled.</p></div><button data-close-team-picker aria-label="Close teammate picker">×</button></header>
      <div class="roster-picker-grid">${candidates.map(unit => `<button data-pick-teammate="${unit.id}" ${occupied.has(unit.id) ? 'disabled' : ''} style="--accent:${unit.accent || '#e61d2f'}">
        ${portrait(unit)}<span><small>${escapeHtml(unit.role)} · ${escapeHtml(elementMeta[unit.element]?.label || unit.element)}</small><b>${escapeHtml(unit.codename)}</b><em>${escapeHtml(unit.name)} · A${awarenessFor(unit)}</em></span>${coverageFor(unit) ? `<i class="coverage-choice ${coverageFor(unit).kind}">${escapeHtml(coverageFor(unit).label)}</i>` : unit.formulaStatus === 'estimated-kit' ? '<i>EST. KIT</i>' : '<i>SOURCE KIT</i>'}
      </button>`).join('')}</div>
    </section>
  </div>`;
}

function navigatorPickerModal() {
  if (!ui.navigatorPickerOpen) return '';
  return `<div class="roster-picker-backdrop" role="dialog" aria-modal="true" aria-label="Choose a navigator">
    <section class="roster-picker navigator-picker">
      <header><div><span class="eyebrow">INDEPENDENT SLOT</span><h2>Choose navigator</h2><p>Navigators act immediately without consuming the current character's action.</p></div><button data-close-navigator-picker aria-label="Close navigator picker">×</button></header>
      <div class="roster-picker-grid">${navigatorCandidates.map(unit => `<button data-pick-navigator="${escapeHtml(unit.id)}" class="${unit.id === ui.navigatorId ? 'selected' : ''}" style="--accent:${unit.accent || '#4fb4ff'}">
        ${portrait(unit)}<span><small>NAVIGATOR · ${unit.skills.length} ACTIONS</small><b>${escapeHtml(unit.codename)}</b><em>${escapeHtml(unit.name)} · A${awarenessFor(unit)}</em></span><i>${unit.id === ui.navigatorId ? 'ACTIVE' : 'SELECT'}</i>
      </button>`).join('')}</div>
    </section>
  </div>`;
}

function renderSetup() {
  const boss = bosses.find(item => item.id === ui.selectedBoss) || bosses[0];
  const team = selectedTeam();
  const activeNavigator = selectedNavigator();
  const selectedMode = nightmareModes.find(mode => mode.id === ui.selectedMode) || nightmareModes[0];
  const devourerLifeSustainment = ui.modeOptions.devourer.lifeSustainment;
  const supportsDevourerLifeSustainment = ui.selectedMode === 'devourer' && (boss.id === 'slaughter_drive' || boss.id === 'hachiman');
  const setupPhases = boss.id === 'slaughter_drive' ? (
    ui.selectedMode === 'nexus' ? [
      { name: 'Soul Link and Life Sustainment', thresholdLabel: '1 HP FLOOR' },
      { name: 'Manual Break', thresholdLabel: '2 WEAKENED TURNS' }
    ] : supportsDevourerLifeSustainment ? [
      { name: 'Soul Link', thresholdLabel: 'SHARED HP' },
      { name: `Life Sustainment ${devourerLifeSustainment ? 'On' : 'Off'}`, thresholdLabel: devourerLifeSustainment ? '1 HP FLOOR' : '0 HP TRANSITION' },
      { name: 'Weakened infinite HP scoring', thresholdLabel: '3X · 2 BOSS TURNS' }
    ] : [
      { name: 'Soul Link', thresholdLabel: 'SHARED HP' },
      { name: 'Mode formula', thresholdLabel: 'PENDING' }
    ]
  ) : boss.phases;
  root.innerHTML = `${header('setup')}
    <main class="setup-screen page-enter">
      <section class="setup-hero">
        <div>
          <span class="eyebrow">MISSION PREVIEW / ${escapeHtml(selectedMode.name.toUpperCase())}</span>
          <h1>Choose your crew.<br><em>Break the score ceiling.</em></h1>
          <p>The battle room is turn-first: pick a legal action, resolve it, read the field, repeat. Same seed, same decisions, same result.</p>
        </div>
        <div class="seed-box">
          <label for="seed">SIMULATION SEED</label>
          <div><span>#</span><input id="seed" inputmode="numeric" value="${ui.seed}" aria-label="Simulation seed"></div>
          <small>Deterministic comparison key</small>
        </div>
      </section>

      <section class="mechanics-profile-card" aria-label="Mechanics profile">
        <span>PROFILE</span><div><b>CURRENT CORRECTED RUNS · LIVE-2026-09-04</b><small>${boss.id === 'slaughter_drive' ? 'The recorded Slaughter Drive benchmark is archived as recorded-2026-08-29. Starting a battle uses the corrected live profile.' : 'This battle starts with the corrected live-mechanics profile.'} Coverage is labeled per character. Cosmic Yui has dedicated source-modeled mechanics; unverified interactions remain disclosed.</small></div><em>${boss.id === 'slaughter_drive' ? 'ARCHIVE AVAILABLE' : 'CURRENT'}</em>
      </section>

      <section class="preview-versus" aria-label="Team preview">
        <div class="preview-side crew-preview">
          <div class="section-kicker"><span>01</span> ACTIVE PARTY</div>
          <div class="preview-grid">
            ${team.map((unit, index) => `<article class="preview-card" style="--delay:${index * 60}ms;--accent:${unit.accent || '#e61d2f'}">
              <div class="order-number" data-drag-handle title="Drag to change turn order">${String(index + 1).padStart(2, '0')}</div>
              ${characterModel(unit, 'preview-model')}
              <div class="order-controls" aria-label="Adjust ${escapeHtml(unit.codename)} turn order">
                <button data-order-move="${index}:-1" aria-label="Move ${escapeHtml(unit.codename)} earlier" ${index === 0 ? 'disabled' : ''}>←</button>
                <span>TURN ${index + 1}</span>
                <button data-order-move="${index}:1" aria-label="Move ${escapeHtml(unit.codename)} later" ${index === team.length - 1 ? 'disabled' : ''}>→</button>
              </div>
              ${unit.id === 'wonder' ? '<div class="team-lock">WONDER · FIXED MEMBER</div>' : `<button class="team-change" data-open-team-picker="${index}" aria-label="Change ${escapeHtml(unit.codename)} in slot ${index + 1}"><span>CHANGE TEAMMATE</span><b>${escapeHtml(unit.codename)} ▾</b></button>`}
              <div class="preview-card-copy">
                <span>${escapeHtml(unit.role)}</span>
                <h3>${escapeHtml(unit.codename)}</h3>
                <p>${iconFor(unit.element)} ${elementMeta[unit.element]?.label || 'ALMIGHTY'} · A${awarenessFor(unit)}</p>
              </div>
              ${unit.id === 'wonder' ? `<button class="persona-count" data-persona-info>${selectedPersonaRecords().length} PERSONAS ↗</button>` : ''}
              ${awarenessSelect(unit)}
              <button class="build-shortcut" data-edit-build="${unit.id}">EDIT BUILD</button>
              ${coverageFor(unit) ? `<span class="coverage-badge ${coverageFor(unit).kind}" title="${escapeHtml(coverageFor(unit).detail)}">${escapeHtml(coverageFor(unit).label)}</span>` : ''}
              <span class="revelation-label">${unit.id === 'wonder' ? `${escapeHtml(getWonderWeaponDefinition(ensureLoadout('wonder').weaponId)?.name || 'NO WEAPON')} · PERSONA LOADOUT` : `${escapeHtml(ensureLoadout(unit.id).revelationMain || '—')} · ${escapeHtml(ensureLoadout(unit.id).revelationSet || '—')}${unit.formulaStatus === 'estimated-kit' ? ' · EST. KIT' : ''}`}</span>
            </article>`).join('')}
          </div>
          <div class="wonder-weapon-setup">
            <div><small>WONDER LOADOUT</small><b>WEAPON</b><span>Level 80, rank 6 datamine profiles</span></div>
            <select data-wonder-weapon-quick aria-label="Wonder weapon">${wonderWeaponOptions(ensureLoadout('wonder').weaponId)}</select>
          </div>
          <button class="navigator-preview" data-open-navigator-picker aria-label="Change navigator">
            <div class="nav-label">INDEPENDENT SLOT</div>
            ${portrait(activeNavigator)}
            <div><small>NAVIGATOR · CHANGE ▾</small><strong>${escapeHtml(activeNavigator.codename)}</strong><span>${escapeHtml(activeNavigator.name)} · A${awarenessFor(activeNavigator)} · ${activeNavigator.skills.length} actions</span></div>
            <span class="ready-pill">SELECTED</span>
          </button>
          <div class="navigator-build-controls">${awarenessSelect(activeNavigator)}<button data-edit-build="${escapeHtml(activeNavigator.id)}">EDIT NAVIGATOR BUILD</button></div>
        </div>

        <div class="versus-mark" aria-hidden="true"><span>V</span><b>S</b></div>

        <div class="preview-side boss-preview">
          <div class="section-kicker"><span>02</span> TARGET</div>
          <div class="boss-selector">
            ${bosses.map(item => `<button data-boss="${item.id}" class="${item.id === boss.id ? 'active' : ''}">${escapeHtml(item.name)}<span>${escapeHtml(item.subtitle)}</span></button>`).join('')}
          </div>
          <div class="mode-selector" aria-label="Dream mode">
            ${nightmareModes.map(mode => `<button data-mode="${mode.id}" class="${mode.id === ui.selectedMode ? 'active' : ''}"><b>${escapeHtml(mode.name)}</b><span>${escapeHtml(mode.note)}</span></button>`).join('')}
          </div>
          ${boss.id === 'slaughter_drive' && ui.selectedMode === 'nexus' ? `<div class="mode-rule-card locked"><span>LOCKED ON</span><div><b>LIFE SUSTAINMENT</b><small>Linked enemies stop at 1 HP. Reach the floor, then choose when to break.</small></div></div>` : ''}
          <article class="boss-dossier">
            <div class="boss-sigil">${bossVisual(boss)}<i></i><b>LV ${boss.level}</b></div>
            <div class="boss-copy">
              <small>${escapeHtml(boss.id === 'slaughter_drive' ? `${selectedMode.name} · Recorded Mechanics` : boss.subtitle)}</small>
              <h2>${escapeHtml(boss.name)}</h2>
              <div class="boss-stats">
                <span><small>HP</small><b>${boss.finiteHp ? format(boss.maxHp) : boss.scoreAttack ? '∞ SCORE' : format(boss.maxHp)}</b></span>
                <span><small>DEF</small><b>${boss.defense}</b></span>
                <span><small>LIMIT</small><b>${ui.selectedMode === 'devourer' ? '110 + 2 WEAKENED' : ['nexus', 'multidimensional'].includes(ui.selectedMode) ? 6 : boss.previewAttackTurns || boss.turnLimit} ATK TURNS</b></span>
              </div>
              <div class="affinity-row"><span>WEAK ${iconFor(boss.weakness)} ${elementMeta[boss.weakness].label}</span><span>RESIST ${resistanceMarkup(boss)}</span></div>
              <ol>${setupPhases.map(phase => `<li><i></i><span>${escapeHtml(phase.name)}</span><b>${Number.isFinite(phase.threshold) ? `${Math.round(phase.threshold * 100)}%` : escapeHtml(phase.thresholdLabel || 'SCRIPTED')}</b></li>`).join('')}</ol>
              ${boss.specialEffects?.length ? `<div class="boss-effect-list"><b>SPECIAL EFFECTS</b>${boss.specialEffects.map(effect => `<span>${escapeHtml(effect)}</span>`).join('')}</div>` : ''}
              ${boss.encounter?.thresholdNote ? `<p class="formula-note">${escapeHtml(boss.encounter.thresholdNote)}</p>` : ''}
              ${boss.id === 'vishnu' ? `<div class="threshold-config" aria-label="Provisional Vishnu HP gates">
                <label><span>SPAWN TO 3</span><b><input type="number" min="1" max="99" value="${Math.round(ui.vishnuThresholds[0] * 100)}" data-vishnu-threshold="0">% HP</b></label>
                <label><span>SPAWN TO 5</span><b><input type="number" min="1" max="99" value="${Math.round(ui.vishnuThresholds[1] * 100)}" data-vishnu-threshold="1">% HP</b></label>
              </div>` : ''}
            </div>
          </article>
        </div>
      </section>

      ${boss.id === 'hachiman' ? hachimanPresetNoteMarkup() : ''}
      <section class="launch-strip">
        <div><span class="check">✓</span><p><b>Team legal</b><small>Wonder + 3 teammates + navigator</small></p></div>
        <div><span class="check">✓</span><p><b>Engine ready</b><small>Structured formulas · seeded RNG</small></p></div>
        ${boss.id === 'slaughter_drive' ? '<button class="benchmark-preset" data-load-recorded-benchmark>LOAD RECORDED TEAM</button>' : ''}
        ${boss.id === 'hachiman' && !ui.hachimanRecordedPreset ? '<button class="benchmark-preset" data-load-hachiman-recorded>LOAD HACHIMAN RECORDED TEAM</button>' : ''}
        ${boss.id === 'hachiman' && ui.hachimanRecordedPreset ? '<button class="benchmark-preset" data-replay-hachiman-route>REPLAY RECORDED ROUTE</button>' : ''}
        <button class="launch-button" data-start-battle><span>ENTER BATTLE</span><b>→</b></button>
      </section>
    </main>
    ${personaModal()}${teamPickerModal()}${navigatorPickerModal()}`;
  bindCommon();
  document.querySelector('#seed')?.addEventListener('change', event => { ui.seed = Number(event.target.value) || 808; });
  document.querySelectorAll('[data-vishnu-threshold]').forEach(input => input.addEventListener('change', () => {
    const index = Number(input.dataset.vishnuThreshold);
    let value = Math.min(0.99, Math.max(0.01, Number(input.value) / 100));
    if (index === 0) value = Math.max(value, ui.vishnuThresholds[1] + 0.01);
    else value = Math.min(value, ui.vishnuThresholds[0] - 0.01);
    ui.vishnuThresholds[index] = value;
    input.value = Math.round(value * 100);
  }));
  document.querySelectorAll('[data-boss]').forEach(button => button.addEventListener('click', () => {
    ui.selectedBoss = button.dataset.boss;
    const selected = bosses.find(item => item.id === ui.selectedBoss);
    const keepsSelectedMode = selected?.id === 'surt' && selected.supportedModes?.includes(ui.selectedMode);
    if (!keepsSelectedMode) ui.selectedMode = selected?.defaultMode || ui.selectedMode;
    if (ui.selectedBoss !== 'hachiman') clearHachimanRecordedPreset();
    ui.engine = null;
    render();
  }));
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    ui.selectedMode = button.dataset.mode;
    if (ui.selectedMode !== 'multidimensional') clearHachimanRecordedPreset();
    ui.engine = null;
    render();
  }));
  document.querySelector('[data-load-recorded-benchmark]')?.addEventListener('click', loadRecordedBenchmarkPreset);
  document.querySelector('[data-load-hachiman-recorded]')?.addEventListener('click', loadHachimanRecordedPreset);
  document.querySelector('[data-replay-hachiman-route]')?.addEventListener('click', replayHachimanRecordedRoute);
  document.querySelector('[data-start-battle]')?.addEventListener('click', startBattle);
  document.querySelector('[data-persona-info]')?.addEventListener('click', () => document.querySelector('#persona-modal')?.showModal());
  document.querySelector('[data-wonder-weapon-quick]')?.addEventListener('change', event => {
    setWonderWeaponSelection(ensureLoadout('wonder'), event.target.value);
    saveLoadouts(); render();
  });
  document.querySelectorAll('[data-open-team-picker]').forEach(button => button.addEventListener('click', () => { ui.teamPickerSlot = Number(button.dataset.openTeamPicker); render(); }));
  document.querySelector('[data-close-team-picker]')?.addEventListener('click', () => { ui.teamPickerSlot = null; render(); });
  document.querySelector('[data-open-navigator-picker]')?.addEventListener('click', () => { ui.navigatorPickerOpen = true; render(); });
  document.querySelector('[data-close-navigator-picker]')?.addEventListener('click', () => { ui.navigatorPickerOpen = false; render(); });
  document.querySelectorAll('[data-pick-navigator]').forEach(button => button.addEventListener('click', () => {
    ui.navigatorId = button.dataset.pickNavigator;
    ui.navigatorPickerOpen = false;
    saveNavigatorId(); render();
  }));
  document.querySelectorAll('[data-pick-teammate]').forEach(button => button.addEventListener('click', () => {
    const selectedId = button.dataset.pickTeammate;
    ui.teamIds[ui.teamPickerSlot] = selectedId;
    ensureLoadout(selectedId);
    ui.teamPickerSlot = null;
    saveLoadouts(); saveTeamIds(); render();
  }));
  bindTeamOrderDrag();
  document.querySelectorAll('[data-order-move]').forEach(button => button.addEventListener('click', () => {
    const [index, delta] = button.dataset.orderMove.split(':').map(Number);
    const next = index + delta;
    [ui.teamIds[index], ui.teamIds[next]] = [ui.teamIds[next], ui.teamIds[index]];
    saveTeamIds(); render();
  }));
  document.querySelectorAll('[data-edit-build]').forEach(button => button.addEventListener('click', () => { ui.buildCharacterId = button.dataset.editBuild; ui.screen = 'builds'; render(); }));
}

// Drag a Team Preview card onto another slot to move it there. Mouse drags start
// anywhere on the card; touch drags start on the numbered badge so swiping a card
// still scrolls the page. The arrow buttons remain for keyboard use.
function bindTeamOrderDrag() {
  const cards = [...document.querySelectorAll('.preview-grid .preview-card')];
  let drag = null;
  const cardAt = (x, y) => document.elementFromPoint(x, y)?.closest('.preview-grid .preview-card');
  const clearTargets = () => cards.forEach(card => card.classList.remove('drop-target'));
  const finish = commit => {
    if (!drag) return;
    const { card, from, pointerId } = drag;
    const target = commit && drag.moved ? drag.target : null;
    drag = null; // cleared first: releasing capture fires lostpointercapture synchronously
    card.releasePointerCapture?.(pointerId);
    card.classList.remove('dragging'); card.style.transform = '';
    clearTargets();
    if (target == null || target === from) return;
    const [moved] = ui.teamIds.splice(from, 1);
    ui.teamIds.splice(target, 0, moved);
    saveTeamIds(); render();
  };
  cards.forEach((card, index) => {
    card.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('button, select, input, a, label')) return;
      if (event.pointerType !== 'mouse' && !event.target.closest('[data-drag-handle]')) return;
      drag = { card, from: index, target: index, pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
      card.setPointerCapture?.(event.pointerId);
    });
    card.addEventListener('pointermove', event => {
      if (!drag || drag.card !== card || event.pointerId !== drag.pointerId) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 8) return;
      drag.moved = true;
      event.preventDefault();
      card.classList.add('dragging');
      card.style.transform = `translate(${dx}px, ${dy}px)`;
      card.style.pointerEvents = 'none';
      const over = cardAt(event.clientX, event.clientY);
      card.style.pointerEvents = '';
      clearTargets();
      const overIndex = over ? cards.indexOf(over) : -1;
      drag.target = overIndex >= 0 ? overIndex : drag.target;
      if (overIndex >= 0 && overIndex !== drag.from) over.classList.add('drop-target');
    });
    card.addEventListener('pointerup', event => { if (drag?.pointerId === event.pointerId) finish(true); });
    card.addEventListener('pointercancel', () => finish(false));
    card.addEventListener('lostpointercapture', () => finish(true));
  });
}

function personaModal() {
  return `<dialog id="persona-modal" class="info-modal">
    <button class="modal-close" onclick="this.closest('dialog').close()" aria-label="Close">×</button>
    <span class="eyebrow">WONDER LOADOUT</span><h2>Equipped Personas</h2>
    <div class="persona-modal-grid">${personaDefinitionsFromLoadout().map(persona => `<article>
      <div class="persona-orb" style="--persona:${elementMeta[persona.element].color}">${persona.name[0]}</div>
      <div><small>${escapeHtml(persona.arcana)} · ${elementMeta[persona.element]?.label || persona.element}</small><h3>${escapeHtml(persona.name)}</h3><p>${escapeHtml(persona.trait)}</p></div>
    </article>`).join('')}</div>
    <p class="modal-note">Persona selection is free during Wonder's decision window. Choose a Persona, then use one of its equipped skills as the counted Action.</p>
  </dialog>`;
}

// Which party member's build blocked the battle, when it can be identified.
function startErrorCharacter() {
  if (!ui.teamIds.includes(KOTONE_SHIOMI_ID)) return null;
  try { normalizeKotoneLoadout(ensureLoadout(KOTONE_SHIOMI_ID)); return null; } catch { return KOTONE_SHIOMI_ID; }
}

function startErrorBanner() {
  if (!ui.startError) return '';
  const unit = ui.startError.characterId && buildableCharacters.find(item => item.id === ui.startError.characterId);
  return `<div class="start-error" role="alert"><div><b>BATTLE NOT STARTED</b><p>${escapeHtml(ui.startError.message)}</p></div>${unit ? `<button data-start-error-fix="${escapeHtml(unit.id)}">FIX ${escapeHtml(unit.codename.toUpperCase())} BUILD →</button>` : ''}<button data-dismiss-start-error aria-label="Dismiss">×</button></div>`;
}

function startBattle() {
  stopAuto();
  try {
    ui.engine = ui.hachimanRecordedPreset
      ? new HachimanRecordedEngine(createHachimanRecordedConfig(ui.seed).config)
      : new BattleEngine(buildEngineConfig());
  } catch (error) {
    // Never leave an older battle on screen when the new one cannot start.
    ui.engine = null;
    ui.startError = { message: error.message, characterId: startErrorCharacter() };
    render();
    return;
  }
  ui.startError = null;
  ui.hachimanRouteOutcome = null;
  ui.screen = 'battle';
  ui.commandTab = 'moves';
  ui.pendingAction = null;
  ui.replayIndex = 0;
  render();
  requestAnimationFrame(() => window.scrollTo(0, 0));
}

function statusEffects(unit) {
  return [
    ...(unit.buffs || []).map(effect => ({ ...effect, kind: 'buff' })),
    ...(unit.debuffs || []).map(effect => ({ ...effect, kind: 'debuff' }))
  ];
}

function effectDuration(effect) {
  if (effect.durationKnown === false) return 'DURATION UNKNOWN';
  const duration = Number(effect.duration);
  if (!Number.isFinite(duration) || duration >= 900) return 'PASSIVE';
  return `${Math.max(0, duration)} TURN${duration === 1 ? '' : 'S'}`;
}

function effectValueSummary(effect) {
  const base = effect.baseValue ?? effect.baseEffect ?? effect.menuValue;
  const effective = effect.value ?? effect.effectiveValue ?? effect.appliedValue;
  if (base == null || effective == null || Number(base) === Number(effective)) return '';
  const percent = value => `${(Number(value) * 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
  return `BASE ${percent(base)} | APPLIED ${percent(effective)}`;
}

function statusControl(unit, key, label, showEmpty = false) {
  const effects = statusEffects(unit);
  const buffCount = effects.filter(effect => effect.kind === 'buff').length;
  const debuffCount = effects.length - buffCount;
  if (!effects.length) {
    return showEmpty
      ? `<span class="status-summary-empty" aria-label="${escapeHtml(label)} has no active effects"><b>FX</b> 0</span>`
      : `<span class="no-status">NO EFFECTS</span>`;
  }

  const popoverId = `effects-${String(key).replace(/[^A-Za-z0-9_-]/g, '-')}`;
  const summary = `${buffCount} buff${buffCount === 1 ? '' : 's'} and ${debuffCount} debuff${debuffCount === 1 ? '' : 's'}`;
  return `<button type="button" class="status-summary-button" popovertarget="${popoverId}" aria-label="Open ${escapeHtml(label)} effects: ${summary}">
      <span>FX</span><b class="buff">↑${buffCount}</b><b class="debuff">↓${debuffCount}</b><em>OPEN</em>
    </button>
    <div id="${popoverId}" class="status-popover" popover="auto" aria-label="${escapeHtml(label)} active effects">
      <div class="status-popover-header"><div><small>ACTIVE EFFECTS</small><b>${escapeHtml(label)}</b></div><span>${effects.length} TOTAL</span><button type="button" popovertarget="${popoverId}" popovertargetaction="hide" aria-label="Close ${escapeHtml(label)} effects">CLOSE</button></div>
      <p class="status-help">These are the effects currently applied in this battle. PASSIVE effects do not expire.</p>
      <div class="status-effect-list">${effects.map(effect => `<article class="status-effect-row ${effect.kind}">
        <span>${effect.kind === 'buff' ? '↑' : '↓'}</span><div><small>${effect.kind === 'buff' ? 'BUFF' : 'DEBUFF'}</small><b>${escapeHtml(effect.name)}</b><em>${escapeHtml(String(effect.sourceType || 'unknown').replaceAll('_', ' ').toUpperCase())}${effectValueSummary(effect) ? ` | ${escapeHtml(effectValueSummary(effect))}` : ''}</em></div><strong>${effectDuration(effect)}</strong>
      </article>`).join('')}</div>
    </div>`;
}

function formatBattleStat(value, suffix = '', multiplier = 1) {
  const numeric = Number(value) * multiplier;
  if (!Number.isFinite(numeric)) return '-';
  const formatted = numeric.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  return `${formatted}${suffix}`;
}

function characterStatsControl(unit, key, label) {
  const safeKey = String(key).replace(/[^A-Za-z0-9_-]/g, '-');
  const popoverId = `stats-${safeKey}`;
  const titleId = `${popoverId}-title`;
  // In-battle values use the same buff sums as the engine's damage formula:
  // Attack x (1 + Attack buffs) + flat Attack; rates add their buff stats.
  const buffSum = stat => (unit.buffs || []).filter(effect => effect.stat === stat).reduce((sum, effect) => sum + (Number(effect.value) || 0), 0);
  const damageSum = (unit.buffs || []).filter(effect => !effect.stat || effect.stat === 'damage').reduce((sum, effect) => sum + (Number(effect.value) || 0), 0);
  const finalDamage = (unit.buffs || []).filter(effect => effect.stat === 'finalDamage').reduce((product, effect) => product * (1 + (Number(effect.value) || 0)), 1) - 1;
  const row = (name, base, current, suffix = '', multiplier = 1) => {
    const shown = formatBattleStat(current, suffix, multiplier);
    const start = formatBattleStat(base, suffix, multiplier);
    return [name, shown === start ? shown : `${shown} <small>base ${start}</small>`];
  };
  const stats = [
    row('MAX HP', unit.maxHp, unit.maxHp),
    row('MAX SP', unit.maxSp, unit.maxSp),
    row('ATTACK', unit.attack, Number(unit.attack) + (Number(unit.statBase?.attack) > 0 ? Number(unit.statBase.attack) : Number(unit.attack)) * buffSum('attack') + buffSum('flatAttack')),
    row('DEFENSE', unit.defense, Number(unit.defense) * (1 + buffSum('defense'))),
    row('SPEED', unit.speed, Number(unit.speed) + buffSum('speed')),
    row('CRIT RATE', unit.crit, Number(unit.crit) + buffSum('critRate'), '%', 100),
    row('CRIT MULT.', unit.critMult, Number(unit.critMult ?? 1.5) + buffSum('critDamage'), '%', 100),
    row('SP RECOVERY', unit.spRecovery, unit.spRecovery, '%'),
    row('TECHNICAL PRECISION', unit.technicalPrecision ?? 0, unit.technicalPrecision ?? 0),
    row('PIERCE RATE', unit.pierceRate ?? 0, Number(unit.pierceRate ?? 0) + buffSum('pierce'), '%', 100),
    row('DOWN POINTS', unit.downPoints ?? 0, unit.downPoints ?? 0),
    row('AILMENT ACC.', unit.ailmentAccuracy ?? 0, unit.ailmentAccuracy ?? 0, '%', 100),
    row('AILMENT RESIST.', unit.ailmentResistance ?? 0, unit.ailmentResistance ?? 0, '%', 100),
    row('DAMAGE MULT. +', unit.damageBonus ?? 0, Number(unit.damageBonus ?? 0) + damageSum, '%', 100),
    row('DAMAGE DOWN', unit.damageReduction ?? 0, Number(unit.damageReduction ?? 0) + buffSum('damageReduction'), '%', 100),
    row('SKILL AMPLIFICATION', 0, buffSum('skillAmplification'), '%', 100),
    row('FINAL DAMAGE +', 0, finalDamage, '%', 100)
  ];
  return `<button type="button" class="status-summary-button stats-summary-button" popovertarget="${popoverId}" aria-haspopup="dialog" aria-label="Open ${escapeHtml(label)} stats">
      <span>STATS</span><em>OPEN</em>
    </button>
    <div id="${popoverId}" class="status-popover stats-popover" popover="auto" role="dialog" aria-labelledby="${titleId}">
      <div class="status-popover-header stats-popover-header"><div><small>IN-BATTLE STATS · WITH CURRENT BUFFS</small><b id="${titleId}">${escapeHtml(label)}</b></div><span>${stats.length} VALUES</span><button type="button" popovertarget="${popoverId}" popovertargetaction="hide" aria-label="Close ${escapeHtml(label)} stats">X</button></div>
      <dl class="stats-grid">${stats.map(([name, value]) => `<div class="stat-row"><dt>${name}</dt><dd>${value}</dd></div>`).join('')}</dl>
    </div>`;
}

function marianPrescriptionChip(unit, state) {
  if (unit.slug !== 'marian-beachflower') return '';
  const maximum = Math.max(1, Number(unit.medicinePrescriptionMax) || 2);
  const charges = Math.max(0, Math.min(maximum, Number(unit.midsummerPrescription) || 0));
  const characterTurn = Number(unit.characterTurnsStarted);
  const lastUsedTurn = Number(unit.lastMedicineCharacterTurn);
  const usedThisTurn = Number.isFinite(lastUsedTurn) && lastUsedTurn > 0 && lastUsedTurn === characterTurn;
  const isActive = state.phase === 'battle' && state.party[state.actorIndex]?.id === unit.id;
  const status = charges === 0 ? 'EMPTY' : usedThisTurn ? 'USED' : isActive ? 'READY' : 'STORED';
  return `<div class="prescription-chip ${status.toLowerCase()}" aria-label="${escapeHtml(unit.codename)} medicine charges ${charges} of ${maximum}, ${status.toLowerCase()}"><span>Rx</span><b>MEDICINE ${charges}/${maximum}</b><em>${status}</em></div>`;
}

function summonVisual(summon) {
  const artwork = summon.artwork || (['crimson_turret', 'scarlet_turret'].includes(summon.kind) ? '/assets/bosses/crimson-turret-goofy.png' : '');
  if (artwork) return `<img class="summon-artwork" src="${escapeHtml(artwork)}" alt="">`;
  return '<div class="summon-mask">♟</div>';
}

function resourceBar(label, value, max, type) {
  return `<div class="resource-line ${type}"><span>${label}</span><div><i style="width:${pct(value, max)}%"></i></div><b>${format(value)}<small>/${format(max)}</small></b></div>`;
}

function renderBossField(state) {
  const boss = state.boss;
  const phase = boss.phases[boss.phaseIndex] || boss.phases[0] || { name: boss.name };
  const summons = boss.summons || [];
  const currentEnemyId = state.actionQueue?.find(entry => entry.actorType === 'enemy' && entry.current)?.actorId;
  const enemyCount = state.enemies?.filter(enemy => enemy.alive !== false).length || 1;
  const devourerWeakened = boss.modeId === 'devourer' && state.weakened;
  const supportsDevourerLifeSustainment = boss.modeId === 'devourer' && (boss.encounter?.soulLink || boss.id === 'hachiman');
  const weakenedBossTurnLabel = `${state.weakenedTurnsLeft} Boss Turn${state.weakenedTurnsLeft === 1 ? '' : 's'}`;
  const phaseLabel = ['threshold_clones', 'fixed_five_targets'].includes(boss.encounter?.kind) ? `TARGETS ${enemyCount}` : `PHASE ${boss.phaseIndex + 1}`;
  const phaseName = supportsDevourerLifeSustainment
    ? devourerWeakened
      ? `Weakened · Infinite HP · ${weakenedBossTurnLabel}`
      : `Life Sustainment ${boss.lifeSustainment ? 'On' : 'Off'}`
    : boss.encounter?.soulLink
      ? boss.modeId === 'nexus'
        ? boss.weakenedActive ? 'Weakened · 2 Attack Turns' : boss.breakPending ? 'HP Floor Reached · Break Ready' : 'Soul Link · Life Sustainment'
        : devourerWeakened
          ? `Weakened · Infinite HP · ${weakenedBossTurnLabel}`
          : `Soul Link · Life Sustainment ${boss.lifeSustainment ? 'On' : 'Off'}`
      : phase.name.replace(/^Phase [IVX]+ · /, '');
  return `<section class="enemy-zone ${ui.animation?.targetId === boss.id ? 'taking-hit' : ''}" aria-label="Enemy field">
    <div class="phase-banner"><span>${phaseLabel}</span><b>${escapeHtml(phaseName)}</b></div>
    <div class="boss-hud">
      <div class="hud-title"><div><small>GUILD BOSS · LV ${boss.level}</small><h2>${escapeHtml(boss.name)}</h2></div><strong>${devourerWeakened ? '∞' : boss.finiteHp ? `${Math.ceil(pct(boss.hp, boss.maxHp))}%` : boss.scoreAttack ? '∞' : `${Math.ceil(pct(boss.hp, boss.maxHp))}%`}</strong></div>
      ${devourerWeakened ? `<div class="infinite-meter"><i></i><b>WEAKENED · 3X POINTS · ${weakenedBossTurnLabel.toUpperCase()}</b></div>` : boss.finiteHp ? resourceBar('HP', boss.hp, boss.maxHp, 'hp') : boss.scoreAttack ? `<div class="infinite-meter"><i></i><b>SCORE TARGET · ${format(state.totalDamage)} DMG</b></div>` : resourceBar('HP', boss.hp, boss.maxHp, 'hp')}
      ${supportsDevourerLifeSustainment ? `<div class="life-sustainment-state ${devourerWeakened ? 'weakened' : boss.lifeSustainment ? 'on' : 'off'}"><span>${boss.id === 'hachiman' ? 'HACHIMAN LIFE LOCK' : `SOUL LINK · ${enemyCount} ENEMIES`}</span><b>${devourerWeakened ? 'INFINITE HP · WEAKENED · 3X POINTS' : boss.modeId === 'nexus' && boss.breakPending ? '1 HP FLOOR · BREAK READY' : boss.lifeSustainment ? 'LIFE SUSTAINMENT ON · 1 HP FLOOR' : 'LIFE SUSTAINMENT OFF · 0 HP TO WEAKENED'}</b></div>` : ''}
      <div class="down-gauge"><span>DOWN</span><b>${boss.downed ? 'DOWNED' : `${boss.downPoints}/${boss.downMax}`}</b><i>${Array.from({ length: boss.downMax }, (_, index) => `<em class="${index < boss.downPoints ? 'full' : ''}"></em>`).join('')}</i></div>
      <div class="boss-statuses">${statusControl(boss, `boss-${boss.id}`, boss.name)}</div>
      ${boss.id === 'surt' ? `<div class="surt-escalation"><span>BERSERK <b>${boss.berserkStacks || 0}/3</b></span><span>RAGNAROK <b>${boss.ragnarokStacks || 0}/10</b></span></div>` : ''}
    </div>
    <div class="summon-field">${summons.map(summon => `<article class="summon ${escapeHtml(summon.position || '')} ${summon.alive ? '' : 'defeated'} ${summon.downed ? 'downed' : ''} ${currentEnemyId === summon.id ? 'active' : ''}" data-enemy="${summon.id}">
      ${summonVisual(summon)}<b>${escapeHtml(summon.name)}</b>${devourerWeakened ? `<div class="summon-hp infinite"><span>∞ · WEAKENED · 3X</span><i><b style="width:100%"></b></i></div>` : summon.finiteHp ? `<div class="summon-hp"><span>${summon.alive ? `${format(summon.hp)}/${format(summon.maxHp)}${currentEnemyId === summon.id ? ' · ACTING' : ''}` : 'DEFEATED'}</span><i><b style="width:${pct(summon.hp, summon.maxHp)}%"></b></i></div>` : `<span>${summon.alive ? `${summon.scoreAttack ? '∞ SCORE' : `${Math.ceil(pct(summon.hp, summon.maxHp))}% HP`}${currentEnemyId === summon.id ? ' · ACTING' : ''}` : 'DEFEATED'}</span>`}
      <div class="summon-down">DOWN ${summon.downed ? 'DOWNED' : `${summon.downPoints}/${summon.downMax}`}</div><div class="boss-statuses">${statusControl(summon, `enemy-${summon.id}`, summon.name)}</div>
    </article>`).join('')}</div>
    <div class="boss-figure"><div class="boss-aura"></div>${bossVisual(boss, 'battle')}<div class="boss-shadow"></div></div>
    <div class="affinity-float"><span>WEAK ${iconFor(boss.weakness)}</span><span>RESIST ${resistanceMarkup(boss, false)}</span></div>
    ${animationMarkup()}
  </section>`;
}

function animationMarkup() {
  if (!ui.animation) return '';
  const sign = ui.animation.kind === 'heal' ? '+' : '−';
  const label = ui.animation.critical ? 'CRITICAL' : ui.animation.weakness ? 'WEAK' : ui.animation.kind === 'buff' ? 'BUFF' : '';
  return `<div class="damage-float ${ui.animation.kind || 'damage'}"><small>${label}</small><b>${ui.animation.amount ? sign + format(ui.animation.amount) : escapeHtml(ui.animation.label || '')}</b></div>`;
}

function jcHighlightCooldownMarkup(unit) {
  if (unit.slug !== 'j-c') return '';
  const masks = unit.selectedMasks || [];
  if (!masks.length) return '';
  return `<div class="jc-highlight-clocks" aria-label="J and C selected mask Highlight cooldowns">${masks.map(mask => {
    const cooldown = jcMaskCooldown(unit, mask);
    return `<span class="${cooldown > 0 ? 'cooling' : 'ready'}"><b>${escapeHtml(jcMaskShort[mask] || String(mask).toUpperCase())}</b><em>${cooldown > 0 ? `HL CD ${cooldown}` : 'HL READY'}</em></span>`;
  }).join('')}</div>`;
}

function berryMechanicMarkup(unit) {
  if (unit.slug !== 'berry') return '';
  const used = unit.doubleBerryUsed || {};
  const usedCount = Object.values(used).filter(Boolean).length;
  const chains = Math.max(0, Number(unit.chainsOfLove) || 0);
  const highlight = used.HL ? 'HL USED' : chains >= 4 ? 'FREE HL READY' : `FREE HL AT 4`;
  return `<div class="mechanic-chip berry"><b>DOUBLE BERRY | CHAINS ${chains}</b><em>${usedCount}/4 ONE-TIME OPTIONS | ${highlight}</em></div>`;
}

function renderPartyField(state) {
  const activePersona = ui.engine?.personaDefinitions.find(persona => persona.id === state.activePersonaId);
  const usesSharedHighlight = state.highlight?.mode === 'shared';
  return `<section class="party-zone" aria-label="Player party">
    ${state.party.map((unit, index) => `<article class="combatant ${index === state.actorIndex && state.phase === 'battle' ? 'active' : ''} ${ui.animation?.targetId === unit.id ? 'taking-hit ally-hit' : ''}" data-unit="${unit.id}">
      <div class="turn-caret">CURRENT</div>
      ${characterModel(unit, 'battle-model')}
      <div class="combatant-card">
        <div class="combatant-name"><span>${index + 1}</span><div><small>${escapeHtml(unit.role)}${unit.id === 'wonder' ? ` · ${escapeHtml(activePersona?.name || '')}` : ''}</small><b>${escapeHtml(unit.codename)}</b></div>${iconFor(unit.id === 'wonder' ? activePersona?.element : unit.element)}</div>
        ${resourceBar('HP', unit.hp, unit.maxHp, 'hp')}
        ${resourceBar('SP', unit.sp, unit.maxSp, 'sp')}
        <div class="ammo-readout"><span>GUN</span><b>${unit.ammo}/${unit.maxAmmo || 8}</b></div>
        ${usesSharedHighlight ? '' : `<div class="mini-meter"><span>HIGHLIGHT</span><i><b style="width:${unit.highlight}%"></b></i><strong>${unit.highlight}%</strong></div>`}
        ${marianPrescriptionChip(unit, state)}
        ${unit.slug === 'puppet-wavecatcher' ? `<div class="mechanic-chip"><b>${unit.surfActive ? 'SURF ACTIVE' : 'SURF OFF'}</b><em>OFFSHORE ${unit.offshoreStacks} · SP REC ${unit.spRecovery}%</em></div>` : ''}
        ${unit.blessingStacks ? `<div class="mechanic-chip"><b>BLESSING ${unit.blessingStacks}</b><em>DAMAGE +${Math.min(36, unit.blessingStacks * 6)}%</em></div>` : ''}
        ${unit.slug === 'j-c' ? `<div class="mechanic-chip jc"><b>S1 ${jcMaskShort[unit.selectedMasks?.[0]] || '?'} | S2 ${jcMaskShort[unit.selectedMasks?.[1]] || '?'}</b><em>DESIRE ${unit.desireLevel} | FACADES ${unit.facades.length} | ALT ${unit.trueDesirePrimed ? 'STORED' : unit.trueDesireStacks > 0 ? 'READY' : 'USED'}</em></div>${jcHighlightCooldownMarkup(unit)}` : ''}
        ${berryMechanicMarkup(unit)}${cosmicMechanicMarkup(unit)}${researchedResourceMarkup(unit)}
        ${kotoneStatusMarkup(unit, state.party)}
        <div class="unit-detail-controls">${characterStatsControl(unit, `party-${unit.id}`, unit.codename)}<div class="unit-statuses">${statusControl(unit, `party-${unit.id}`, unit.codename, true)}</div></div>
      </div>
    </article>`).join('')}
  </section>`;
}

function queueMarkup(state) {
  const remaining = state.party.slice(state.actorIndex).filter(unit => unit.hp > 0);
  const completed = state.party.slice(0, state.actorIndex);
  const fallbackQueue = `${completed.map(unit => `<i class="done">${escapeHtml(unit.portrait)}</i>`).join('')}${remaining.map((unit, index) => `<i class="${index === 0 ? 'now' : ''}" title="${escapeHtml(unit.codename)}">${escapeHtml(unit.portrait)}</i>`).join('')}<em>→</em>${(state.boss.summons || []).filter(enemy => enemy.alive).slice(0, 2).map(() => '<i class="enemy-small">♟</i>').join('')}<i class="boss">Ω</i>`;
  const orderedQueue = Array.isArray(state.actionQueue) && state.actionQueue.length
    ? state.actionQueue.filter(entry => entry.alive !== false).map(entry => {
      const actor = entry.actorType === 'enemy'
        ? state.enemies?.find(enemy => enemy.id === entry.actorId)
        : state.party.find(unit => unit.id === entry.actorId);
      const isBoss = entry.actorId === state.boss.id;
      const classes = [entry.actorType === 'enemy' ? (isBoss ? 'boss' : 'enemy-small') : '', entry.done ? 'done' : '', entry.current ? 'now' : '', entry.pending ? 'pending' : ''].filter(Boolean).join(' ');
      const glyph = entry.actorType === 'enemy' ? (isBoss ? 'Ω' : '♟') : (entry.portrait || actor?.portrait || '?');
      return `<i class="${classes}" title="${escapeHtml(entry.name || actor?.codename || actor?.name || entry.actorId)}">${escapeHtml(glyph)}</i>`;
    }).join('')
    : fallbackQueue;
  const weakenedBossTurnLabel = `${state.weakenedTurnsLeft} BOSS TURN${state.weakenedTurnsLeft === 1 ? '' : 'S'}`;
  const recordedStateLabel = state.boss.modeId === 'nexus'
    ? state.weakened ? `WEAKENED ${state.weakenedTurnsLeft} LEFT` : state.boss.breakPending ? 'HP LOCK REACHED' : 'HP LOCK'
    : state.boss.modeId === 'devourer'
      ? state.weakened ? `WEAKENED ${weakenedBossTurnLabel} · 3X` : `LIFE SUSTAINMENT ${state.boss.lifeSustainment ? 'ON' : 'OFF'}`
      : 'MULTIDIMENSIONAL: PROVISIONAL';
  const dreamscapePreview = state.scoreBreakdown?.model === 'multidimensional_dreamscape_preview';
  const previewDamage = Number(state.scoreBreakdown?.damagePreview ?? state.totalDamage ?? 0);
  return `<div class="battle-topbar">
    <div class="turn-box"><span>${state.navigator.virtualConcert?.active ? 'VIRTUAL CONCERT' : 'ATTACK TURNS LEFT'}</span><b>${state.navigator.virtualConcert?.active ? state.navigator.virtualConcert.roundsRemaining : String(state.attackTurnsLeft).padStart(2, '0')}</b><small>${state.navigator.virtualConcert?.active ? 'EXTRA TURNS LEFT' : `TURN ${state.attackTurn}`}</small></div>
    <div class="queue" aria-label="Action queue"><span>ACTION ORDER</span>${orderedQueue}<div class="action-counter"><span>ACTIONS</span><b>${state.turnActionsUsed}/${state.turnActionsTotal}</b></div></div>
    <div class="score-box ${dreamscapePreview ? 'damage-preview' : ''}"><span>${dreamscapePreview ? 'SIMULATED DAMAGE' : 'TOTAL SCORE'}</span><b>${format(dreamscapePreview ? previewDamage : state.score)}</b><small>${dreamscapePreview ? 'DAMAGE PREVIEW ONLY · NO MODE SCORE CONVERSION' : state.boss.scoreModel === 'recorded_nightmare' ? `${recordedStateLabel} · ×${state.boss.difficultyBonus}` : `${format(state.totalDamage)} DMG · ×${state.boss.roleScoreMultiplier || state.boss.scoreMultiplier}`}</small></div>
  </div>`;
}

function scoreEvidenceMarkup(state) {
  if (state.boss.modeId !== 'multidimensional') return '';
  const evidence = state.boss.scoreEvidence || state.scoreEvidence || state.scoreBreakdown?.evidence;
  const preview = state.scoreBreakdown?.model === 'multidimensional_dreamscape_preview';
  const previewDamage = Number(state.scoreBreakdown?.damagePreview ?? state.totalDamage ?? 0);
  const observedResult = evidence?.observedRun?.result || evidence?.result || evidence || {};
  const observedNumber = key => observedResult[key] == null ? null : Number(observedResult[key]);
  const foeDefensePoints = observedNumber('foeDefensePoints');
  const turnsSurvivedBonus = observedNumber('turnsSurvivedBonus');
  const difficultyBonus = observedNumber('difficultyBonus');
  const finalScore = observedNumber('finalScore');
  const hasFormula = [foeDefensePoints, turnsSurvivedBonus, difficultyBonus, finalScore].every(Number.isFinite)
    && finalScore === (foeDefensePoints + turnsSurvivedBonus) * difficultyBonus;
  const observed = hasFormula
    ? `Verified observed result formula: (${format(foeDefensePoints)} Foe Defense Points + ${format(turnsSurvivedBonus)} Turns Survived Bonus) x ${format(difficultyBonus)} = ${format(finalScore)}.`
    : 'Verified observed result formula reference is unavailable for this state.';
  const status = evidence?.resultFormula?.status || evidence?.status || evidence?.evidenceStatus || (hasFormula ? 'observed result screen' : 'formula unavailable');
  const limitation = evidence?.resultFormula?.limitation || 'The point accumulator and ending rule are not validated for simulation. Attack Turns Left reaching 0 did not end the observed battle.';
  const previewNotice = preview
    ? `<section class="score-evidence provisional"><b>SIMULATED DAMAGE PREVIEW</b><p>${format(previewDamage)} damage is the simulation output. It is not a Dreamscape score or a difficulty-converted result.</p><small>${escapeHtml(String(state.scoreBreakdown?.evidenceStatus || 'damage_preview_only').replaceAll('_', ' ').toUpperCase())}. ${escapeHtml(state.boss.previewLimitNote || 'The preview boundary is not a verified live game-end trigger.')}</small></section>`
    : '';
  return `${previewNotice}<section class="score-evidence observed-reference"><b>VERIFIED OBSERVED RESULT REFERENCE</b><p>${escapeHtml(observed)}</p><small>${escapeHtml(String(status).replaceAll('_', ' ').toUpperCase())}. ${escapeHtml(limitation)}</small></section>`;
}

function logMarkup(state, replay = false) {
  const events = [...(replay ? replayEvents(state) : state.log)].reverse();
  return `<aside class="battle-log" aria-label="Battle log">
    <div class="log-header"><div><span class="live-dot"></span><b>BATTLE LOG</b></div><button data-log-detail class="${ui.logDetail ? 'active' : ''}" title="Calculation detail">ƒx</button></div>
    <div class="log-scroll" id="battle-log-scroll" role="log">
      ${events.map((event, index) => `<div class="log-line ${event.tone || ''}">
        <span>${String(events.length - index).padStart(2, '0')}</span><p>${escapeHtml(event.message)}${ui.logDetail && event.calculation ? `<small>DEF ${event.calculation.defense} · ×${event.calculation.multiplier.toFixed(2)}</small>` : ''}</p>
      </div>`).join('')}
    </div>
    <div class="log-footer"><span>SEED #${ui.engine?.initialSeed || ui.seed}</span><b>EVENTS ${events.length}</b></div>
  </aside>`;
}

function moveButton(action, recommendation) {
  const skill = action.skill || { element: 'support', slot: action.type === 'kotone_cold' ? 'COLD' : 'FREE', note: action.type === 'kotone_link' ? 'Choose a different living ally. Reselection resets Lunar Bond.' : action.type === 'kotone_assist' ? 'One normal action and two extra actions, followed by the linked ultimate and two Cold turns.' : 'Skip this normal turn. No skill cost or Highlight charge.' };
  const recommended = recommendation?.skillId === action.skillId && recommendation?.type === action.type;
  const meta = elementMeta[skill.element] || elementMeta.almighty;
  const cooldownRemaining = Math.max(0, Number(action.cooldownRemaining) || 0);
  const costLabel = cooldownRemaining > 0
    ? `CD ${cooldownRemaining}`
    : action.cost
      ? `${action.cost}<small>SP</small>`
      : action.type === 'gun'
        ? `${ui.engine.actor.ammo}<small>AMMO</small>`
        : 'FREE';
  const detail = action.enabled === false ? (action.unavailableReason || action.reason || skill.note || 'Unavailable in this simulation.') : (skill.note || '');
  return `<button class="move-button ${recommended ? 'recommended' : ''} ${cooldownRemaining > 0 ? 'on-cooldown' : ''}" data-action-type="${action.type}" data-skill="${action.skillId}" ${!action.enabled ? 'disabled' : ''} style="--move:${meta.color}">
    ${recommended ? '<span class="recommend-flag">AI PICK</span>' : ''}
    <span class="move-slot">${escapeHtml(skill.slot || 'HL')}</span>
    <span class="move-icon">${meta.glyph}</span>
    <span class="move-copy"><b>${escapeHtml(action.name)}</b><small>${escapeHtml(detail)}</small></span>
    <span class="move-cost ${cooldownRemaining > 0 ? 'cooldown' : ''}">${costLabel}</span>
  </button>`;
}

function commandPanel(state) {
  const actor = state.party[state.actorIndex];
  const actions = state.availableActions;
  const recommendation = ui.aiAssist ? ui.engine.recommend() : null;
  if (ui.pendingAction) return targetPanel(state, ui.pendingAction);
  const moves = actions.filter(action => ['skill', 'attack', 'gun', 'cosmic_assemble', 'kotone_link', 'kotone_assist', 'kotone_cold'].includes(action.type));
  const items = actions.filter(action => action.type === 'item');
  return `<section class="command-panel" aria-label="Battle controls">
    <div class="prompt-row">
      <div class="prompt-actor">${portrait(actor)}<div><small>ACTION ${state.turnActionsUsed}/${state.turnActionsTotal}${actor.id === 'wonder' ? ` · ${escapeHtml(ui.engine?.activePersona?.name || '')}` : ''}</small><h2>What will <em>${escapeHtml(actor.codename)}</em> do?</h2></div></div>
      <div class="ai-controls">
        <label class="toggle"><input type="checkbox" data-ai-assist ${ui.aiAssist ? 'checked' : ''}><span></span><b>AI ASSIST</b></label>
        <button class="auto-button ${ui.fullAuto ? 'active' : ''}" data-full-auto>${ui.fullAuto ? '<span class="pulse"></span> AUTO PLAYING' : 'FULL AUTO'}</button>
      </div>
    </div>
    ${cosmicColorControls(actions)}
    <div class="command-tabs">
      <button data-command-tab="moves" class="${ui.commandTab === 'moves' ? 'active' : ''}">MOVES <b>${moves.length}</b></button>
      ${actor.id === 'wonder' ? `<button data-command-tab="personas" class="${ui.commandTab === 'personas' ? 'active' : ''}">PERSONA <b>FREE SELECT</b></button>` : ''}
      ${items.length ? `<button data-command-tab="items" class="${ui.commandTab === 'items' ? 'active' : ''}">ITEM <b>USES A TURN</b></button>` : ''}
      <button data-command-tab="guard" class="${ui.commandTab === 'guard' ? 'active' : ''}">GUARD</button>
    </div>
    <div class="command-body">
      ${ui.commandTab === 'moves' ? `<div class="move-grid">${moves.map(action => moveButton(action, recommendation)).join('')}</div>` : ''}
      ${ui.commandTab === 'personas' ? personaSwitches(actions, state) : ''}
      ${ui.commandTab === 'items' ? itemPanel(items) : ''}
      ${ui.commandTab === 'guard' ? guardAction(actions, actor, recommendation) : ''}
    </div>
    ${recommendation ? `<div class="recommendation"><span>AI</span><p><b>${escapeHtml(recommendation.name)}</b>${escapeHtml(recommendation.reason)}</p><em>${Math.round(recommendation.confidence * 100)}% CONF.</em></div>` : ''}
  </section>`;
}

function personaSwitches(actions, state) {
  return `<div class="switch-grid">${actions.filter(action => action.type === 'switch').map(action => `<button data-action-type="switch" data-skill="${action.skillId}" ${!action.enabled ? 'disabled' : ''}>
    <div class="persona-orb" style="--persona:${elementMeta[action.persona.element]?.color || '#dedede'}">${action.persona.name[0]}</div>
    <div><small>${escapeHtml(action.persona.arcana)} · ${elementMeta[action.persona.element]?.label || escapeHtml(action.persona.element)}</small><b>${escapeHtml(action.persona.name)}</b><span>${escapeHtml(action.persona.trait)}</span></div>
    <em>${action.personaId === state.activePersonaId ? 'ACTIVE' : 'SELECT · FREE →'}</em>
  </button>`).join('')}</div>`;
}

function guardAction(actions, actor, recommendation) {
  const action = actions.find(item => item.type === 'guard');
  return `<button class="guard-card ${recommendation?.type === 'guard' ? 'recommended' : ''}" data-action-type="guard" data-skill="guard" ${!action ? 'disabled' : ''}>
    <span class="shield-mark">⬟</span><div><small>DEFENSIVE ACTION</small><b>Guard</b><p>Take 55% less damage from the next boss attack, recover 12 SP, and gain 8 Highlight.</p></div><em>FREE →</em>
  </button>`;
}

function targetPanel(state, action) {
  const actor = state.party.find(unit => unit.id === action.actorId) || state.party[state.actorIndex];
  const excludesMarian = actor?.slug === 'marian-beachflower'
    && action.type === 'skill'
    && (action.skill?.slot === 'S3' || action.name === 'Gentle Sea Breeze');
  const targets = action.target === 'ally'
    ? state.party.filter(unit => unit.hp > 0 && (!(excludesMarian || action.skill?.excludeSelf) || unit.id !== actor.id) && (action.type !== 'kotone_link' || unit.id !== actor.id && unit.id !== actor.kotone?.linkedId))
    : action.target === 'boss' ? state.enemies : [];
  return `<section class="command-panel target-panel">
    <div class="prompt-row"><div class="prompt-actor">${portrait(actor)}<div><small>${action.skill?.kotoneSkill === 'S3' ? 'SELECT ORIGINAL BUFF CASTER · LINKED ALLY RECEIVES COPIES' : 'SELECT TARGET'}</small><h2>${escapeHtml(action.name)} → <em>choose one</em></h2></div></div><button data-cancel-target>← BACK</button></div>
    <div class="target-grid">${targets.map(target => `<button data-target="${target.id || 'boss'}">
      ${state.enemies.some(enemy => enemy.id === target.id) ? `<div class="mini-boss">${target.id === state.boss.id ? 'Ω' : '♟'}</div>` : portrait(target)}
      <span><small>${state.enemies.some(enemy => enemy.id === target.id) ? `ENEMY · DOWN ${target.downPoints}/${target.downMax}` : 'ALLY'}</small><b>${escapeHtml(target.codename || target.name)}</b><em>${state.weakened && state.boss.modeId === 'devourer' && state.enemies.some(enemy => enemy.id === target.id) ? '∞ WEAKENED · 3X POINTS' : target.finiteHp ? `${format(target.hp)}/${format(target.maxHp)} HP` : target.scoreAttack ? '∞ SCORE TARGET' : `${Math.ceil(pct(target.hp, target.maxHp))}% HP`}</em></span>
    </button>`).join('')}</div>
  </section>`;
}

function highlightInterruptMarkup(action) {
  const cooldown = actionCooldown(action);
  const status = cooldown > 0 ? `CD ${cooldown}` : action.enabled === false ? (action.unavailableReason || 'UNAVAILABLE') : 'READY';
  return `<button class="highlight-interrupt ${cooldown > 0 ? 'on-cooldown' : ''}" data-highlight="${action.skillId}" ${action.enabled === false ? 'disabled' : ''}>
    <span class="nav-signal">HL</span><div><b>${escapeHtml(action.name)}</b><small>${escapeHtml(action.skill.note)}</small></div><em>${escapeHtml(status)}</em>
  </button>`;
}

function sharedHighlightMarkup(highlight) {
  if (highlight?.mode !== 'shared') return '';
  const max = Math.max(1, Number(highlight.max) || 100);
  const current = Math.max(0, Math.min(max, Number(highlight.current) || 0));
  const ready = current >= max;
  const chargeHint = highlight.scalarOverride ? `REPLAY GAIN +${highlight.gain * (highlight.concertActive ? 2 : 1)}% (CUSTOM)`
    : highlight.concertActive ? `CONCERT ACTION +${highlight.concertNormalActionGain}% / WEAKNESS +${highlight.concertWeaknessActionGain}%`
    : Number.isFinite(highlight.normalActionGain) && Number.isFinite(highlight.weaknessActionGain)
      ? `ACTION +${highlight.normalActionGain}% / WEAKNESS +${highlight.weaknessActionGain}%`
      : 'ONE GAUGE FOR THE LIVING PARTY';
  return `<div class="shared-highlight-gauge ${ready ? 'ready' : ''}" aria-label="Party Highlight ${current} of ${max}" title="${escapeHtml(chargeHint)}">
    <div><small>PARTY HIGHLIGHT</small><b>${ready ? 'READY' : 'BUILDING'}</b></div>
    <i><b style="width:${current / max * 100}%"></b></i>
    <strong>${Math.round(current)}<small>/${max}</small></strong>
    <em>${ready ? 'CHOOSE AN AVAILABLE HIGHLIGHT' : escapeHtml(chargeHint)}</em>
  </div>`;
}

function navigatorPanel(state) {
  const mikuStatus = state.navigator.codename === 'MIKU'
    ? `${state.navigator.currentSong} | TRACKS ${state.navigator.tracks.length}/3${state.navigator.virtualConcert?.active ? ` | CONCERT ${state.navigator.virtualConcert.roundsRemaining}` : ''}`
    : state.navigator.ange ? `NOTES ${state.navigator.ange.notes} | DA CAPO ${state.navigator.ange.daCapoUses}`
      : state.navigator.okyann ? `BEATS ${state.navigator.okyann.beats}` : 'Do not consume Actions';
  const supportsDevourerLifeSustainment = state.boss.modeId === 'devourer' && (state.boss.encounter?.soulLink || state.boss.id === 'hachiman');
  return `<section class="navigator-strip ${state.highlight?.mode === 'shared' ? 'with-shared-highlight' : ''}" aria-label="Navigator and Highlight interrupts">
    <div class="navigator-id">${portrait(state.navigator)}<div><small>INTERRUPT ACTIONS</small><b>${escapeHtml(state.navigator.codename)}</b><em>${escapeHtml(mikuStatus)}</em></div></div>
    ${sharedHighlightMarkup(state.highlight)}
    <div class="navigator-actions">${supportsDevourerLifeSustainment ? `<button class="life-sustainment-interrupt ${state.weakened ? 'weakened' : state.boss.lifeSustainment ? 'on' : 'off'}" data-battle-life-sustainment ${ui.fullAuto || state.weakened ? 'disabled' : ''}><span class="nav-signal">HP</span><div><b>${state.weakened ? 'WEAKENED · INFINITE HP' : `LIFE SUSTAINMENT ${state.boss.lifeSustainment ? 'ON' : 'OFF'}`}</b><small>${state.weakened ? `The toggle is locked for ${state.weakenedTurnsLeft} remaining boss turn${state.weakenedTurnsLeft === 1 ? '' : 's'}. Damage points are 3x.` : ui.fullAuto ? 'Stop Full Auto to change this setting.' : state.boss.lifeSustainment ? (state.boss.id === 'hachiman' ? 'Switch off to let Hachiman reach 0 and begin Weakened.' : 'Switch off to let linked HP reach 0 and start Weakened.') : (state.boss.id === 'hachiman' ? 'Switch on to keep Hachiman at 1 HP floor.' : 'Switch on to stop every linked enemy at 1 HP.')}</small></div><em>${state.weakened ? '3X POINTS' : ui.fullAuto ? 'AUTO LOCK' : 'FREE TOGGLE'}</em></button>` : ''}${state.canBreakBoss ? `<button class="break-interrupt" data-break-boss><span class="nav-signal">!</span><div><b>BREAK HP LOCK</b><small>Open the 2-turn Weakened scoring window now.</small></div><em>READY</em></button>` : ''}${state.navigatorActions.map(action => `<button data-navigator="${action.id}" ${!action.enabled ? 'disabled' : ''}>
      <span class="nav-signal">⌁</span><div><b>${escapeHtml(action.name)}</b><small>${escapeHtml(action.unavailableReason || action.note)}</small></div><em>${escapeHtml(action.statusLabel || (action.enabled ? 'READY' : `CD ${action.remaining}`))}</em>
    </button>`).join('')}${state.highlightActions.map(highlightInterruptMarkup).join('')}</div>
  </section>`;
}

function medicinePanel(state) {
  if (!state.medicineActions.length) return '';
  const actor = state.party[state.actorIndex];
  const maximum = Math.max(1, Number(actor.medicinePrescriptionMax) || 2);
  const charges = Math.max(0, Math.min(maximum, Number(actor.midsummerPrescription) || 0));
  return `<section class="medicine-panel" aria-label="Flower Basket Pharmacy, ${charges} of ${maximum} charges">
    <div class="medicine-id"><span>Rx</span><div><small>FREE SPECIAL ACTION</small><b>FLOWER BASKET PHARMACY</b><em>${charges}/${maximum} CHARGES | choose medicine, then ally</em><i>Menu values are base values. Active effects show applied values and remaining duration.</i></div></div>
    <div class="medicine-actions">${state.medicineActions.map(action => {
      return `<button type="button" data-medicine="${action.id}" aria-label="Use ${escapeHtml(medicineName(action))}. Costs 1 medicine charge."><span>Rx</span><div><b>${escapeHtml(medicineName(action))}</b><small>BASE: ${escapeHtml(medicineBaseText(action))}</small><small class="medicine-effective">APPLIED: ${escapeHtml(medicineEffectiveText(action))}</small></div><em>USE 1</em></button>`;
    }).join('')}</div>
  </section>`;
}

function itemPanel(actions) {
  const remaining = actions[0]?.usesRemaining;
  return `<div class="item-panel" aria-label="Battle items">
    <p>Each item uses one turn. Marian's basket charges stay separate.${Number.isFinite(remaining) ? ` <b>${remaining} item uses left.</b>` : ''}</p>
    <div class="medicine-actions">${actions.map(action => `<button type="button" data-action-type="item" data-skill="${escapeHtml(action.itemId || action.skillId)}" ${action.enabled ? '' : 'disabled'} aria-label="Use ${escapeHtml(action.name)}. Uses one turn. ${Number(action.remaining) || 0} in stock.">
      <span>Rx</span><div><b>${escapeHtml(action.name)}</b><small>${escapeHtml(action.unavailableReason || medicineBaseText(action))}</small></div><em>${Number(action.remaining) || 0} LEFT</em>
    </button>`).join('')}</div>
  </div>`;
}

function trueDesirePanel(state) {
  const actor = state.party[state.actorIndex];
  if (actor?.slug !== 'j-c') return '';
  const stacks = Math.max(0, Number(actor.trueDesireStacks) || 0);
  const pending = actor.trueDesirePrimed === true;
  const available = !pending && stacks > 0;
  const canActivate = state.canToggleTrueDesire !== false && available && !ui.fullAuto;
  const stateLabel = pending ? 'STORED' : available ? 'READY' : 'USED';
  const controlLabel = ui.fullAuto ? 'AUTO LOCK' : pending ? 'PENDING' : available ? 'ACTIVATE FREE' : 'UNAVAILABLE';
  const nextMask = actor.jcNextMaskSlot || 'S1 OR S2';
  const rechargeProgress = Math.max(0, Math.min(7, Number(actor.trueDesireRechargeProgress) || 0));
  const detail = pending
    ? 'The enhancement is stored for the next Two Masks as One.'
    : available
      ? 'Spend 1 True Desire now to enhance the next Two Masks as One.'
      : 'True Desire returns on every eighth normal Wonder action if spent. Extra turns do not count.';
  return `<section class="true-desire-panel" aria-label="J&C True Desire free action">
    <button type="button" class="true-desire-toggle ${stateLabel.toLowerCase()}" data-true-desire aria-pressed="${pending}" ${canActivate ? '' : 'disabled'}>
      <span class="true-desire-mark">ALT</span><div><small>J&C FREE ALT</small><b>TRUE DESIRE ${stateLabel}</b><em>${detail} Next mask: ${escapeHtml(nextMask)}. True Desire ${stacks}/1 · Normal Wonder actions ${rechargeProgress}/8.</em></div><strong>${controlLabel}</strong>
    </button>
  </section>`;
}

function berryAltPanel(state) {
  const actor = state.party[state.actorIndex];
  const actions = state.availableActions.filter(action => action.type === 'berry_alt');
  if (actor?.slug !== 'berry' || !actions.length) return '';
  const chains = Math.max(0, Number(actor.chainsOfLove) || 0);
  return `<section class="berry-alt-panel" aria-label="Ichigo Double Berry Alt options">
    <div class="berry-alt-id"><span>ALT</span><div><small>ICHIGO FREE MENU</small><b>DOUBLE BERRY</b><em>Each option is usable once. Chain ${chains}: skills unlock at their listed chain count; Highlight is free at 4 chains when ready.</em></div></div>
    <div class="berry-alt-actions">${actions.map(action => {
      const cooldown = actionCooldown(action);
      const unavailableReason = action.unavailableReason || action.reason;
      const status = action.used ? 'USED THIS BATTLE'
        : cooldown > 0 ? `CD ${cooldown}`
          : action.enabled ? (action.skill?.slot === 'HL' ? 'FREE HL' : `${action.cost || 0} SP`)
            : unavailableReason || (chains < Number(action.requiredChains || Infinity) ? `NEEDS ${action.requiredChains || '?'} CHAINS` : action.cost ? `NEEDS ${action.cost} SP` : 'UNAVAILABLE');
      return `<button type="button" data-action-type="berry_alt" data-skill="${action.skillId}" ${action.enabled ? '' : 'disabled'}><span>${escapeHtml(action.skill?.slot || 'ALT')}</span><div><b>${escapeHtml(action.name)}</b><small>${escapeHtml(action.skill?.note || 'One-time Double Berry option.')}</small></div><em>${escapeHtml(status)}</em></button>`;
    }).join('')}</div>
  </section>`;
}

function renderBattle() {
  if (!ui.engine) return renderSetup();
  const state = ui.engine.getObservation();
  if (state.phase === 'results') return renderResults();
  root.innerHTML = `${header('battle')}
    <main class="battle-screen page-enter">
      ${queueMarkup(state)}
      <div class="battle-room">
        <div class="battlefield">
          ${renderBossField(state)}
          ${renderPartyField(state)}
        </div>
        ${logMarkup(state)}
        <div class="control-stack">
          ${commandPanel(state)}
          ${scoreEvidenceMarkup(state)}
          ${limitationsMarkup(state)}
          ${trueDesirePanel(state)}
          ${berryAltPanel(state)}
          ${medicinePanel(state)}
          ${navigatorPanel(state)}
        </div>
      </div>
    </main>`;
  bindCommon();
  bindBattle(state);
  requestAnimationFrame(() => {
    const log = document.querySelector('#battle-log-scroll');
    if (log) log.scrollTop = 0;
  });
}

function bindBattle(state) {
  document.querySelectorAll('[data-command-tab]').forEach(button => button.addEventListener('click', () => { ui.commandTab = button.dataset.commandTab; render(); }));
  document.querySelector('[data-ai-assist]')?.addEventListener('change', event => { ui.aiAssist = event.target.checked; render(); });
  document.querySelector('[data-full-auto]')?.addEventListener('click', () => toggleAuto());
  document.querySelectorAll('[data-action-type]').forEach(button => button.addEventListener('click', () => chooseAction(button.dataset.actionType, button.dataset.skill)));
  document.querySelectorAll('[data-navigator]').forEach(button => button.addEventListener('click', () => executeNavigator(button.dataset.navigator)));
  document.querySelector('[data-break-boss]')?.addEventListener('click', executeBreak);
  document.querySelector('[data-battle-life-sustainment]')?.addEventListener('click', executeLifeSustainmentToggle);
  document.querySelector('[data-true-desire]')?.addEventListener('click', executeTrueDesireToggle);
  document.querySelectorAll('[data-highlight]').forEach(button => button.addEventListener('click', () => chooseHighlight(button.dataset.highlight)));
  document.querySelectorAll('[data-medicine]').forEach(button => button.addEventListener('click', () => {
    ui.pendingAction = state.medicineActions.find(action => action.id === button.dataset.medicine) || null;
    render();
  }));
  document.querySelector('[data-cancel-target]')?.addEventListener('click', () => { ui.pendingAction = null; render(); });
  document.querySelectorAll('[data-target]').forEach(button => button.addEventListener('click', () => executeAction(ui.pendingAction, button.dataset.target)));
  document.querySelector('[data-log-detail]')?.addEventListener('click', () => { ui.logDetail = !ui.logDetail; render(); });
  if (ui.fullAuto && !ui.autoTimer) scheduleAuto();
}

function chooseAction(type, skillId) {
  const action = ui.engine.getAvailableActions().find(candidate => candidate.type === type && candidate.skillId === skillId);
  if (!action) return;
  const needsTarget = action.target === 'ally' || (action.target === 'boss' && ui.engine.enemies.length > 1);
  if (needsTarget) {
    ui.pendingAction = action;
    render();
    return;
  }
  executeAction(action, action.target);
}

function executeAction(action, targetId) {
  if (!action) return;
  try {
    const result = action.type === 'highlight_interrupt'
      ? ui.engine.stepHighlight(action.skillId, targetId)
      : action.type === 'medicine'
      ? ui.engine.stepMedicine(action.id, targetId)
      : ui.engine.step({ type: action.type, skillId: action.skillId, targetId });
    ui.pendingAction = null;
    ui.commandTab = 'moves';
    showEvents(result.events);
  } catch (error) {
    console.error(error);
  }
}

function chooseHighlight(skillId) {
  const action = ui.engine.getHighlightActions().find(candidate => candidate.skillId === skillId);
  if (!action) return;
  if (action.target === 'ally') {
    ui.pendingAction = action;
    render();
    return;
  }
  executeHighlight(skillId);
}

function executeNavigator(skillId) {
  try {
    const result = ui.engine.stepNavigator(skillId);
    showEvents(result.events);
  } catch (error) {
    console.error(error);
  }
}

function executeHighlight(actorOrSkillId) {
  try {
    const action = ui.engine.getHighlightActions().find(candidate => candidate.skillId === actorOrSkillId || candidate.actorId === actorOrSkillId);
    const targetId = action?.target === 'ally'
      ? ui.engine.state.party.filter(unit => unit.hp > 0 && unit.id !== action.actorId).sort((a, b) => b.attack - a.attack)[0]?.id
      : ui.engine.state.boss.id;
    const result = ui.engine.stepHighlight(actorOrSkillId, targetId);
    showEvents(result.events);
  } catch (error) {
    console.error(error);
  }
}

function executeBreak() {
  try {
    const result = ui.engine.stepBreak();
    showEvents(result.events);
  } catch (error) {
    console.error(error);
  }
}

function executeLifeSustainmentToggle() {
  if (ui.fullAuto) return;
  try {
    const enabled = !ui.engine.state.boss.lifeSustainment;
    const result = ui.engine.setLifeSustainment(enabled);
    ui.modeOptions.devourer.lifeSustainment = enabled;
    saveModeOptions(false);
    showEvents(result.events);
  } catch (error) {
    console.error(error);
  }
}

function executeTrueDesireToggle() {
  if (ui.fullAuto) return;
  try {
    const state = ui.engine.getObservation();
    const actor = state.party[state.actorIndex];
    if (actor?.slug !== 'j-c' || actor.trueDesirePrimed || state.canToggleTrueDesire === false) return;
    const result = ui.engine.setTrueDesire(true);
    showEvents(result?.events || []);
  } catch (error) {
    console.error(error);
  }
}

function showEvents(events) {
  const visual = [...events].reverse().find(event => ['damage', 'party_damage', 'heal', 'buff', 'debuff', 'switch', 'down', 'defeat_enemy', 'mechanic', 'break'].includes(event.type));
  if (visual) ui.animation = {
    targetId: visual.targetId,
    amount: visual.amount,
    kind: visual.type === 'party_damage' ? 'damage' : visual.type === 'break' ? 'mechanic' : visual.type,
    critical: visual.critical,
    weakness: visual.weakness,
    label: visual.type === 'switch' ? 'PERSONA SELECTED' : visual.type === 'down' ? 'DOWN!' : visual.type === 'defeat_enemy' ? 'DEFEATED!' : visual.type === 'break' ? 'WEAKENED!' : visual.type === 'mechanic' ? 'DAMAGE WINDOW!' : visual.type === 'buff' ? 'POWER UP' : visual.type === 'debuff' ? 'STATUS!' : ''
  };
  render();
  window.setTimeout(() => { ui.animation = null; render(); }, 700);
}

function toggleAuto() {
  ui.fullAuto = !ui.fullAuto;
  if (!ui.fullAuto) stopAuto();
  render();
}

function scheduleAuto() {
  if (!ui.fullAuto || !ui.engine || ui.engine.state.phase !== 'battle') return;
  ui.autoTimer = window.setTimeout(() => {
    ui.autoTimer = null;
    if (!ui.fullAuto || ui.engine.state.phase !== 'battle') return;
    if (ui.engine.canToggleTrueDesire() && !ui.engine.actor.trueDesirePrimed) {
      const result = ui.engine.setTrueDesire(true);
      showEvents(result.events);
      return;
    }
    const medicine = ui.engine.state.boss.scoreModel === 'recorded_nightmare'
      ? ui.engine.getMedicineActions().find(action => action.id === 'attack_tablet')
      : ui.engine.getMedicineActions().find(action => action.id === 'fighter_salve') || ui.engine.getMedicineActions()[0];
    const recordedNavigatorPlan = { 2: 'Feel the Beat', 3: 'Clear Sound', 4: 'Feel the Beat', 7: 'Showstopper' };
    const navigatorTurns = ui.engine.state.boss.scoreModel === 'recorded_nightmare' ? Object.keys(recordedNavigatorPlan).map(Number) : [1, 4];
    const recordedNavigatorWindow = ui.engine.state.boss.scoreModel !== 'recorded_nightmare'
      || (ui.engine.state.actorIndex === 0 && ui.engine.state.turnActionsUsed === 0);
    const plannedNavigatorName = ui.engine.state.boss.scoreModel === 'recorded_nightmare'
      ? recordedNavigatorPlan[ui.engine.state.attackTurn]
      : null;
    const nav = ui.engine.getNavigatorActions().find(action => action.enabled
      && navigatorTurns.includes(ui.engine.state.attackTurn)
      && (!plannedNavigatorName || action.name === plannedNavigatorName)
      && recordedNavigatorWindow);
    const highlightActions = ui.engine.getHighlightActions();
    const recordedThreshold = actorId => {
      const unit = ui.engine.state.party.find(candidate => candidate.id === actorId);
      if (unit?.id === 'wonder') return 5;
      if (unit?.slug === 'puppet-wavecatcher') return 3;
      if (unit?.slug === 'marian-beachflower') return 2;
      return 7;
    };
    const eligibleRecordedHighlights = highlightActions.filter(action => ui.engine.state.attackTurn >= recordedThreshold(action.actorId));
    const firstRecordedHighlight = eligibleRecordedHighlights[0];
    const highlight = ui.engine.state.boss.scoreModel === 'recorded_nightmare' && firstRecordedHighlight?.skill.jcHighlightMask
      ? eligibleRecordedHighlights.find(action => action.actorId === firstRecordedHighlight.actorId && action.skill.jcHighlightMask === 'mischief') || firstRecordedHighlight
      : ui.engine.state.boss.scoreModel === 'recorded_nightmare' ? firstRecordedHighlight : highlightActions[0];
    const recordedHighlight = ui.engine.state.boss.scoreModel === 'recorded_nightmare' && highlight;
    if (ui.engine.canBreakBoss() && ui.engine.state.attackTurn >= 7) executeBreak();
    else if (medicine) {
      const target = ui.engine.state.boss.scoreModel === 'recorded_nightmare'
        ? ui.engine.state.party.find(unit => unit.slug === 'puppet-wavecatcher') || ui.engine.actor
        : ui.engine.state.party.filter(unit => unit.hp > 0 && unit.id !== ui.engine.actor.id).sort((a, b) => b.attack - a.attack)[0] || ui.engine.actor;
      const result = ui.engine.stepMedicine(medicine.id, target.id);
      showEvents(result.events);
    } else if (recordedHighlight) executeHighlight(highlight.skillId);
    else if (nav) executeNavigator(nav.id);
    else if (highlight && ui.engine.state.boss.scoreModel !== 'recorded_nightmare') executeHighlight(highlight.skillId);
    else {
      const action = ui.engine.recommend();
      if (action) {
        const target = action.target === 'ally'
          ? action.targetId || ui.engine.state.party.filter(unit => unit.hp > 0).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0]?.id
          : (action.targetId || action.target);
        executeAction(action, target);
      }
    }
  }, 850);
}

function stopAuto() {
  ui.fullAuto = false;
  if (ui.autoTimer) window.clearTimeout(ui.autoTimer);
  ui.autoTimer = null;
}

function renderResults() {
  stopAuto();
  const state = ui.engine.getObservation();
  const result = state.result;
  const maxContribution = Math.max(...result.damageByActor.map(row => row.damage), 1);
  const dreamscapePreview = result.preview === true || result.scoreStatus === 'damage_preview_only' || result.scoreBreakdown?.model === 'multidimensional_dreamscape_preview';
  const previewDamage = Number(result.damagePreview ?? result.score ?? result.totalDamage ?? 0);
  const previewBoundary = Number(state.boss.previewAttackTurns || state.boss.turnLimit || 0);
  const previewOutcome = String(result.outcome || 'stopped').replaceAll('_', ' ');
  const previewSummary = result.outcome === 'preview_complete'
    ? `${result.attackTurns}-party-round simulator preview completed at its configured ${previewBoundary}-round boundary. ${state.boss.previewLimitNote || 'This is not a verified live game-end trigger.'}`
    : `Simulation stopped with ${previewOutcome} after ${result.attackTurns} of ${previewBoundary} configured preview rounds. It did not reach a verified live-game ending rule.`;
  const derivation = state.scoreBreakdown?.turnScoreBuckets?.length ? hachimanScoreDerivation(state) : null;
  const previewMetrics = derivation ? `
        <article><span>PROJECTED SCORE</span><b>${format(derivation.projectedFinalScore)}</b><small>(${format(derivation.foeDefensePoints)} + ${format(derivation.survivalBonus)}) x ${derivation.difficultyBonus} · provisional damage inputs</small></article>
        <article><span>FOE DEFENSE POINTS</span><b>${format(derivation.foeDefensePoints)}</b><small>${format(previewDamage)} score-eligible damage weighted by normal turn</small></article>
        <article><span>RECORDED RESULT</span><b>${format(derivation.recordedFinalScore)}</b><small>Live result screen for this route · simulated is ${(derivation.projectedFinalScore / derivation.recordedFinalScore * 100).toFixed(1)}%</small></article>
        <article><span>NAV USES</span><b>${result.navigatorUses}</b><small>Interrupt actions</small></article>` : `
        <article><span>SIMULATED DAMAGE</span><b>${format(previewDamage)}</b><small>Damage preview only. This is not a Dreamscape score.</small></article>
        <article><span>PREVIEW BOUNDARY</span><b>${result.attackTurns}<em>/${state.boss.previewAttackTurns || state.boss.turnLimit}</em></b><small>${escapeHtml(state.boss.previewLimitNote || 'Simulator preview boundary, not a verified game-end trigger.')}</small></article>
        <article><span>MODE CONVERSION</span><b>UNAVAILABLE</b><small>Foe Defense Points and survival bonus are not calculated from this run.</small></article>
        <article><span>NAV USES</span><b>${result.navigatorUses}</b><small>Interrupt actions</small></article>`;
  const resultMetrics = dreamscapePreview ? previewMetrics : state.boss.scoreModel === 'recorded_nightmare' ? `
        <article><span>FINAL SCORE</span><b>${format(result.score)}</b><small>Point buckets ×${result.scoreBreakdown.difficultyBonus}</small></article>
        <article><span>BASE DAMAGE POINTS</span><b>${format(result.scoreBreakdown.baseDamagePoints)}</b><small>${format(result.scoreBreakdown.baseRawDamage)} pre-Weakened damage</small></article>
        <article><span>WEAKENED DAMAGE POINTS</span><b>${format(result.scoreBreakdown.weakenedDamagePoints)}</b><small>${state.boss.modeId === 'devourer' ? '3x damage for 2 boss turns at infinite HP' : `${state.boss.weakenedTurns} Attack Turns after break`}</small></article>
        <article><span>BOSS ATTACK POINTS</span><b>${format(result.scoreBreakdown.bossAttackPoints)}</b><small>${result.attackTurns > state.boss.turnLimit ? `${state.boss.turnLimit} normal turns + ${result.attackTurns - state.boss.turnLimit} granted Weakened turn${result.attackTurns - state.boss.turnLimit === 1 ? '' : 's'}` : `${result.attackTurns}/${state.boss.turnLimit} normal Attack Turns survived`}</small></article>` : `
        <article><span>FINAL SCORE</span><b>${format(result.score)}</b><small>×${state.boss.scoreMultiplier.toFixed(2)} boss modifier</small></article>
        <article><span>TOTAL DAMAGE</span><b>${format(result.totalDamage)}</b><small>${state.boss.finiteHp ? `Finite linked HP · Life Sustainment ${state.boss.lifeSustainment ? 'On' : 'Off'}` : state.boss.scoreAttack ? 'Infinite score target' : `${Math.round((result.totalDamage / state.boss.maxHp) * 100)}% boss HP`}</small></article>
        <article><span>ATTACK TURNS</span><b>${result.attackTurns}<em>/${state.boss.turnLimit}</em></b><small>${state.history.length - 1} resolved decisions</small></article>
        <article><span>NAV USES</span><b>${result.navigatorUses}</b><small>Interrupt actions</small></article>`;
  root.innerHTML = `${header('results')}
    <main class="results-screen page-enter">
      <section class="result-hero ${result.cleared ? 'cleared' : ''} ${dreamscapePreview ? 'preview-result' : ''}">
        <div class="result-stamp"><span>${dreamscapePreview ? 'SIMULATION' : result.cleared ? 'MISSION' : 'RUN'}</span><b>${dreamscapePreview ? 'PREVIEW' : result.cleared ? 'CLEAR' : 'COMPLETE'}</b></div>
        <div><span class="eyebrow">${dreamscapePreview ? 'DAMAGE PREVIEW' : 'BATTLE RESULT'} · SEED #${result.seed}</span><h1>${escapeHtml(state.boss.name)}</h1><p>${dreamscapePreview ? escapeHtml(previewSummary) : result.cleared ? 'The linked enemy group was defeated before the turn limit.' : result.outcome === 'break_window_complete' ? state.boss.modeId === 'devourer' ? 'The infinite HP Weakened window ended after 2 boss turns. The complete scoring rotation is ready for review.' : 'The 2 Attack Turn Weakened window ended. The complete scoring rotation is ready for review.' : state.boss.scoreAttack ? 'Attack Turns exhausted. The complete scoring rotation is ready for review.' : 'Rotation recorded. Use the replay to inspect each decision window.'}</p></div>
        ${dreamscapePreview ? '<div class="grade preview-grade"><span>OUTPUT</span><b>DMG</b></div>' : `<div class="grade"><span>GRADE</span><b>${result.score > 1500000 ? 'S' : result.score > 900000 ? 'A' : 'B'}</b></div>`}
      </section>
      <section class="result-metrics">
        ${resultMetrics}
      </section>
      ${hachimanDerivationMarkup(state)}
      ${scoreEvidenceMarkup(state)}
      ${limitationsMarkup(result, 'results') || limitationsMarkup(state, 'results')}
      <section class="result-body">
        <article class="breakdown-panel"><div class="panel-title"><span>DAMAGE CONTRIBUTION</span><b>BY ACTOR</b></div>
          <div class="damage-bars">${result.damageByActor.map(row => { const unit = state.party.find(item => item.id === row.id) || { name: row.name, codename: row.name, portrait: row.name[0] }; return `<div>${portrait(unit)}<span><b>${escapeHtml(row.name)}</b><i><em style="width:${(row.damage / maxContribution) * 100}%"></em></i></span><strong>${format(row.damage)}<small>${result.totalDamage ? Math.round(row.damage / result.totalDamage * 100) : 0}%</small></strong></div>`; }).join('')}</div>
        </article>
        <article class="rotation-panel"><div class="panel-title"><span>ROTATION</span><b>LAST ACTIONS</b></div>
          <ol>${state.history.slice(-8).map((frame, index) => `<li><span>${String(Math.max(1, state.history.length - 8 + index)).padStart(2, '0')}</span><div><small>ATTACK TURN ${frame.attackTurn || frame.round} · ${frame.turnActionsUsed ?? 0}/${frame.turnActionsTotal ?? 1}</small><b>${escapeHtml(frame.label)}</b></div><em>${format(frame.totalDamage)} DMG</em></li>`).join('')}</ol>
        </article>
      </section>
      <section class="result-actions"><button data-rematch>↻ REMATCH SAME SEED</button><button class="primary" data-replay>▶ WATCH REPLAY</button><button data-new-team>CHANGE TEAM / BOSS</button></section>
    </main>`;
  bindCommon();
  document.querySelector('[data-rematch]')?.addEventListener('click', startBattle);
  document.querySelector('[data-replay]')?.addEventListener('click', () => { ui.screen = 'replay'; ui.replayIndex = 0; render(); });
  document.querySelector('[data-new-team]')?.addEventListener('click', () => { ui.engine = null; ui.screen = 'setup'; render(); });
  requestAnimationFrame(() => window.scrollTo(0, 0));
}

function replayEvents(frame) {
  const limit = ui.engine.state.history.slice(0, ui.replayIndex + 1);
  return limit.flatMap(item => item.events || []);
}

function replayState() {
  const frame = ui.engine.state.history[ui.replayIndex];
  return {
    ...ui.engine.getObservation(),
    round: frame.round, attackTurn: frame.attackTurn, attackTurnsLeft: frame.attackTurnsLeft,
    actorIndex: frame.actorIndex, turnActionsUsed: frame.turnActionsUsed, turnActionsTotal: frame.turnActionsTotal,
    score: frame.score, totalDamage: frame.totalDamage,
    highlight: frame.highlight || null,
    activePersonaId: frame.activePersonaId, party: frame.party, boss: frame.boss,
    weakened: frame.boss.weakenedActive === true,
    weakenedTurnsLeft: Number(frame.boss.weakenedTurnsLeft || 0),
    enemies: [frame.boss, ...(frame.boss.summons || []).filter(enemy => enemy.alive)],
    actionQueue: frame.actionQueue
  };
}

function renderReplay() {
  const state = replayState();
  const frames = ui.engine.state.history;
  root.innerHTML = `${header('replay')}
    <main class="battle-screen replay-screen page-enter">
      ${queueMarkup(state)}
      ${sharedHighlightMarkup(state.highlight)}
      <div class="battle-room">
        <div class="battlefield">${renderBossField(state)}${renderPartyField(state)}</div>
        ${logMarkup(state, true)}
        <section class="replay-controls">
          <div><small>REPLAY</small><b>${escapeHtml(frames[ui.replayIndex].label)}</b></div>
          <button data-replay-first title="First action">|◀</button><button data-replay-prev title="Previous action">◀</button>
          <button class="play" data-replay-play>${ui.replayPlaying ? 'Ⅱ' : '▶'}</button>
          <button data-replay-next title="Next action">▶</button><button data-replay-last title="Last action">▶|</button>
          <input type="range" min="0" max="${frames.length - 1}" value="${ui.replayIndex}" data-replay-range aria-label="Replay position">
          <span>${ui.replayIndex + 1} / ${frames.length}</span><button data-replay-exit>EXIT REPLAY</button>
        </section>
      </div>
    </main>`;
  bindCommon();
  bindReplay(frames.length);
  requestAnimationFrame(() => { const log = document.querySelector('#battle-log-scroll'); if (log) log.scrollTop = 0; });
}

function bindReplay(length) {
  const setIndex = index => { ui.replayIndex = Math.max(0, Math.min(length - 1, index)); render(); };
  document.querySelector('[data-replay-first]')?.addEventListener('click', () => setIndex(0));
  document.querySelector('[data-replay-prev]')?.addEventListener('click', () => setIndex(ui.replayIndex - 1));
  document.querySelector('[data-replay-next]')?.addEventListener('click', () => setIndex(ui.replayIndex + 1));
  document.querySelector('[data-replay-last]')?.addEventListener('click', () => setIndex(length - 1));
  document.querySelector('[data-replay-range]')?.addEventListener('input', event => setIndex(Number(event.target.value)));
  document.querySelector('[data-replay-exit]')?.addEventListener('click', () => { stopReplay(); ui.screen = 'results'; render(); });
  document.querySelector('[data-replay-play]')?.addEventListener('click', () => {
    ui.replayPlaying = !ui.replayPlaying;
    if (!ui.replayPlaying) stopReplay();
    else scheduleReplay(length);
    render();
  });
}

function scheduleReplay(length) {
  if (!ui.replayPlaying) return;
  if (ui.replayIndex >= length - 1) ui.replayIndex = 0;
  ui.replayTimer = window.setTimeout(() => { ui.replayTimer = null; if (!ui.replayPlaying) return; ui.replayIndex += 1; if (ui.replayIndex >= length - 1) ui.replayPlaying = false; render(); if (ui.replayPlaying) scheduleReplay(length); }, 850);
}

function stopReplay() {
  ui.replayPlaying = false;
  if (ui.replayTimer) clearTimeout(ui.replayTimer);
  ui.replayTimer = null;
}

function optionList(items, selected, valueKey = 'name', labelKey = 'name') {
  return items.map(item => `<option value="${escapeHtml(item[valueKey])}" ${item[valueKey] === selected ? 'selected' : ''}>${escapeHtml(item[labelKey])}</option>`).join('');
}

function combatSummary(combat = {}) {
  const rows = [];
  if (combat.attackPercent) rows.push(`ATK +${Math.round(combat.attackPercent * 100)}%`);
  if (combat.damageBonus) rows.push(`Damage +${Math.round(combat.damageBonus * 100)}%`);
  if (combat.hpPercent) rows.push(`HP +${Math.round(combat.hpPercent * 100)}%`);
  if (combat.critRate) rows.push(`Crit +${(combat.critRate * 100).toFixed(1)}%`);
  if (combat.elementBonus) rows.push(`${combat.elementBonus.element.toUpperCase()} +${Math.round(combat.elementBonus.value * 100)}%`);
  if (combat.weakElementAttack) rows.push(`ATK +${Math.round(combat.weakElementAttack.value * 100)}% vs ${combat.weakElementAttack.element.toUpperCase()}-weak`);
  if (combat.highlightStart) rows.push(`Start Highlight +${combat.highlightStart}%`);
  return rows.length ? rows : ['Reference only'];
}

function personaSkillOptions(skills, selected, recommendedNames = []) {
  const choices = [...skills];
  const selectedSkill = selected ? skillById.get(selected) : null;
  if (selectedSkill && !choices.some(skill => skill.id === selected)) choices.unshift({ ...selectedSkill, originPersona: 'Current loadout' });
  return `<option value="" ${selected === '' ? 'selected' : ''}>Empty slot</option>${choices.map(skill => {
    const power = skill.combat.power ? ` · ${Math.round(skill.combat.power * 100)}% power` : '';
    const cost = skill.combat.executable ? (skill.cost ? ` · ${skill.cost} SP` : ' · free') : ' · reference only';
    const recommended = recommendedNames.includes(skill.name) || recommendedNames.includes(skill.sourceName) ? '★ ' : '';
    const origin = skill.originPersona ? ` · from ${skill.originPersona}` : '';
    return `<option value="${escapeHtml(skill.id)}" ${skill.id === selected ? 'selected' : ''}>${recommended}${escapeHtml(skill.name)} · ${escapeHtml(skill.element.toUpperCase())}${power}${cost}${escapeHtml(origin)}</option>`;
  }).join('')}`;
}

function personaLoadoutEditor(loadout) {
  return `<section class="build-section persona-builder">
    <div class="build-section-title"><div><span>WILDCARD LOADOUT</span><h3>Edit Persona skills</h3></div><em>${importedPersonas.length} battle-ready Personas</em></div>
    <div class="persona-editor-note"><b>6 EQUIP SLOTS</b><span>Unique and Thief Tactics skills stay fixed. Transferable active and passive skills can fill the six equipment slots. Reference-only skills are saved in the build but do not change battle calculations yet.</span></div>
    <p class="formula-note">J&C A6 is unlocked in this setup: Wonder gains +1 skill and Thief Tactics level even without the twins in the party. Updated per-level values are still needed to include that bonus in calculations.</p>
    <div class="persona-loadout-grid">${loadout.personas.map((slot, slotIndex) => {
      const persona = importedPersonas.find(item => item.id === slot.personaId) || importedPersonas[0];
      const passive = highestRankPersonaPassive(persona);
      const nativeSkills = executableSkills(persona);
      const fixedSkills = fixedPersonaSkills(persona);
      const legalSkills = legalTransferableSkillsForPersona(persona, transferablePersonaSkills);
      const recommendedNames = (persona.recommendedSkills || []).map(item => item.name);
      return `<article class="persona-loadout-card">
        <div class="persona-loadout-head">
          <span class="loadout-slot">P${slotIndex + 1}</span>
          <div class="persona-orb" style="--persona:${elementMeta[persona.element]?.color || '#dedede'}">${persona.name[0]}</div>
          <div><small>${escapeHtml(persona.position || `GRADE ${persona.grade}`)} · ${persona.stars}★</small><b>${escapeHtml(persona.name)}</b><em>${escapeHtml(persona.element.toUpperCase())}</em></div>
        </div>
        <label>PERSONA<select data-persona-select="${slotIndex}">${optionList(importedPersonas, persona.id, 'id')}</select></label>
        <div class="persona-fixed-skills">${fixedSkills.map(skill => `<span><small>${skill.kind === 'highlight' ? 'THIEF TACTICS' : 'UNIQUE'}</small><b>${escapeHtml(skill.name === 'Highlight' ? 'Thief Tactics' : skill.name)}</b></span>`).join('')}</div>
        <div class="skill-slot-list">${Array.from({ length: PERSONA_EQUIP_SLOT_COUNT }, (_, skillIndex) => {
          const current = slot.skillIds[skillIndex] || '';
          return `<label><span>E${skillIndex + 1}</span><select aria-label="${escapeHtml(persona.name)} equipped skill ${skillIndex + 1}" data-persona-skill="${slotIndex}:${skillIndex}">${personaSkillOptions(legalSkills, current, recommendedNames)}</select></label>`;
        }).join('')}</div>
        <p>${escapeHtml(passive?.description || persona.description || 'No passive description available.')}</p>
        <span class="source-badge">LUFELNET · ${nativeSkills.length} NATIVE · ${transferablePersonaSkills.length} TRANSFERABLE</span>
      </article>`;
    }).join('')}</div>
  </section>`;
}

function wonderWeaponEditor(loadout) {
  const weapon = getWonderWeaponDefinition(loadout.weaponId);
  const profile = getWonderWeaponProfile(loadout.weaponId, loadout.weaponProfileId);
  const cursedTiesNote = weapon?.id === 'cursed-ties' && profile?.forge
    ? `<p><b>Verified R6 values:</b> ${format(profile.forge.trigger.chance * 100)}% trigger chance, ${format(profile.forge.evilEye.defenseDown * 100)}% Defense reduction, ${format(profile.forge.evilEye.curseDamageTaken * 100)}% Curse damage taken, ${format(profile.forge.holderAttackAgainstEvilEye * 100)}% Wonder Attack, and ${format(profile.forge.ailmentAccuracyBonus * 100)}% ailment accuracy.</p>`
    : '';
  return `<section class="build-section">
    <div class="build-section-title"><div><span>WONDER'S WEAPON</span><h3>Weapon and passive</h3></div><em>${wonderWeaponDefinitions.length} DATAMINED WEAPONS</em></div>
    <label class="wonder-weapon-picker">WEAPON<select data-wonder-weapon aria-label="Wonder weapon">${wonderWeaponOptions(loadout.weaponId)}</select></label>
    ${profile && weapon ? `<div class="wonder-weapon-details">
      <div class="wonder-weapon-stat-strip"><span>HP <b>${format(profile.weaponStats.maxHp)}</b></span><span>ATTACK <b>${format(profile.weaponStats.attack)}</b></span><span>DEFENSE <b>${format(profile.weaponStats.defense)}</b></span><span>PASSIVE <b>${escapeHtml(weapon.skillName)}</b></span></div>
      <p>${escapeHtml(weapon.effectSummary)}</p>
      ${cursedTiesNote}
      <p class="formula-note">Datamine weapon ID ${escapeHtml(String(weapon.datamineId))}, configured at level 80 and rank 6. ${weapon.runtimeStatus === 'implemented' ? 'This passive has a tested combat adapter.' : weapon.runtimeStatus === 'partial' ? 'High-confidence numeric effects are active. Unresolved timing or targeting rules are listed as combat limitations.' : 'The weapon and stats are selectable now. Its passive is cataloged but is not applied to combat.'} Weapon HP, Attack, and Defense are added in Base Stat Input and automatic-stat mode. Equipped Stats inputs are final equipped totals, so weapon components are not added again.</p>
    </div>` : '<p class="wonder-weapon-empty">Choose a Wonder weapon from the datamined catalog.</p>'}
  </section>`;
}

function cosmicDefaultOptions() {
  return { awareness: 6, sourceTier: 3, weapon: 'none', refinement: 0, staticWeaponStatsIncluded: false };
}

function cosmicBuildEditor(unit, loadout) {
  const options = loadout.cosmicYui ||= cosmicDefaultOptions();
  const select = (key, entries, value) => `<select data-cosmic-option="${key}">${entries.map(([v, label]) => `<option value="${v}" ${String(v) === String(value) ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select>`;
  const tier = Number(options.sourceTier ?? 3);
  const coefficient = key => `${(COSMIC_YUI_COEFFICIENTS[key][tier] * 100).toFixed(1)}%`;
  return `<section class="build-section cosmic-builder">
    <div class="build-section-title"><div><span>COSMIC YUI · CURRENT SOURCE</span><h3>Veggie Knight configuration</h3></div><em>12 SEP 2026</em></div>
    <div class="cosmic-options">
      <label>SOURCE COEFFICIENT COLUMN${select('sourceTier', [0, 1, 2, 3].map(n => [n, `Column ${n + 1} · S3 ${(COSMIC_YUI_COEFFICIENTS.mobilize[n] * 100).toFixed(1)}%`]), tier)}</label>
      <label>WEAPON PASSIVES${select('weapon', [['none', 'None — equipment stats only'], ['signature', COSMIC_YUI_WEAPONS.signature.name], ['four-star', COSMIC_YUI_WEAPONS['four-star'].name]], options.weapon || 'none')}</label>
      <label>REFINEMENT${select('refinement', [0,1,2,3,4,5,6].map(n => [n, `R${n}`]), options.refinement ?? 0)}</label>
    </div>
    <label class="cosmic-equipment-note"><input type="checkbox" data-cosmic-option="staticWeaponStatsIncluded" ${options.staticWeaponStatsIncluded ? 'checked' : ''}> Static weapon passive already included in the stat fields above</label>
    <p class="formula-note">Stat fields are independent inputs. Weapon HP/Attack/Defense components are reference only, not silently added to them. The selected source column supplies final coefficients; awareness does not add an invented level multiplier. Awareness is controlled above. Default coefficient column: 4; weapon: none.</p>
    <div class="character-skill-grid">${[...unit.skills, unit.highlightSkill].map(skill => `<article>${iconFor(skill.element)}<div><small>${escapeHtml(skill.slot)}${skill.freeAction ? ' · FREE ACTION · CD 1' : ''}</small><b>${escapeHtml(skill.name)}</b><p>${escapeHtml(skill.note)}</p></div></article>`).join('')}</div>
    <div class="cosmic-coefficient-strip"><span>S1 <b>${coefficient('harvest')}</b></span><span>S3 BASE <b>${coefficient('mobilize')}</b></span><span>PER KNIGHT <b>${coefficient('knight')}</b></span><span>HAVOC <b>${coefficient('havoc')}</b></span></div>
    <details class="cosmic-source-notes"><summary>Awareness effects & modeling boundaries</summary>${COSMIC_YUI_AWARENESS.map(a => `<p><b>A${a.level} · ${escapeHtml(a.name)}</b><br>${escapeHtml(a.description)}</p>`).join('')}${COSMIC_YUI_LIMITATIONS.map(text => `<p>${escapeHtml(text)}</p>`).join('')}<a href="https://lufel.net/en/character/bui-cosmic/" target="_blank" rel="noopener noreferrer">Open character source</a></details>
  </section>`;
}

function cosmicColorControls(actions) {
  const colors = actions.filter(a => a.type === 'cosmic_color');
  if (!colors.length) return '';
  return `<div class="cosmic-color-controls"><small>VEGETABLE AVATAR · ONE FREE CHOICE AT TURN START</small><div>${colors.map(a => `<button data-action-type="cosmic_color" data-skill="${a.skillId}" ${a.enabled ? '' : 'disabled'}>${escapeHtml(a.name)}</button>`).join('')}</div></div>`;
}

function cosmicMechanicMarkup(unit) {
  const c = unit.cosmicYui;
  if (!c) return '';
  const names = { eggplant: 'EGGPLANT', potato: 'POTATO', mushroom: 'MUSHROOM', asparagus: 'ASPARAGUS', prismatic: 'PRISMATIC', none: 'NO COLOR' };
  return `<div class="cosmic-state" aria-label="Cosmic Yui state"><div><b>${names[c.color] || 'PRISMATIC'}</b><strong>ENERGY ${c.energy}/7</strong></div>
    <div class="cosmic-energy" role="progressbar" aria-label="Veggie Energy" aria-valuenow="${c.energy}" aria-valuemin="0" aria-valuemax="7">${Array.from({length: 7}, (_, i) => `<i class="${i < c.energy ? 'charged' : ''}"></i>`).join('')}</div>
    <div class="cosmic-knights">${['eggplant', 'potato', 'mushroom', 'asparagus'].map(k => `<span title="${names[k]}: ${c.knights[k]}${k === 'potato' && c.seedPotato ? ' regular + 1 protected seed' : ''}"><img src="/assets/characters/cosmic-yui/knight-${k}.svg" alt="${names[k]}"><b>${c.knights[k]}${k === 'potato' && c.seedPotato ? '+1' : ''}</b></span>`).join('')}</div>
    <small>${c.permanentHarvest ? 'HUGE HARVEST · PERMANENT' : c.harvestUntil >= unit.characterTurnsStarted ? 'HUGE HARVEST · ACTIVE' : 'HARVEST INACTIVE'} · A${unit.awareness}</small>
  </div>`;
}

function characterSkillEditor(unit, loadout) {
  if (unit.slug === 'bui-cosmic') return cosmicBuildEditor(unit, loadout);
  if (unit.id === KOTONE_SHIOMI_ID) return kotoneSkillSummary();
  return `<section class="build-section character-skills">
    <div class="build-section-title"><div><span>CHARACTER KIT</span><h3>Imported skill coefficients</h3></div><em>A${awarenessFor(unit)} profile · source values retained</em></div>
    <div class="character-skill-grid">${unit.skills.map(skill => `<article>
      ${iconFor(skill.element)}<div><small>${escapeHtml(skill.slot)} · ${escapeHtml(elementMeta[skill.element]?.label || skill.element)}</small><b>${escapeHtml(skill.name)}</b><p>${escapeHtml(skill.note)}</p></div>
      <label>${unit.skillLevel ? `LV <b>${unit.skillLevel}</b>` : 'BASE KIT'}</label>
    </article>`).join('')}</div>
    <p class="formula-note">Skill coefficients remain the values supplied in this package. Awareness changes sourced base stats and implemented rank conditions, not unverified skill-level coefficients.</p>
  </section>`;
}

function researchedResourceMarkup(unit) {
  const lines = [];
  if (unit.joker) lines.push(['WILL OF REBELLION', `${unit.joker.will}/5${unit.joker.extraActionActive ? ' · EXTRA ACTION' : ''}`]);
  if (unit.rin) lines.push(['MEMORY / SOUP', `${unit.rin.memory} / ${unit.rin.soup}`]);
  if (unit.mona) lines.push(['CHIVALRY', unit.mona.chivalry]);
  if (unit.blitz) lines.push(['LIGHTNING LEGS', unit.blitz.lightningLegsAvailable ? 'READY' : 'LOCKED']);
  if (unit.luce) lines.push(['IMPROV', unit.luce.improv || 'NONE']);
  if (unit.crow) lines.push(['RECORDED DAMAGE', format(unit.crow.recordedDamage || 0)]);
  if (unit.turbo) lines.push(['VELOCITY / TORQUE', `${unit.turbo.velocity} / ${unit.turbo.torqueLevel || 0}`]);
  if (unit.violet) lines.push(['LEAD / FOLLOW STEPS', `${unit.violet.leadSteps || 0} / ${unit.violet.followStep || 0}`]);
  if (unit.howler) lines.push(['WELCOME / FOLLOW-UP', `${unit.howler.bigWelcome} / ${unit.howler.furrocious}`]);
  if (unit.frostgale) lines.push([unit.frostgale.mode.toUpperCase(), `VESTIGES ${unit.frostgale.vestiges}`]);
  if (unit.noir) lines.push(['THOUGHTFUL ROUNDS', unit.noir.thoughtfulRounds.length]);
  if (unit.akihikoWeapon) lines.push(['GRIT / METTLE', `${unit.gritStacks}/${unit.gritMax} / ${unit.mettleStacks}/${unit.mettleMax}`]);
  return lines.map(([label, value]) => `<div class="mechanic-chip"><b>${escapeHtml(label)}</b><em>${escapeHtml(value)}</em></div>`).join('');
}

function researchedOptionsEditor(unit, loadout) {
  const module = characterModuleFor(unit);
  if (!module?.mechanics || unit.slug === 'bui-cosmic') return '';
  const options = loadout.characterResearch || {};
  const select = (key, entries, selected) => `<select data-character-option="${key}">${entries.map(([value, label]) => `<option value="${value}" ${String(value) === String(selected) ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select>`;
  const weapons = importedWeapons.filter(weapon => weapon.characterSlug === unit.slug && ['four-star', 'signature'].includes(weapon.category) && weapon.sourceKey.endsWith('-1'));
  const weaponEntries = [['none', 'None'], ...weapons.map(weapon => [weapon.category, `${weapon.rarity}-star - ${weapon.name}`])];
  const selectedWeapon = weapons.find(weapon => weapon.category === options.weapon);
  return `<section class="build-section"><div class="build-section-title"><h3>Researched mechanics options</h3></div>
    <label>SOURCE COEFFICIENT COLUMN${select('sourceTier', [0,1,2,3].map(value => [value, `Column ${value + 1}`]), options.sourceTier ?? (module.definition ? 0 : 3))}</label>
    ${weapons.length ? `<label>WEAPON EFFECTS${select('weapon', weaponEntries, options.weapon || 'none')}</label>
    <label>REFINEMENT${select('refinement', [0,1,2,3,4,5,6].map(value => [value, `R${value}`]), options.refinement ?? 0)}</label>
    <label><input type="checkbox" data-character-option="staticWeaponStatsIncluded" ${options.staticWeaponStatsIncluded ? 'checked' : ''}> Static weapon passive already included in entered stats</label>
    ${selectedWeapon ? `<article class="active-formula"><small>${escapeHtml(selectedWeapon.skillName || 'WEAPON EFFECT')}</small><b>HP ${format(selectedWeapon.stats.maxHp)} - ATK ${format(selectedWeapon.stats.attack)} - DEF ${format(selectedWeapon.stats.defense)}</b><p>${escapeHtml(selectedWeapon.description)}</p></article>` : ''}` : ''}
    <p class="formula-note">Coefficient columns are separate from awareness. Weapon names, component stats, and descriptions come from the mined source. Only tested weapon effects are applied to battle formulas.</p></section>`;
}

function jcMaskEditor(loadout) {
  const masks = [
    ['mischief', 'Mischief & Innocence', 'Fire + Ice'],
    ['service', 'Service & Admonition', 'Electric + Wind'],
    ['absurdity', 'Absurdity & Nonsense', 'Psychic + Nuclear'],
    ['luck', 'Luck & Loss', 'Bless + Curse']
  ];
  if (!Array.isArray(loadout.jcMasks) || loadout.jcMasks.length !== 2) loadout.jcMasks = ['mischief', 'absurdity'];
  return `<section class="build-section jc-mask-builder">
    <div class="build-section-title"><div><span>VIRTUOSO LOADOUT</span><h3>Choose active S1 and S2</h3></div><em>Locked once battle starts</em></div>
    <div class="jc-mask-grid">${masks.map(([id, name, elements]) => {
      const slotIndex = loadout.jcMasks.indexOf(id);
      return `<button data-jc-mask="${id}" class="${slotIndex >= 0 ? 'active' : ''}"><small>${elements}</small><b>${name}</b><span>${slotIndex >= 0 ? `ACTIVE S${slotIndex + 1}` : 'SELECT AS S2'}</span></button>`;
    }).join('')}</div>
    <p class="formula-note">J&C starts with the locked pair and can open with either active S1 or active S2. After that choice, the opposite slot is required. Two Masks as One is not a manual action. At A1 it fires automatically as soon as both Facades are ready.</p>
  </section>`;
}

function baseStatsEditor(unit, loadout) {
  const sourceScale = ui.selectedBoss === 'hachiman' && ['devourer', 'multidimensional'].includes(ui.selectedMode);
  const unitDefaults = awarenessStatDefaults(unit, awarenessFor(unit), { sourceScale });
  const defaults = {
    maxHp: Math.round(unitDefaults.maxHp || 1), maxSp: Math.round(unitDefaults.maxSp || 0), attack: Math.round(unitDefaults.attack || 0),
    defense: Math.round(unitDefaults.defense || 0), speed: Math.round(unitDefaults.speed || 100), critRate: Math.round((unit.crit || 0) * 1000) / 10,
    critMult: Math.round((unit.critMult || 1.5) * 1000) / 10,
    spRecovery: Math.round(Number(unit.sourceStats?.awake7?.sp_recover ?? 100) * 10) / 10,
    technicalPrecision: 0, pierceRate: 0, downPoints: 0, ailmentAccuracy: 0,
    ailmentResistance: 0, damageBonus: 0, damageReduction: 0
  };
  loadout.baseStats ||= {};
  const fields = [
    ['maxHp', 'MAX HP', 1, 999999, 1], ['maxSp', 'MAX SP', 0, 9999, 1], ['attack', 'ATTACK', 0, 99999, 1],
    ['defense', 'DEFENSE', 0, 99999, 1], ['speed', 'SPEED', 0, 9999, 1], ['critRate', 'CRIT RATE %', 0, 95, .1],
    ['critMult', 'CRIT MULT. %', 100, 999, .1], ['spRecovery', 'SP RECOVERY %', 0, 500, .1],
    ['technicalPrecision', 'TECHNICAL PRECISION', 0, 99999, 1], ['pierceRate', 'PIERCE RATE %', 0, 100, .1],
    ['downPoints', 'DOWN POINTS', 0, 99, 1], ['ailmentAccuracy', 'AILMENT ACC. %', 0, 999, .1],
    ['ailmentResistance', 'AILMENT RESIST. %', 0, 100, .1], ['damageBonus', 'DAMAGE MULT. + %', 0, 999, .1],
    ['damageReduction', 'DAMAGE DOWN %', 0, 100, .1]
  ];
  return `<section class="build-section base-stat-builder">
    <div class="build-section-title"><div><span>${loadout.statsMode === 'equipped' ? 'EQUIPPED STATS' : 'BASE STAT INPUT'}</span><h3>Exact character stats</h3></div><em>${loadout.statsPresetId === ichigoStatsPreset.id ? 'Your saved Ichigo totals' : 'Blank = automatic rank default'}</em></div>
    <div class="base-stat-grid">${fields.map(([key, label, min, max, step]) => `<label>${label}<input type="number" min="${min}" max="${max}" step="${step}" value="${loadout.baseStats[key] ?? ''}" placeholder="${defaults[key]}" data-base-stat="${key}"></label>`).join('')}</div>
    <p class="formula-note">${loadout.statsMode === 'equipped' ? 'These are your equipped character-detail totals, including equipment bonuses. Revelation bonuses already included in these values are not added again. Battle buffs still apply.' : 'Blank fields use the selected awareness’s sourced defaults where available. Entered values override them and are never silently changed by an awareness selection. Revelation percentages apply afterward.'} Ailment accuracy and resistance are saved for reference; their chance formulas are not yet modeled.</p>
  </section>`;
}

function coverageNotice(unit) {
  const coverage = coverageFor(unit);
  if (!coverage) return '';
  const research = characterModuleFor(unit)?.research;
  const items = values => `<ul>${(values || []).map(value => `<li>${escapeHtml(typeof value === 'string' ? value : JSON.stringify(value))}</li>`).join('')}</ul>`;
  const sourceLinks = (research?.sources || []).map(source => {
    const url = typeof source === 'string' ? source : source.url || source.pageUrl;
    if (!url || !/^https?:\/\//i.test(url)) return '';
    return `<li><a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(typeof source === 'string' ? source : source.title || source.label || url)}</a></li>`;
  }).join('');
  const details = research ? `<details><summary>Character research and implementation details</summary>
    <p><b>Implemented</b></p>${items(research.implemented)}
    <p><b>Remaining mechanics and verification</b></p>${items(research.missing)}${items(research.limitations)}
    ${sourceLinks ? `<p><b>Sources</b></p><ul>${sourceLinks}</ul>` : ''}</details>` : '';
  return `<section class="coverage-notice ${coverage.kind}"><b>${escapeHtml(coverage.label)}</b><p>${escapeHtml(coverage.detail)} Source-modeled mechanics still require live-battle validation.</p>${details}</section>`;
}

function renderBuilds() {
  const team = selectedTeam();
  const unit = buildableCharacters.find(item => item.id === ui.buildCharacterId) || team[0] || roster[0];
  const navBuild = isNavigatorBuild(unit);
  const loadout = ensureLoadout(unit.id);
  const main = unit.id === 'wonder' || navBuild ? null : (revelationMains.find(item => item.name === loadout.revelationMain) || revelationMains[0]);
  const compatibleSets = main ? revelationSets.filter(set => main.compatibleSubs.includes(set.name)) : [];
  const set = main ? (compatibleSets.find(item => item.name === loadout.revelationSet) || compatibleSets[0] || revelationSets[0]) : null;
  if (set && set.name !== loadout.revelationSet) { loadout.revelationMain = main.name; loadout.revelationSet = set.name; saveLoadouts(); }
  root.innerHTML = `${header('builds')}<main class="builds-screen page-enter">
    <section class="secondary-hero build-hero"><span class="eyebrow">LOADOUT WORKSHOP</span><h1>Builds & awareness</h1><p>${buildableCharacters.length} existing entries · independent A0–A6 profiles · saved locally</p></section>
    <section class="build-workspace">
      <aside class="character-rail full-roster-rail" aria-label="Choose character">
        <label class="build-search-label">ALL ${buildableCharacters.length} CHARACTERS<input type="search" data-build-search aria-label="Search builds" placeholder="Search characters…" value="${escapeHtml(ui.buildSearch)}"></label>
        <div class="build-roster-list">${buildableCharacters.map(member => `<button data-build-character="${member.id}" data-build-search-text="${escapeHtml(`${member.codename} ${member.name}`.toLowerCase())}" class="${member.id === unit.id ? 'active' : ''}" ${`${member.codename} ${member.name}`.toLowerCase().includes(ui.buildSearch.toLowerCase()) ? '' : 'hidden'}>${portrait(member)}<span><small>${isNavigatorBuild(member) ? 'NAVIGATOR' : ui.teamIds.includes(member.id) ? 'IN PARTY' : escapeHtml(member.role)}</small><b>${escapeHtml(member.codename)}</b></span><em>A${awarenessFor(member)}</em></button>`).join('')}</div>
      </aside>
      <div class="build-editor">
        <header class="build-editor-head">${portrait(unit, 'large')}<div><span>${escapeHtml(navBuild ? 'Navigator' : unit.role)} · ${escapeHtml(elementMeta[unit.element]?.label || unit.element || 'Support')}</span><h2>${escapeHtml(unit.codename)}</h2><p>${unit.id === 'wonder' ? 'Equip three Personas and choose their battle-ready skills.' : unit.id === KOTONE_SHIOMI_ID ? 'Configure awareness, skill Mindscape, weapons and the ordinary Global profile.' : navBuild ? 'Configure this navigator’s independent awareness profile.' : 'Configure awareness and this character’s existing build.'}</p></div><button data-reset-build>RESET BUILD</button></header>
        ${unit.id === KOTONE_SHIOMI_ID ? '' : awarenessEditor(unit, loadout)}
        ${coverageNotice(unit)}
        ${unit.id === KOTONE_SHIOMI_ID ? kotoneBuildEditor(loadout) : ''}
        ${baseStatsEditor(unit, loadout)}
        ${researchedOptionsEditor(unit, loadout)}
        ${navBuild ? characterSkillEditor(unit, loadout) : unit.id === 'wonder' ? `${wonderWeaponEditor(loadout)}${personaLoadoutEditor(loadout)}` : `<section class="build-section revelation-builder">
          <div class="build-section-title"><div><span>REVELATION LOADOUT</span><h3>Main & four-piece set</h3></div><em>${lufelCatalog.counts.revelationMains} mains · ${lufelCatalog.counts.revelationSets} sub-sets</em></div>
          <div class="revelation-controls">
            <label>MAIN REVELATION<select data-revelation-main>${optionList(revelationMains, main.name)}</select></label><span class="set-link">＋</span>
            <label>SUB-SET<select data-revelation-set>${optionList(compatibleSets.length ? compatibleSets : revelationSets, set.name)}</select></label>
            <div class="active-formula"><small>ACTIVE STRUCTURED EFFECTS</small>${combatSummary(set.combat).map(text => `<b>${escapeHtml(text)}</b>`).join('')}${main.name === 'Trust' && set.name === 'Prosperity' ? '<b>Ally skill: party damage +8% for 2 rounds (live profile)</b>' : ''}${main.name === 'Nativity' && set.name === 'Strife' ? '<b>Battle start / extra action: party crit damage +10%, permanent, max 2 stacks (live profile)</b>' : ''}</div>
          </div>
          <div class="revelation-effects"><article><span>2-PIECE</span><p>${escapeHtml(set.set2)}</p></article><article><span>4-PIECE</span><p>${escapeHtml(set.set4)}</p></article><em>${Object.keys(set.combat).length ? 'SUPPORTED VALUES APPLY IN BATTLE' : 'REFERENCE ONLY — NOT APPLIED TO FORMULAS'}</em></div>
        </section>${unit.slug === 'j-c' ? jcMaskEditor(loadout) : ''}${characterSkillEditor(unit, loadout)}`}
      </div>
    </section>
    <section class="build-footer"><div><span class="live-dot"></span><p><b>AUTO-SAVED LOCALLY</b><small>Builds are included in new deterministic encounters.</small></p></div><button data-build-to-team>← TEAM PREVIEW</button><button class="primary" data-build-to-battle>ENTER BATTLE →</button></section>
  </main>`;
  bindCommon();
  if (unit.id === KOTONE_SHIOMI_ID) bindKotoneBuild(root, loadout, () => { ui.engine = null; saveLoadouts(); render(); });
  document.querySelectorAll('[data-build-character]').forEach(button => button.addEventListener('click', () => { ui.buildCharacterId = button.dataset.buildCharacter; render(); }));
  document.querySelectorAll('[data-character-option]').forEach(input => input.addEventListener('change', () => {
    const options = loadout.characterResearch ||= {};
    options[input.dataset.characterOption] = input.type === 'checkbox' ? input.checked : ['sourceTier', 'refinement'].includes(input.dataset.characterOption) ? Number(input.value) : input.value;
    ui.engine = null;
    saveLoadouts(); render();
  }));
  document.querySelector('[data-build-search]')?.addEventListener('input', event => {
    ui.buildSearch = event.target.value;
    const query = ui.buildSearch.trim().toLowerCase();
    document.querySelectorAll('[data-build-search-text]').forEach(button => { button.hidden = !button.dataset.buildSearchText.includes(query); });
  });
  document.querySelector('[data-revelation-main]')?.addEventListener('change', event => {
    loadout.revelationMain = event.target.value;
    const nextMain = revelationMains.find(item => item.name === loadout.revelationMain);
    loadout.revelationSet = nextMain?.compatibleSubs[0] || revelationSets[0].name;
    saveLoadouts(); render();
  });
  document.querySelector('[data-revelation-set]')?.addEventListener('change', event => { loadout.revelationSet = event.target.value; saveLoadouts(); render(); });
  document.querySelector('[data-wonder-weapon]')?.addEventListener('change', event => {
    setWonderWeaponSelection(loadout, event.target.value);
    saveLoadouts(); render();
  });
  document.querySelectorAll('[data-persona-select]').forEach(select => select.addEventListener('change', () => {
    const slotIndex = Number(select.dataset.personaSelect); const persona = importedPersonas.find(item => item.id === select.value);
    loadout.personas[slotIndex] = { personaId: persona.id, skillIds: defaultPersonaSkillIds(persona, transferablePersonaSkills) };
    saveLoadouts(); render();
  }));
  document.querySelectorAll('[data-persona-skill]').forEach(select => select.addEventListener('change', () => {
    const [slotIndex, skillIndex] = select.dataset.personaSkill.split(':').map(Number);
    const skillIds = loadout.personas[slotIndex].skillIds;
    if (select.value) skillIds.forEach((id, index) => { if (index !== skillIndex && id === select.value) skillIds[index] = ''; });
    skillIds[skillIndex] = select.value;
    saveLoadouts(); render();
  }));
  document.querySelectorAll('[data-jc-mask]').forEach(button => button.addEventListener('click', () => {
    const mask = button.dataset.jcMask;
    if (loadout.jcMasks.includes(mask)) return;
    loadout.jcMasks = [loadout.jcMasks[1], mask];
    ui.engine = null;
    saveLoadouts(); render();
  }));
  document.querySelectorAll('[data-base-stat]').forEach(input => input.addEventListener('input', () => {
    if (input.value.trim() === '') {
      delete loadout.baseStats[input.dataset.baseStat];
      ui.engine = null;
      saveLoadouts();
      return;
    }
    const min = Number(input.min); const max = Number(input.max);
    const value = Math.min(max, Math.max(min, Number(input.value)));
    loadout.baseStats[input.dataset.baseStat] = value;
    input.value = value;
    ui.engine = null;
    saveLoadouts();
  }));
  document.querySelectorAll('[data-cosmic-option]').forEach(input => input.addEventListener('change', () => {
    loadout.cosmicYui ||= cosmicDefaultOptions();
    const key = input.dataset.cosmicOption;
    loadout.cosmicYui[key] = input.type === 'checkbox' ? input.checked : ['awareness', 'refinement', 'sourceTier'].includes(key) ? Number(input.value) : input.value;
    ui.engine = null;
    saveLoadouts(); render();
  }));
  document.querySelector('[data-reset-build]')?.addEventListener('click', () => { ui.loadouts[unit.id] = defaultLoadoutFor(unit.id); ui.engine = null; saveLoadouts(); render(); });
  document.querySelector('[data-build-to-team]')?.addEventListener('click', () => { ui.screen = 'setup'; render(); window.scrollTo(0, 0); });
  document.querySelector('[data-build-to-battle]')?.addEventListener('click', startBattle);
}

function optimizerScope(search) {
  const metadata = search.metadata || search.searchConfig || search.config || {};
  const searchConfig = search.search || {};
  const team = metadata.fixedTeam || metadata.team || metadata.teamIds || search.team || search.teamIds;
  const seed = searchConfig.battleSeed ?? searchConfig.searchSeed ?? metadata.seed ?? search.seed;
  return {
    team: `${Array.isArray(team) ? team.join(' / ') : (team || 'Fixed recorded benchmark team')}${metadata.navigator ? ` / Navigator: ${metadata.navigator}` : ''}`,
    seed: seed ?? 'Fixed search seed',
    policy: searchConfig.generations ? `${searchConfig.generations} search rounds, ${searchConfig.populationSize} candidates per round` : 'Saved rotation search',
    profile: metadata.mechanicsProfile || metadata.profile || 'recorded-2026-08-29',
    currentProfile: 'live-2026-09-04'
  };
}

function optimizerRotationRows(search) {
  const rotation = search.optimized?.rotation || search.optimized?.candidate?.rotation || [];
  const entries = Array.isArray(rotation) ? rotation : rotation.actions || rotation.steps || [];
  const groups = new Map();
  entries.forEach((entry, index) => {
    const turn = entry.attackTurn ?? entry.attack_turn ?? entry.turn ?? 'Extra actions';
    const label = entry.label || entry.actionName || entry.skillName || entry.action || entry.skillId || entry.action?.skillId || entry.type || `Action ${index + 1}`;
    const actor = entry.actorName || entry.actor || entry.actorId || '';
    const targetIds = entry.targetIds || entry.targetId || entry.target;
    const target = entry.targetName || (Array.isArray(targetIds) ? targetIds.map(optimizerFriendlyId).join(', ') : optimizerFriendlyId(targetIds)) || '';
    const contextKey = entry.actionContext || entry.context || '';
    const context = ({ normal: '', 'concert-start': 'Concert begins', 'concert-1': 'Concert round 1', 'concert-2': 'Concert round 2' })[contextKey] ?? contextKey;
    const detail = entry.note || target;
    const group = groups.get(turn) || [];
    group.push({ label, actor, detail, context, freeAction: entry.freeAction === true });
    groups.set(turn, group);
  });
  return [...groups.entries()].map(([turn, rows]) => `<section class="optimizer-turn"><h3>${turn === 'Extra actions' ? 'EXTRA ACTIONS' : `ATTACK TURN ${escapeHtml(turn)}`}</h3><ol>${rows.map(row => `<li><b>${escapeHtml(row.actor || 'System')}</b><span>${escapeHtml(row.label)}${row.context ? `<em class="optimizer-action-context">${escapeHtml(row.context)}</em>` : ''}${row.freeAction ? '<em class="optimizer-free-action">FREE</em>' : ''}</span>${row.detail ? `<small>${escapeHtml(row.detail)}</small>` : ''}</li>`).join('')}</ol></section>`).join('') || '<p class="optimizer-empty">The saved result does not include a rotation trace.</p>';
}

function optimizerFriendlyId(value) {
  if (!value) return '';
  const id = String(value);
  const known = [...selectableCharacters, ...bosses, ...navigatorCandidates].find(item => item.id === id);
  if (known) return known.codename || known.name || id;
  return id.replace(/^lufel-recent-/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function downloadOptimizerResult() {
  const data = ui.optimizerSearch.data;
  if (!data) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'optimizer-slaughter-latest.json';
  link.click();
  URL.revokeObjectURL(url);
}

function runArchivedOptimizerSeed() {
  const search = ui.optimizerSearch.data;
  const seed = Number(search?.search?.battleSeed ?? search?.metadata?.battleSeed ?? search?.seed);
  if (Number.isFinite(seed)) ui.seed = seed;
  startBattle();
}

async function loadOptimizerResult() {
  if (ui.optimizerSearch.status === 'loading' || ui.optimizerSearch.status === 'ready') return;
  ui.optimizerSearch.status = 'loading';
  try {
    const response = await fetch('data/optimizer-slaughter-latest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Saved result unavailable (${response.status})`);
    ui.optimizerSearch = { status: 'ready', data: await response.json() };
  } catch {
    ui.optimizerSearch = { status: 'missing', data: null };
  }
  if (ui.screen === 'lab') renderLab();
}

function renderLab() {
  const search = ui.optimizerSearch.data;
  const scope = search && optimizerScope(search);
  const isCurrentSearch = scope?.profile === scope?.currentProfile;
  const seedRuns = ui.optimizerSeedComparison
    ? [808, 1204, 3401, 7777].map(seed => simulate({ ...buildEngineConfig(), seed }).result).sort((a, b) => b.score - a.score)
    : [];
  const savedResult = search ? `<article class="optimizer-card saved-search-card ${isCurrentSearch ? 'current-search' : 'archived-search'}"><div class="panel-title"><span>${isCurrentSearch ? 'CURRENT LIVE-PROFILE SEARCH' : 'ARCHIVED RECORDED SEARCH'}</span><b>${isCurrentSearch ? 'NOT A GUARANTEED GLOBAL OPTIMUM' : 'PROVISIONAL, NOT A CURRENT RESULT'}</b></div>
    <div class="optimizer-readout"><span><small>${isCurrentSearch ? 'BEST SEARCHED SCORE' : 'ARCHIVED SEARCH SCORE'}</small><b>${format(search.optimized?.score || 0)}</b></span><span><small>${isCurrentSearch ? 'CURRENT POLICY BASELINE' : 'ARCHIVED BASELINE'}</small><b>${format(search.baseline?.score || 0)}</b></span><span><small>CANDIDATES SEARCHED</small><b>${format(search.candidatesEvaluated || 0)}</b></span></div>
    <div class="optimizer-scope"><span><small>${isCurrentSearch ? 'RESULT PROFILE' : 'ARCHIVED PROFILE'}</small><b>${escapeHtml(scope.profile)}</b></span><span><small>CURRENT PROFILE</small><b>${escapeHtml(scope.currentProfile)}</b></span><span><small>FIXED SEED</small><b>${escapeHtml(scope.seed)}</b></span><span><small>FIXED TEAM</small><b>${escapeHtml(scope.team)}</b></span></div>
    <p class="optimizer-note">${isCurrentSearch ? 'This is the best result found by the saved current-policy search. It is not a guaranteed global optimum.' : 'This artifact belongs to an archived recorded profile and does not represent a current corrected run. Its trace remains available for review.'}</p>
    <div class="optimizer-actions"><button data-download-optimizer>DOWNLOAD ${isCurrentSearch ? 'SEARCH' : 'ARCHIVE'} JSON</button><button data-run-archived-seed>START CURRENT LEGAL BATTLE ON ${isCurrentSearch ? 'SEARCH' : 'ARCHIVED'} SEED</button><button class="quiet" data-toggle-seed-comparison>${ui.optimizerSeedComparison ? 'HIDE' : 'SHOW'} LOCAL SEED COMPARISON</button></div>
    <details class="optimizer-rotation"><summary>${isCurrentSearch ? 'VIEW SEARCHED ROTATION' : 'REPLAY ARCHIVED TRACE'}</summary><p>${isCurrentSearch ? 'This trace was searched under the current live mechanics profile. It remains a best-searched result, not a proof of a global optimum.' : 'This is the recorded trace, not a replay under the current mechanics profile. Start the current legal battle on its seed to run a corrected rotation.'}</p>${optimizerRotationRows(search)}</details>
  </article>` : `<article class="optimizer-card saved-search-card"><div class="panel-title"><span>SAVED SEARCH RESULT</span><b>WAITING FOR OPTIMIZER OUTPUT</b></div><p class="optimizer-note">No saved optimizer result is available yet. Navigation remains available while a search result is generated.</p><div class="optimizer-actions"><button data-retry-optimizer>RETRY SAVED RESULT</button></div></article>`;
  const comparison = ui.optimizerSeedComparison ? `<article class="ranked-card seed-comparison"><div class="panel-title"><span>LOCAL SEED COMPARISON</span><b>SAME POLICY, DIFFERENT SEEDS</b></div><p>This optional comparison uses the currently selected Team and Builds with the same built-in local policy. It is separate from the saved search result.</p><ol>${seedRuns.map((result, index) => `<li><span>#${index + 1}</span><div><b>Seed ${result.seed}</b><small>${format(result.totalDamage)} damage, ${result.attackTurns || result.rounds} Attack Turns</small></div><strong>${format(result.score)}</strong></li>`).join('')}</ol></article>` : '';
  root.innerHTML = `${header('lab')}<main class="lab-screen page-enter">
    <section class="secondary-hero"><span class="eyebrow">MECHANICS PROFILES</span><h1>Optimizer</h1><p>Recorded benchmarks and archived searches remain separate from corrected live-mechanics runs. A saved score is current only when its mechanics profile matches the active profile.</p></section>
    <section class="lab-grid">${savedResult}${comparison}</section>
  </main>`;
  bindCommon();
  document.querySelector('[data-download-optimizer]')?.addEventListener('click', downloadOptimizerResult);
  document.querySelector('[data-run-archived-seed]')?.addEventListener('click', runArchivedOptimizerSeed);
  document.querySelector('[data-toggle-seed-comparison]')?.addEventListener('click', () => { ui.optimizerSeedComparison = !ui.optimizerSeedComparison; renderLab(); });
  document.querySelector('[data-retry-optimizer]')?.addEventListener('click', () => { ui.optimizerSearch = { status: 'idle', data: null }; renderLab(); });
  if (ui.optimizerSearch.status === 'idle') loadOptimizerResult();
}

function renderData() {
  const recordedScore = calculateNightmareScore(recordedNightmareBenchmark);
  root.innerHTML = `${header('data')}<main class="data-screen page-enter">
    <section class="secondary-hero"><span class="eyebrow">DATA LAYER</span><h1>Lufelnet Import</h1><p>The bundled catalog is generated from Lufelnet source files. You can also load another normalized <code>simulator-dataset.json</code>. Descriptions remain reference data until represented by validated structured effects.</p></section>
    <section class="catalog-banner"><span class="live-dot"></span><div><small>ACTIVE SOURCE</small><b>${escapeHtml(lufelCatalog.source.name)}</b><em>Commit ${escapeHtml(lufelCatalog.source.commit.slice(0, 8))} · generated ${new Date(lufelCatalog.generatedAt).toLocaleDateString()}</em></div><a href="${lufelCatalog.source.repository}" target="_blank" rel="noreferrer">SOURCE ↗</a></section>
    <section class="data-grid"><article><div class="panel-title"><span>NORMALIZED CATALOG</span><b>SCHEMA ${lufelCatalog.schemaVersion}</b></div><dl><div><dt>Characters</dt><dd>${lufelCatalog.counts.characters}</dd></div><div><dt>Personas</dt><dd>${lufelCatalog.counts.personas}</dd></div><div><dt>Ordered Personas</dt><dd>${lufelCatalog.counts.orderedPersonas}</dd></div><div><dt>Persona Skills</dt><dd>${lufelCatalog.counts.personaSkills}</dd></div><div><dt>Weapons</dt><dd>${lufelCatalog.counts.weapons}</dd></div><div><dt>Rev. Mains</dt><dd>${lufelCatalog.counts.revelationMains}</dd></div><div><dt>Rev. Sets</dt><dd>${lufelCatalog.counts.revelationSets}</dd></div></dl><p>Character identity, role, element, Persona records, and weapon reference data come from the mined source. Imported combat descriptions are only executable when a tested simulator adapter exists.</p></article>
    <article class="import-card"><input type="file" accept="application/json,.json" data-import-file id="import-file"><label for="import-file"><span>⇧</span><b>IMPORT DATASET</b><small>JSON · local only</small></label><div class="import-links"><a href="/data/game-api-template.json" download>DOWNLOAD API TEMPLATE</a><span>Use this shape for API responses or exported game data.</span></div><div class="import-status">${ui.importedDataset ? `<b>✓ ${escapeHtml(ui.importedDataset.source || ui.importedDataset.metadata?.source || 'Dataset loaded')}</b><span>${ui.importedDataset.characters?.length || 0} characters detected</span>` : '<b>No external dataset loaded</b><span>Built-in structured demo is active</span>'}</div></article>
    <article class="recording-card"><div class="panel-title"><span>RECORDING VALIDATION</span><b>${escapeHtml(recordedNightmareBenchmark.encounter)} · ${escapeHtml(recordedNightmareBenchmark.difficulty)}</b></div><div class="recorded-score"><span><small>BASE</small><b>${format(recordedNightmareBenchmark.baseDamagePoints)}</b></span><i>+</i><span><small>WEAKENED</small><b>${format(recordedNightmareBenchmark.weakenedDamagePoints)}</b></span><i>+</i><span><small>BOSS ATTACK</small><b>${format(recordedNightmareBenchmark.bossAttackPoints)}</b></span><i>× ${recordedNightmareBenchmark.difficultyBonus}</i><strong>${format(recordedScore)}</strong></div><ul>${recordedNightmareBenchmark.confirmedMechanics.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul><p>${escapeHtml(recordedNightmareBenchmark.source)} · ${escapeHtml(recordedNightmareBenchmark.duration)} reviewed</p></article></section>
  </main>`;
  bindCommon();
  document.querySelector('[data-import-file]')?.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { ui.importedDataset = JSON.parse(await file.text()); render(); } catch { window.alert('That file is not valid JSON.'); }
  });
}

function bindCommon() {
  bindAwarenessControls();
  bindLimitationsToggle();
  document.querySelector('[data-dismiss-start-error]')?.addEventListener('click', () => { ui.startError = null; render(); });
  document.querySelector('[data-start-error-fix]')?.addEventListener('click', event => {
    ui.buildCharacterId = event.currentTarget.dataset.startErrorFix;
    ui.startError = null;
    ui.screen = 'builds';
    render();
    requestAnimationFrame(() => window.scrollTo(0, 0));
  });
  document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.nav;
    if (next === 'battle' && !ui.engine) return;
    stopReplay();
    if (next !== 'battle') stopAuto();
    ui.screen = next;
    render();
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }));
}

function render() {
  if (ui.screen === 'setup') renderSetup();
  else if (ui.screen === 'builds') renderBuilds();
  else if (ui.screen === 'battle') renderBattle();
  else if (ui.screen === 'results') renderResults();
  else if (ui.screen === 'replay') renderReplay();
  else if (ui.screen === 'lab') renderLab();
  else if (ui.screen === 'data') renderData();
  else if (ui.screen === 'kotone') renderKotonePreview(root, header('kotone'), bindCommon, () => {
    if (!ui.teamIds.includes(KOTONE_SHIOMI_ID)) ui.teamIds[1] = KOTONE_SHIOMI_ID;
    ensureLoadout(KOTONE_SHIOMI_ID); saveTeamIds(); saveLoadouts();
    ui.buildCharacterId = KOTONE_SHIOMI_ID; ui.screen = 'builds'; render();
  });
}

render();


