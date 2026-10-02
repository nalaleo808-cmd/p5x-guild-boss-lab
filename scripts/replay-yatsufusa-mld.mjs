// Yatsufusa Multidimensional Dreamscape (MLD): replay of a posted ~5.3b
// rotation (Japanese player, shared by the user 2026-10-02), then the same
// team with Kotone Shiomi in Marian's slot and a search over Kotone's turns.
//
// Team as posted: Wonder (Ex Machina; Bishamonten, Dionysus, Nian), J&C
// (Mischief & Innocence + Service & Admonition = Medic), Marian Beachflower,
// Cosmic Yui, navigator MIKU. The posted player's stats are not known, so the
// user's own builds stand in where the simulator has them (J&C, Wonder, Marian
// and Kotone from the Surt and DOD replays). Cosmic Yui uses the user's own
// pre-battle Character Details (2026-10-02) plus MIKU's party share; her
// awareness is not on those screens, so A6 follows the posted route.
//
// Every step the simulator would not allow on its own (Highlight gauge or
// cooldown, navigator cooldown, SP) is still played and listed under
// forcedResources, so the route always matches the post.
// Usage: node scripts/replay-yatsufusa-mld.mjs [--seeds=8] [--debug] [--search [--search-seeds=2] [--top=10]]
// --search tries every Go for Broke placement (about 7 minutes); search
// plans may not need any forced step for Kotone or more forced steps overall.
import { writeFileSync, mkdirSync } from 'node:fs';
import { HachimanRecordedEngine, character, combatSkill, dionysusDefinition, navigatorDefinition, withNavigatorShare } from '../src/hachiman-recorded-team.js';
import { CURRENT_MECHANICS_PROFILE } from '../src/engine.js';
import { buildPersonaLoadoutCatalog } from '../src/persona-loadout.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';
import { withRevelationSetOverlay } from '../src/revelation-overlay.js';
import { KOTONE_SHIOMI_ID as KOTONE } from '../src/characters/kotone-shiomi-data.js';

const arg = (name, fallback) => Number(process.argv.find(v => v.startsWith(`--${name}=`))?.split('=')[1] ?? fallback);

// In-battle running totals from the post (Foe Defense Points, before the
// x8 difficulty bonus). T5 and T6 are the two Virtual Concert rounds.
const LIVE_CHECKPOINTS = { 'T1 end': 605_000, 'T2 end': 5_300_000, 'T3 end': 16_370_000, 'T4 end': 36_400_000,
  'T5 end': 153_000_000, 'T6 end': 546_000_000, 'T7 end': 606_000_000 };
const LIVE_TOTAL_SCORE = 5_300_000_000;

const catalog = buildPersonaLoadoutCatalog(lufelCatalog);
const transferable = name => {
  const skill = catalog.transferableSkills.find(item => item.name === name);
  if (!skill) throw new Error(`Missing Persona skill ${name}`);
  return skill;
};
const personaSource = name => {
  const source = lufelCatalog.personas.find(item => item.name === name);
  if (!source) throw new Error(`Missing Persona ${name}`);
  return source;
};
const personaDef = (name, skills) => {
  const source = personaSource(name);
  return { id: source.id, name: source.name, element: source.element, arcana: source.position,
    passive: structuredClone(source.passive || []), maxRankPassive: structuredClone(source.maxRankPassive || null), skills };
};
// Bishamonten signature Imperial Purge (Lufel persona data, read 2026-10-02):
// 198% Nuclear to one foe; Nuclear allies' Attack +22% for 2 turns. Lufel lists
// no SP cost for it, so it costs 0 here (see limitations).
const bishamonten = personaDef('Bishamonten', [
  combatSkill(personaSource('Bishamonten').skills.find(s => s.name === 'Imperial Purge'), 0, {
    cost: 0, power: 1.98, buff: { id: 'imperial_purge_attack', name: 'IMPERIAL PURGE ATK', stat: 'attack', value: 0.22, duration: 2 },
    buffTarget: 'party_attribute', buffAttribute: 'nuclear' }),
  combatSkill(transferable('Rakunda'), 1, { cost: 22 })
]);
const dionysus = dionysusDefinition().definition;
const nian = personaDef('Nian', [combatSkill(transferable('Sonic Interference'), 0, {
  cost: 22, debuff: { id: 'sonic_interference', name: 'SONIC INTERFERENCE', value: 0.30, duration: 3 } })]);

const jc = character('j-c');
const marian = character('marian-beachflower');
const yui = character('bui-cosmic');
const stats = {
  [jc.id]: { attack: 3123, defense: 2784, maxHp: 13100, maxSp: 100, speed: 113.4, critRate: 48.5, critMult: 223.8, damageBonus: 52.5, spRecovery: 5 },
  wonder: { attack: 2846, defense: 2910, maxHp: 13823, maxSp: 100, speed: 111.8, critRate: 47.1, critMult: 241.065, pierceRate: 3.1 },
  [marian.id]: { attack: 2572, defense: 2403, maxHp: 17853, maxSp: 100, speed: 106.8, critRate: 20.2, critMult: 265.665, pierceRate: 6.6 },
};
// User's Cosmic Yui, Character Details before battle (screenshots 2026-10-02):
// Starlight Decimators Lv80 R6 (crit rate +34.3% is in the totals). Pre-battle
// totals carry no navigator share, so MIKU's share is added like the
// recorded-team units.
const yuiLoadout = withNavigatorShare(yui, { baseStats: { attack: 5425, defense: 1561, maxHp: 8102, maxSp: 100, speed: 99.6,
  critRate: 51.2, critMult: 239.3, spRecovery: 27.5, pierceRate: 17.7, damageBonus: 27.4 } });
const strife = withRevelationSetOverlay(lufelCatalog.revelationSets).find(set => set.name === 'Strife');

function makeEngine(seed, variant) {
  const third = variant === 'kotone' ? KOTONE : marian.id;
  const loadouts = Object.fromEntries(Object.entries(stats).filter(([id]) => id !== marian.id || third === marian.id).map(([id, baseStats]) => [id, {
    statsMode: 'equipped', navigatorShareApplied: true, panelIncludesShareAndSetEffects: true, baseStats
  }]));
  loadouts[jc.id].jcDesireLevel = 120;
  loadouts[jc.id].characterResearch = { weapon: 'signature', refinement: 6, staticWeaponStatsIncluded: false };
  loadouts[yui.id] = { ...structuredClone(yuiLoadout), statsMode: 'equipped', panelIncludesShareAndSetEffects: true,
    cosmicYui: { awareness: 6, sourceTier: 3, weapon: 'signature', refinement: 6, staticWeaponStatsIncluded: true } };
  loadouts.wonder.weaponId = 'ex-machina';
  if (third === marian.id) Object.assign(loadouts[marian.id], { revelationMain: 'Trust', revelationSet: 'Prosperity' });
  // Kotone: the user's A6 Vetri Vel Muruga +6 totals (DOD replay, 2026-09-26).
  else loadouts[KOTONE] = { awareness: 6, mindscape: 5, weaponId: 'vetri-vel-muruga', enhancement: 6, statsMode: 'equipped',
    equippedTotalsFor: 'vetri-vel-muruga+6', baseStats: { attack: 5543, maxHp: 7927, defense: 1732, maxSp: 240 },
    revelationMain: 'Nativity', revelationSet: 'Strife', revelationCombat: structuredClone(strife.combat) };
  const e = new HachimanRecordedEngine({
    seed, bossId: 'yatsufusa', modeId: 'multidimensional', mechanicsProfile: CURRENT_MECHANICS_PROFILE, fastMode: true,
    teamIds: [jc.id, 'wonder', third, yui.id], characterDefinitions: third === KOTONE ? [jc, yui] : [jc, marian, yui],
    navigatorDefinition: navigatorDefinition(), personaDefinitions: [bishamonten, dionysus, nian],
    personaIds: [bishamonten.id, dionysus.id, nian.id], jcMaskPair: ['mischief', 'service'],
    jcOpeningAutoTargetId: 'yatsufusa', loadouts
  });
  e.runnerForcedResources = [];
  e.config.fastMode = !debug;
  // The recorded-team engine adds Hachiman-run party effects. Auto-Mataru IV
  // only lasts while Dionysus is out, and Bishamonten starts here.
  for (const unit of e.state.party) unit.buffs = unit.buffs.filter(buff => buff.id !== 'runner_auto_mataru_iv');
  if (third === KOTONE) Object.assign(e.state.party.find(unit => unit.id === KOTONE), { crit: .354, critMult: 1.634, speed: 106.8 });
  return e;
}

const forced = (e, entry) => e.runnerForcedResources.push({ ...entry, attackTurn: e.state.attackTurn, concert: e.isVirtualConcertActive() });
const targetId = (e, target) => target === 'yui' ? yui.id : target === 'party' ? 'party' : target === 'twin' ? jc.id
  : target === 'wonder' ? 'wonder' : e.state.boss.id;

function expectActor(e, id) {
  const skip = e.getAvailableActions().find(item => item.enabled && item.type === 'skip_extra_actions');
  if (skip && e.actor?.id !== id) e.step({ type: skip.type, skillId: skip.skillId, targetId: e.actor.id });
  if (e.actor?.id !== id) throw new Error(`Expected ${id}, found ${e.actor?.id} (attack turn ${e.state.attackTurn}, phase ${e.state.phase})`);
}
function ensureSp(e, unit, cost) {
  if (unit.sp >= cost) return;
  forced(e, { type: 'sp', actor: unit.id, prior: Math.round(unit.sp), needed: cost });
  unit.sp = cost;
}
function act(e, id, selector, target = 'boss') {
  expectActor(e, id);
  const all = e.getAvailableActions();
  const match = item => selector === 'guard' ? item.type === 'guard' : selector === 'gun' ? item.type === 'gun'
    : selector.type ? item.type === selector.type : selector.cosmic ? item.skill?.cosmicAction === selector.cosmic
      : selector.slot ? item.skill?.slot === selector.slot && item.type !== 'item' : item.name === selector.name || item.skill?.name === selector.name;
  let legal = all.find(item => item.enabled && match(item));
  if (!legal) {
    const blocked = all.find(match);
    if (blocked && Number(blocked.cost) > 0) { ensureSp(e, e.actor, Number(blocked.cost)); legal = e.getAvailableActions().find(item => item.enabled && match(item)); }
  }
  if (!legal) throw new Error(`No legal ${JSON.stringify(selector)} for ${id} at T${e.state.attackTurn}: ${all.map(a => `${a.type}:${a.name}:${a.enabled}`).join(', ')}`);
  return e.step({ type: legal.type, skillId: legal.skillId, targetId: targetId(e, target) });
}
function persona(e, name) {
  const selected = e.personaDefinitions.find(item => item.name === name);
  if (e.state.activePersonaId !== selected.id) e.selectPersona(selected.id);
}
const wonder = (e, personaName, skill, target = 'boss') => { expectActor(e, 'wonder'); persona(e, personaName); return act(e, 'wonder', { name: skill }, target); };
const SONGS = { H: 'Heaven', S: 'Spring Storm', F: 'Play-With-Fire' };
const NAV_SKILLS = { 1: 'Feel the Beat', 2: 'Clear Sound', 3: 'Showstopper' };
function miku(e, code) {
  const song = SONGS[code[0]], name = NAV_SKILLS[code[1]];
  if (song && e.state.navigator.currentSong !== song) {
    if (e.canSelectMikuSong()) e.selectMikuSong(song);
    else {
      forced(e, { type: 'navigator_song', from: e.state.navigator.currentSong, to: song });
      e.state.navigator.currentSong = song;
      e.state.navigator.songIndex = ['Heaven', 'Spring Storm', 'Play-With-Fire'].indexOf(song);
    }
  }
  let action = e.getNavigatorActions().find(item => item.name === name && item.enabled);
  if (!action) {
    action = e.getNavigatorActions().find(item => item.name === name);
    forced(e, { type: 'navigator_cooldown', action: name });
    e.state.navigator.cooldowns[action.id] = 0;
    e.state.navigator.lastUsedAttackTurn = -1;
  }
  return e.stepNavigator(action.id);
}
function highlight(e, unitId, target = 'boss', mask = null) {
  if (e.state.sharedCombat.highlight < 100) forced(e, { type: 'highlight_gauge', actor: unitId, prior: e.state.sharedCombat.highlight });
  e.state.sharedCombat.highlight = 100;
  const unit = e.state.party.find(member => member.id === unitId);
  const key = mask || 'HL';
  if (Number(unit.highlightCooldowns?.[key] || 0) > 0) {
    forced(e, { type: 'highlight_cooldown', actor: unitId, key, remaining: unit.highlightCooldowns[key] });
    unit.highlightCooldowns[key] = 0;
  }
  const available = e.getHighlightActions().find(item => item.actorId === unitId && item.enabled && (!mask || item.skill?.jcHighlightMask === mask));
  if (!available) throw new Error(`No Highlight for ${unitId}${mask ? ` (${mask})` : ''} at T${e.state.attackTurn}: ${e.getHighlightActions().map(a => `${a.actorId}:${a.enabled}:${a.unavailableReason || ''}`).join(' | ')}`);
  return e.stepHighlight(available.skillId, targetId(e, target));
}
function medicine(e, id, target = 'yui') {
  expectActor(e, marian.id);
  const unit = e.actor;
  if (unit.midsummerPrescription <= 0 || unit.lastMedicineCharacterTurn === unit.characterTurnsStarted) {
    forced(e, { type: 'medicine_availability', item: id, prior: unit.midsummerPrescription });
    unit.midsummerPrescription = Math.max(1, unit.midsummerPrescription);
    unit.lastMedicineCharacterTurn = -1;
  }
  return e.stepMedicine(id, targetId(e, target));
}
function dreamItem(e, actorId, id, target = 'yui') {
  expectActor(e, actorId);
  const prior = Number(e.state.itemInventory[id] || 0);
  if (prior < 1 || Number(e.state.itemUsesRemaining || 0) < 1) {
    forced(e, { type: 'dream_item', item: id, prior, usesRemaining: e.state.itemUsesRemaining });
    e.state.itemInventory[id] = Math.max(1, prior);
    e.state.itemUsesRemaining = Math.max(1, Number(e.state.itemUsesRemaining || 0));
  }
  return e.stepItem(id, targetId(e, target));
}
function trueDesire(e) {
  expectActor(e, jc.id);
  const unit = e.actor;
  if (Number(unit.trueDesireStacks || 0) < 1) { forced(e, { type: 'true_desire_stack', prior: unit.trueDesireStacks }); unit.trueDesireStacks = 1; }
  e.setTrueDesire(true);
}
const yuiAssemble = e => { expectActor(e, yui.id); const free = e.getAvailableActions().find(a => a.enabled && a.type === 'cosmic_assemble'); if (free) return e.step({ type: free.type, skillId: free.skillId, targetId: yui.id }); forced(e, { type: 'yui_assemble_unavailable' }); };
const vegOut = e => act(e, yui.id, { cosmic: 'mobilize' });

// Kotone moves. 'L' Lyre's Melody on Yui, 'B' Burning Moon's Cry, 'P' Lunar
// Phaseshift naming Wonder as the buff caster, 'G' Go for Broke then three
// Fortune actions (the third may chain the second Go for Broke at A6),
// 'C' Cold turn, 'I' Fighter Salve item on Yui, 'HL' her Highlight first.
function kotoneStep(e, plan) {
  expectActor(e, KOTONE);
  const m = e.kotoneMechanics;
  if (m.state.cold > 0) return act(e, KOTONE, { type: 'kotone_cold' });
  for (const code of plan) {
    if (e.actor?.id !== KOTONE || e.state.phase !== 'battle') break;
    // Search moves must be legal on their own: no forced gauge or item stock.
    if (code === 'HL') {
      const legal = e.getHighlightActions().find(item => item.actorId === KOTONE && item.enabled);
      if (!legal) throw new Error(`Kotone Highlight not ready at T${e.state.attackTurn}`);
      e.stepHighlight(legal.skillId, 'party');
      continue;
    }
    if (code === 'I') {
      const legal = e.getAvailableActions().find(item => item.enabled && item.type === 'item' && item.itemId === 'fighter_salve');
      if (!legal) throw new Error(`Fighter Salve not available at T${e.state.attackTurn}`);
      e.stepItem('fighter_salve', yui.id);
      continue;
    }
    if (code === 'G') {
      const legal = e.getAvailableActions().find(item => item.enabled && item.type === 'kotone_assist');
      if (!legal) throw new Error(`Go for Broke unavailable at T${e.state.attackTurn}`);
      e.step({ type: legal.type, skillId: legal.skillId, targetId: KOTONE });
      continue;
    }
    const skill = { L: "Lyre's Melody", B: "Burning Moon's Cry", P: 'Lunar Phaseshift' }[code];
    const target = code === 'L' ? 'yui' : code === 'P' ? 'wonder' : 'boss';
    const choice = e.getAvailableActions().find(item => item.enabled && item.name === skill);
    if (!choice) {
      // Lunar Phaseshift on cooldown falls back to Lyre's Melody.
      if (code === 'P' && e.getAvailableActions().some(item => item.enabled && item.name === "Lyre's Melody")) { act(e, KOTONE, { name: "Lyre's Melody" }, 'yui'); continue; }
      throw new Error(`${skill} not available at T${e.state.attackTurn}`);
    }
    act(e, KOTONE, { name: skill }, target);
  }
}

const debug = process.argv.includes('--debug');
function checkpoint(e, label, rows) {
  const unit = e.state.party.find(member => member.id === yui.id);
  const since = Number(e.debugLogIndex || 0);
  e.debugLogIndex = e.state.log.length;
  rows.push({ label, attackTurn: e.state.attackTurn, concert: e.isVirtualConcertActive(),
    fdp: e.state.scoreBreakdown.foeDefensePoints, damage: e.state.totalDamage, highlight: e.state.sharedCombat.highlight,
    ...(debug ? {
      yuiStats: { attack: unit.attack, crit: unit.crit, critMult: unit.critMult, pierce: unit.pierce, damageBonus: unit.damageBonus, speed: unit.speed },
      yuiBuffs: unit.buffs.map(buff => `${buff.id}:${buff.stat}:${Math.round(Number(buff.value) * 1000) / 1000}:${buff.duration}`),
      hits: e.state.log.slice(since).filter(event => event.type === 'damage').sort((a, b) => b.amount - a.amount).slice(0, 6)
        .map(event => `${event.actorId?.replace('lufel-recent-', '')}:${event.sourceType}:${Math.round(event.amount).toLocaleString()}`),
      moves: e.state.log.slice(since).filter(event => ['move', 'medicine', 'item', 'buff', 'concert_start', 'concert_end', 'follow_up', 'cosmic_auto'].includes(event.type)).map(event => event.message)
    } : {}) });
}

// The posted rotation, Marian in slot 3. `third` lets the Kotone search
// replace Marian's moves turn by turn.
function play(seed, variant = 'marian', kotonePlan = null) {
  const e = makeEngine(seed, variant);
  const rows = [];
  const J = jc.id, Y = yui.id, M = marian.id;
  const k = turn => kotoneStep(e, kotonePlan[turn]);
  const third = (turn, marianMoves) => variant === 'kotone' ? k(turn) : marianMoves();
  // T1
  act(e, J, 'gun'); wonder(e, 'Bishamonten', 'Imperial Purge');
  third(0, () => act(e, M, { slot: 'S3' }, 'yui'));
  vegOut(e); checkpoint(e, 'T1 end', rows);
  // T2
  miku(e, 'H1');
  if (variant === 'marian') highlight(e, M, 'yui');
  act(e, J, { slot: 'S1' }); wonder(e, 'Dionysus', 'Tarukaja', 'yui');
  third(1, () => act(e, M, { slot: 'S2' }, 'party'));
  yuiAssemble(e); vegOut(e); checkpoint(e, 'T2 end', rows);
  // T3
  miku(e, 'S2'); act(e, J, { slot: 'S2' }); wonder(e, 'Nian', 'Sonic Interference');
  third(2, () => { medicine(e, 'one_more_up'); highlight(e, Y); act(e, M, { slot: 'S1' }); });
  if (variant === 'kotone') highlight(e, Y);
  vegOut(e); checkpoint(e, 'T3 end', rows);
  // T4
  miku(e, 'F1'); act(e, J, { slot: 'S1' }); wonder(e, 'Bishamonten', 'Rakunda');
  third(3, () => { medicine(e, 'reso_up'); act(e, M, { slot: 'S3' }, 'yui'); });
  yuiAssemble(e); vegOut(e); checkpoint(e, 'T4 end', rows);
  // T5: J&C Highlight, Showstopper, Concert round 1
  highlight(e, J, 'boss', 'mischief'); miku(e, 'S3');
  trueDesire(e); act(e, J, { slot: 'S2' }); wonder(e, 'Dionysus', 'Universal Theoria', 'yui');
  third(4, () => { medicine(e, 'attack_tablet'); act(e, M, { slot: 'S2' }, 'party'); });
  highlight(e, Y); vegOut(e); checkpoint(e, 'T5 end', rows);
  // T6: Concert round 2, MIKU's finishing beam
  act(e, J, { slot: 'S1' }); wonder(e, 'Bishamonten', 'Imperial Purge');
  third(5, () => { highlight(e, M, 'yui'); medicine(e, 'one_more_up'); dreamItem(e, M, 'fighter_salve'); });
  yuiAssemble(e); vegOut(e); checkpoint(e, 'T6 end', rows);
  // T7
  miku(e, 'H1'); act(e, J, { slot: 'S2' }); wonder(e, 'Dionysus', 'Universal Theoria', 'yui');
  highlight(e, J, 'boss', 'mischief');
  third(6, () => act(e, M, { slot: 'S3' }, 'yui'));
  vegOut(e); checkpoint(e, 'T7 end', rows);
  // T8
  if (e.state.phase === 'battle') {
    miku(e, 'S2'); act(e, J, { slot: 'S1' }); wonder(e, 'Nian', 'Sonic Interference');
    third(7, () => { medicine(e, 'attack_tablet'); act(e, M, { slot: 'S1' }); });
    yuiAssemble(e); vegOut(e);
  }
  checkpoint(e, 'T8 end', rows);
  const unit = e.state.party.find(member => member.id === Y);
  return { rows, finalScore: e.state.result?.score ?? e.state.score, fdp: e.state.scoreBreakdown.foeDefensePoints,
    phase: e.state.phase, forcedResources: e.runnerForcedResources,
    damageByActor: Object.fromEntries(e.state.party.map(member => [member.slug || member.id, Math.round(member.damageDone)])),
    yui: { automaticVegOut: unit.cosmicYui.automaticVegOutUses, manualVegOut: unit.cosmicYui.manualVegOutUses, havoc: unit.cosmicYui.harvestHavocUses },
    limitations: e.state.mechanicsLimitations };
}

const average = (runs, pick) => Math.round(runs.reduce((sum, run) => sum + pick(run), 0) / runs.length);
function evaluate(variant, plan, seeds) {
  const runs = seeds.map(seed => play(seed, variant, plan));
  return { runs, fdp: average(runs, run => run.fdp), score: average(runs, run => run.finalScore) };
}

const seeds = Array.from({ length: arg('seeds', 8) }, (_, i) => i + 1);
const report = {};
const marianResult = evaluate('marian', null, seeds);
report.marian = { fdp: marianResult.fdp, score: marianResult.score,
  rows: marianResult.runs[0].rows.map((row, index) => ({ ...row, fdp: average(marianResult.runs, run => run.rows[index].fdp), live: LIVE_CHECKPOINTS[row.label] ?? null })),
  forcedResources: marianResult.runs[0].forcedResources, damageByActor: marianResult.runs[0].damageByActor, yui: marianResult.runs[0].yui };

// Kotone: the DOD-proven shape first (Lyre's Melody each normal turn, both Go
// for Brokes in Concert round 1), then a search over every turn.
const BASE_KOTONE = [['L'], ['L'], ['L'], ['L'], ['G', 'P', 'B', 'G', 'B', 'B', 'B'], ['C'], ['C'], ['L']];
const kotoneBase = evaluate('kotone', BASE_KOTONE, seeds);
report.kotoneBase = { plan: BASE_KOTONE, fdp: kotoneBase.fdp, score: kotoneBase.score,
  rows: kotoneBase.runs[0].rows.map((row, index) => ({ ...row, fdp: average(kotoneBase.runs, run => run.rows[index].fdp) })),
  forcedResources: kotoneBase.runs[0].forcedResources, damageByActor: kotoneBase.runs[0].damageByActor, yui: kotoneBase.runs[0].yui };

// Best legal plan from --search (2026-10-02, re-checked on 8 seeds with the
// user's Cosmic Yui): Lyre's Melody on Yui
// T1-T4; Concert round 1 Go for Broke, Lyre x2, chained Go for Broke, Lunar
// Phaseshift, Burning Moon's Cry x2; Cold T6-T7; Burning Moon's Cry on T8.
const SEARCHED_KOTONE = [['L'], ['L'], ['L'], ['L'], ['G', 'L', 'L', 'G', 'P', 'B', 'B'], ['C'], ['C'], ['B']];
const kotoneSearched = evaluate('kotone', SEARCHED_KOTONE, seeds);
report.kotoneSearched = { plan: SEARCHED_KOTONE, fdp: kotoneSearched.fdp, score: kotoneSearched.score,
  rows: kotoneSearched.runs[0].rows.map((row, index) => ({ ...row, fdp: average(kotoneSearched.runs, run => run.rows[index].fdp) })),
  forcedResources: kotoneSearched.runs[0].forcedResources, damageByActor: kotoneSearched.runs[0].damageByActor, yui: kotoneSearched.runs[0].yui };

if (process.argv.includes('--search')) {
  const searchSeeds = seeds.slice(0, arg('search-seeds', 2));
  const normal = [['L'], ['B'], ['P'], ['HL', 'L'], ['I']];
  const fortune = ['L', 'B', 'P'];
  const goSequences = [];
  for (const a of fortune) for (const b of fortune) {
    goSequences.push(['G', a, b, 'B']);
    for (const c of fortune) for (const d of fortune) for (const f of fortune) goSequences.push(['G', a, b, 'G', c, d, f]);
  }
  // A plan may not lean on more forced steps than the posted Marian route.
  const forcedCap = report.marian.forcedResources.length;
  const legal = result => result.runs.every(run => run.forcedResources.length <= forcedCap && run.forcedResources.every(step => step.actor !== KOTONE));
  const results = [];
  // Go for Broke turn(s): one double use (chained) or two single uses; Cold
  // then follows on her next two turns, which the step function plays.
  const goTurns = [[4], [5], [6], [7], [3], [2], [4, 6], [2, 4]];
  for (const goAt of goTurns) {
    const sequences = goAt.length === 1 ? goSequences : goSequences.filter(seq => seq.length === 4);
    for (const seq of sequences) {
      for (const fill of [['L'], ['P'], ['B']]) {
        const plan = Array.from({ length: 8 }, () => fill);
        for (const turn of goAt) plan[turn] = seq;
        try {
          const result = evaluate('kotone', plan, searchSeeds);
          if (legal(result)) results.push({ plan, fdp: result.fdp, forced: result.runs[0].forcedResources.length });
        } catch (error) { /* plan not playable (Go for Broke blocked by Cold, etc.) */ }
      }
    }
  }
  results.sort((a, b) => b.fdp - a.fdp);
  // Refine the best plan one turn at a time.
  let best = results[0];
  for (let pass = 0; pass < 2 && best; pass++) {
    for (let turn = 0; turn < 8; turn++) {
      if (best.plan[turn][0] === 'G') continue;
      for (const option of normal) {
        const plan = best.plan.map((moves, index) => index === turn ? option : moves);
        try {
          const result = evaluate('kotone', plan, searchSeeds);
          if (result.fdp > best.fdp && legal(result)) best = { plan, fdp: result.fdp, forced: result.runs[0].forcedResources.length };
        } catch { /* skip */ }
      }
    }
  }
  // Two search seeds are noisy: re-check the leaders and the saved plan on
  // every seed and keep the highest average.
  const finalists = [...results.slice(0, 10), ...(best ? [best] : []), { plan: SEARCHED_KOTONE }];
  let confirmed = null;
  for (const candidate of finalists) {
    const result = evaluate('kotone', candidate.plan, seeds);
    if (legal(result) && (!confirmed || result.fdp > confirmed.fdp)) { confirmed = result; best = { ...candidate, fdp: result.fdp }; }
  }
  report.kotoneSearch = { searched: results.length, top: results.slice(0, arg('top', 10)),
    best: confirmed && { plan: best.plan, fdp: confirmed.fdp, score: confirmed.score,
      rows: confirmed.runs[0].rows.map((row, index) => ({ ...row, fdp: average(confirmed.runs, run => run.rows[index].fdp) })),
      forcedResources: confirmed.runs[0].forcedResources, damageByActor: confirmed.runs[0].damageByActor, yui: confirmed.runs[0].yui } };
}
report.limitations = marianResult.runs[0].limitations;
report.seeds = seeds.length;
report.liveTotalScore = LIVE_TOTAL_SCORE;

mkdirSync('outputs', { recursive: true });
writeFileSync('outputs/yatsufusa-mld-rotation-2026-10-02.json', JSON.stringify(report, null, 2) + '\n');
const fmt = n => n == null ? '' : `${(n / 1e6).toFixed(1)}m`;
console.table(report.marian.rows.map((row, index) => ({ checkpoint: row.label, live: fmt(row.live), marian: fmt(row.fdp),
  kotone: fmt(report.kotoneBase.rows[index].fdp), kotoneSearched: fmt(report.kotoneSearched.rows[index].fdp),
  ...(report.kotoneSearch?.best ? { kotoneNewBest: fmt(report.kotoneSearch.best.rows[index].fdp) } : {}) })));
console.log('score  marian', report.marian.score.toLocaleString(), '| kotone', report.kotoneBase.score.toLocaleString(),
  '| kotone searched', report.kotoneSearched.score.toLocaleString(),
  report.kotoneSearch?.best ? `| new search best ${report.kotoneSearch.best.score.toLocaleString()} ${JSON.stringify(report.kotoneSearch.best.plan)}` : '');
console.log('forced steps  marian', report.marian.forcedResources.length, '| kotone', report.kotoneBase.forcedResources.length,
  '| kotone searched', report.kotoneSearched.forcedResources.length);
