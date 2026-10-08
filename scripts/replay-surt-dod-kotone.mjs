// The user's 11.5b Slaughter Drive DOD rotation (2026-09-26) played on Surt in
// Devourer of Dreams, with Kotone at A6 Vetri Vel Muruga +6 (user, 2026-10-08).
// Surt DOD uses the shared DOD rules and Surt's MLD stats and Special Effects
// (see devourerProfile in src/data.js). There is no live Surt DOD run yet, so
// nothing is compared against live numbers.
// Team: J&C (Mischief & Innocence F/I + Absurdity & Nonsense P/N, Trust/Power),
// Wonder (Ice Age; Sahimochi-no-kami, Dionysus, Yurlungur), Kotone Shiomi
// (Nativity/Strife), Wavecatcher Miyu, navigator MIKU (Labor).
//
// Harness-defined pieces, all listed in the output under forcedResources:
// - Takemedic (restore all party HP) and Stamina Kit L (restore 30% SP to the
//   target) are not simulator items; they are applied here and count as the
//   user's action, the same way stepItem completes an item action.
// - HP lock (Life Sustainment) is switched off at T9 by setting the boss state.
// - Highlight gauge and navigator cooldowns are forced when the route calls for a
//   Highlight or navigator skill the simulated gauge/cooldown does not allow yet.
// Usage: node scripts/replay-surt-dod-kotone.mjs [--seeds=24] [--team=jc|marian] [--wonder-buffs=twin|miyu]
//   [--search [--search-seeds=2] [--passes=3]] [--kotone-attack=5543]
import { writeFileSync, mkdirSync } from 'node:fs';
import { HachimanRecordedEngine, character, combatSkill, navigatorDefinition } from '../src/hachiman-recorded-team.js';
import { CURRENT_MECHANICS_PROFILE } from '../src/engine.js';
import { buildPersonaLoadoutCatalog } from '../src/persona-loadout.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';
import { getDefaultWonderWeaponProfileId } from '../src/wonder-weapons.js';
import { withRevelationSetOverlay } from '../src/revelation-overlay.js';
import { KOTONE_SHIOMI_ID as KOTONE } from '../src/characters/kotone-shiomi-data.js';

const arg = (name, fallback) => Number(process.argv.find(v => v.startsWith(`--${name}=`))?.split('=')[1] ?? fallback);

// Live DOD allows 110 Attack Turns; the rotation needs T1-T9 plus the break,
// so 20 is ample. The break window uses its own 2-turn counter.
const DOD_TURN_LIMIT = arg('turn-limit', 20);

// DOD score: (Base + Weakened + Boss Attack Points) x 4. The in-battle counter
// shows points before the x4, so checkpoints print both.
const DIFFICULTY_COEFFICIENT = 4;

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
// "Shark" = Sahimochi-no-kami: signature Chilling Depth (One-Fathom Fang values used
// by the existing replays) + Wild Thunder + Rebellion.
const shark = personaDef('Sahimochi-no-kami', [
  combatSkill(personaSource('Sahimochi-no-kami').skills.find(s => s.name === 'Chilling Depth'), 0, {
    cost: 24, power: 1.1, debuff: { id: 'chilling_depth', name: 'ICE DAMAGE TAKEN', value: 0.088, duration: 2 } }),
  combatSkill(transferable('Wild Thunder'), 1),
  combatSkill(transferable('Rebellion'), 2)
]);
const dionysus = personaDef('Dionysus', [
  combatSkill(personaSource('Dionysus').skills.find(s => s.name === 'Revolution'), 0),
  combatSkill(transferable('Universal Theoria'), 1),
  combatSkill(transferable('Cohesion'), 2)
]);
const yurlungur = personaDef('Yurlungur', [
  combatSkill(transferable('Tarukaja'), 0),
  combatSkill(transferable('Matarukaja'), 1)
]);

const jc = character('j-c');
const miyu = character('puppet-wavecatcher');
const marian = character('marian-beachflower');
// Equipped panel totals from the user's 2026-09-20 capture (same J&C, Wonder, Miyu builds).
const stats = {
  [jc.id]: { attack: 3123, defense: 2784, maxHp: 13100, maxSp: 100, speed: 113.4, critRate: 48.5, critMult: 223.8, damageBonus: 52.5, spRecovery: 5 },
  wonder: { attack: 2846, defense: 2910, maxHp: 13823, maxSp: 100, speed: 111.8, critRate: 47.1, critMult: 241.065, pierceRate: 3.1 },
  [miyu.id]: { attack: 3121, defense: 2163, maxHp: 11142, maxSp: 450, speed: 98.8, critRate: 35.3, critMult: 373.465, spRecovery: 202.5, pierceRate: 34.6 },
  // Marian, Trust + Prosperity, from the live-calibrated Surt MLD replay (2026-09-20).
  [marian.id]: { attack: 2572, defense: 2403, maxHp: 17853, maxSp: 100, speed: 106.8, critRate: 20.2, critMult: 265.665, pierceRate: 6.6 }
};
// --team=marian puts Marian in J&C's slot; --wonder-buffs=miyu aims Wonder's
// ally buffs at Miyu instead of J&C (Marian runs always buff Miyu).
let TEAM = process.argv.find(v => v.startsWith('--team='))?.split('=')[1] || 'jc';
let WONDER_BUFFS = process.argv.find(v => v.startsWith('--wonder-buffs='))?.split('=')[1] || 'twin';
const strife = withRevelationSetOverlay(lufelCatalog.revelationSets).find(set => set.name === 'Strife');

function makeEngine(seed) {
  const third = TEAM === 'marian' ? marian.id : jc.id;
  const loadouts = Object.fromEntries(Object.entries(stats).filter(([id]) => ![jc.id, marian.id].includes(id) || id === third).map(([id, baseStats]) => [id, {
    statsMode: 'equipped', navigatorShareApplied: true, panelIncludesShareAndSetEffects: true, baseStats
  }]));
  if (third === jc.id) Object.assign(loadouts[jc.id], { jcDesireLevel: 120, revelationMain: 'Trust', revelationSet: 'Power',
    characterResearch: { weapon: 'signature', refinement: 6, staticWeaponStatsIncluded: false } });
  else Object.assign(loadouts[marian.id], { revelationMain: 'Trust', revelationSet: 'Prosperity' });
  loadouts[miyu.id].characterResearch = { weapon: 'signature', refinement: 6, staticWeaponStatsIncluded: true };
  loadouts.wonder.weaponId = 'ice-age';
  loadouts.wonder.weaponProfileId = getDefaultWonderWeaponProfileId('ice-age');
  // Kotone: the user's A6 build (Vetri Vel Muruga +6, skill Mindscape 5) with the
  // Character Details totals from 2026-09-26: Attack 5543, Defense 1732, HP 7927,
  // Speed 106.8, Crit 35.4%, Crit Mult 163.4%. Entered as equipped totals, so the
  // weapon component, static Attack and Strife Attack are not added again.
  loadouts[KOTONE] = { awareness: 6, mindscape: 5, weaponId: 'vetri-vel-muruga', enhancement: 6, statsMode: 'equipped',
    equippedTotalsFor: 'vetri-vel-muruga+6',
    baseStats: { attack: arg('kotone-attack', 5543), maxHp: 7927, defense: 1732, maxSp: 240 },
    revelationMain: 'Nativity', revelationSet: 'Strife', revelationCombat: structuredClone(strife.combat) };
  return new HachimanRecordedEngine({
    seed, bossId: 'surt', modeId: 'devourer', lifeSustainment: true, turnLimit: DOD_TURN_LIMIT,
    mechanicsProfile: CURRENT_MECHANICS_PROFILE, fastMode: true,
    teamIds: [third, 'wonder', KOTONE, miyu.id], characterDefinitions: third === jc.id ? [jc, miyu] : [marian, miyu],
    navigatorDefinition: navigatorDefinition(), personaDefinitions: [shark, dionysus, yurlungur],
    personaIds: [shark.id, dionysus.id, yurlungur.id], jcMaskPair: ['mischief', 'absurdity'],
    loadouts
  });
}

const MINION = 'jack_o_lantern';
const thirdId = () => TEAM === 'marian' ? marian.id : jc.id;
const targetId = (e, target) => target === 'miyu' ? miyu.id : target === 'twin' ? thirdId()
  : target === 'buff' ? (TEAM === 'marian' || WONDER_BUFFS === 'miyu' ? miyu.id : jc.id) : target === 'wonder' ? 'wonder'
  : target === 'party' ? 'party' : target === 'minion' ? (e.enemies.find(x => x.id !== e.state.boss.id && x.alive !== false)?.id || MINION)
    : e.state.boss.id;
const forced = (e, entry) => e.runnerForcedResources.push({ ...entry, attackTurn: e.state.attackTurn });

function expectActor(e, id) {
  const skip = e.getAvailableActions().find(item => item.enabled && item.type === 'skip_extra_actions');
  if (skip && e.actor?.id !== id) e.step({ type: skip.type, skillId: skip.skillId, targetId: e.actor.id });
  if (e.actor?.id !== id) throw new Error(`Expected ${id}, found ${e.actor?.id} (attack turn ${e.state.attackTurn}, phase ${e.state.phase})`);
}
const byName = (e, id, name) => e.getAvailableActions().find(item => item.enabled && (item.name === name || item.skill?.name === name));
function act(e, id, selector, target = 'boss') {
  expectActor(e, id);
  const legal = selector === 'guard' ? e.getAvailableActions().find(item => item.enabled && item.type === 'guard')
    : e.getAvailableActions().find(item => item.enabled && (selector.slot ? item.skill?.slot === selector.slot
      : selector.type ? item.type === selector.type : item.name === selector.name || item.skill?.name === selector.name));
  if (!legal) throw new Error(`No legal ${JSON.stringify(selector)} for ${id}: ${e.getAvailableActions().map(a => `${a.type}:${a.name}:${a.enabled}`).join(', ')}`);
  return e.step({ type: legal.type, skillId: legal.skillId, targetId: targetId(e, target) });
}
function persona(e, name) {
  const selected = e.personaDefinitions.find(item => item.name === name);
  if (e.state.activePersonaId !== selected.id) e.selectPersona(selected.id);
}
function wonder(e, personaName, skillName, target = 'boss') { expectActor(e, 'wonder'); persona(e, personaName); return act(e, 'wonder', { name: skillName }, target); }
function setSong(e, song) {
  e.state.navigator.currentSong = song;
  e.state.navigator.songIndex = ['Heaven', 'Spring Storm', 'Play-With-Fire'].indexOf(song);
}
const SONGS = { H: 'Heaven', S: 'Spring Storm', F: 'Play-With-Fire' };
const NAV_SKILLS = { 1: 'Feel the Beat', 2: 'Clear Sound', 3: 'Showstopper' };
function miku(e, code) { // e.g. 'H1', 'S2', 'F2', 'S3'
  const song = SONGS[code[0]], name = NAV_SKILLS[code[1]];
  // Song choice is the player's (MIKU A0); only a change the engine refuses is forced.
  if (song && e.state.navigator.currentSong !== song) {
    if (e.canSelectMikuSong()) e.selectMikuSong(song);
    else { forced(e, { type: 'navigator_song', from: e.state.navigator.currentSong, to: song }); setSong(e, song); }
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
  if (!available) throw new Error(`No Highlight for ${unitId}${mask ? ` (${mask})` : ''}: actor ${e.actor?.id}; ${e.getHighlightActions().map(a => `${a.actorId}:${a.enabled}:${a.unavailableReason || ''}`).join(' | ')}`);
  return e.stepHighlight(available.skillId, targetId(e, target));
}
function consumable(e, id, name, target, effect) {
  expectActor(e, id);
  const actor = e.actor;
  e.state.lastEvents = [];
  const context = e.createSharedHighlightActionContext({ actor, actionType: 'item', skill: { name }, concertAtActionStart: e.isVirtualConcertActive() });
  const message = effect();
  forced(e, { type: 'harness_item', item: name, actor: id, target });
  e.emit('item', `${actor.codename} used ${name}: ${message}`, { actorId: actor.id, sourceType: 'item', tone: 'navigator' });
  e.completeCountedAction({ actionType: 'item', wasConcertAction: context?.concertAtActionStart === true,
    grantsSharedHighlight: e.usesLiveMechanics(), highlightSource: 'item', highlightActionContext: context });
  e.recordFrame(name);
}
const takemedic = e => consumable(e, KOTONE, 'Takemedic', 'party', () => {
  for (const unit of e.state.party.filter(member => member.hp > 0)) unit.hp = unit.maxHp;
  return 'party HP fully restored';
});
const staminaKit = (e, target) => consumable(e, KOTONE, 'Stamina Kit L', target, () => {
  const unit = e.state.party.find(member => member.id === targetId(e, target));
  const before = unit.sp;
  unit.sp = Math.min(e.spCap(unit), unit.sp + unit.maxSp * 0.3);
  return `${unit.codename} SP +${Math.round(unit.sp - before)}`;
});
function trueDesire(e) {
  expectActor(e, jc.id);
  const unit = e.state.party.find(member => member.id === jc.id);
  if (Number(unit.trueDesireStacks || 0) < 1) { forced(e, { type: 'true_desire_stack', prior: unit.trueDesireStacks }); unit.trueDesireStacks = 1; }
  e.setTrueDesire(true);
}
// The live run has Kotone act again at B4; if the simulator still has her in Cold
// when the rotation gives her a skill, Cold is cleared here and logged.
function kotone(e, selector, target) {
  expectActor(e, KOTONE);
  const m = e.kotoneMechanics;
  if (selector.type !== 'kotone_cold' && selector !== 'guard' && m.state.cold > 0) {
    forced(e, { type: 'kotone_cold_cleared', remaining: m.state.cold });
    m.state.cold = 0;
  }
  return act(e, KOTONE, selector, target);
}
// Go for Broke as played live: both uses in B1's first Concert turn, the second
// on the last Fortune action. The engine allows both; any use it still blocks
// is let through here and logged with the rule it bypassed.
function goForBroke(e) {
  expectActor(e, KOTONE);
  const legal = e.getAvailableActions().find(item => item.enabled && item.type === 'kotone_assist');
  if (legal) return e.step({ type: legal.type, skillId: legal.skillId, targetId: KOTONE });
  const m = e.kotoneMechanics;
  forced(e, { type: 'go_for_broke_rule_override', concert: e.isVirtualConcertActive(), fortune: m.state.fortune,
    fortuneActionsLeft: m.state.fortuneActionsLeft, cold: m.state.cold, usesLeft: m.state.goForBroke.limit - m.state.goForBroke.used });
  m.state.fortune = false; m.state.cold = 0; m.state.actionWindow = true;
  const concert = e.isVirtualConcertActive;
  e.isVirtualConcertActive = () => false;
  try { m.activateGoForBroke(); } finally { e.isVirtualConcertActive = concert; }
  e.recordFrame('Go for Broke');
}
const paddle = e => act(e, miyu.id, { name: 'Paddle Out' }, 'boss');

function checkpoint(e, label, rows) {
  rows.push({ label, attackTurn: e.state.attackTurn, phase: e.state.phase, score: e.state.score,
    totalDamage: e.state.totalDamage, weakened: e.state.boss.weakenedActive === true,
    lifeSustainment: e.state.boss.lifeSustainment, bossHp: e.state.boss.hp,
    enemies: e.enemies.map(enemy => enemy.id).join(','),
    highlight: e.state.sharedCombat.highlight });
}

// Marian's turn in J&C's slot. Codes: 'G' guard, 'S1' Beach Basket on the boss,
// 'S2' Summer Garden, 'S3' Gentle Sea Breeze on Miyu, 'HL' her Highlight on
// Miyu, 'M:<id>' a Flower Basket Pharmacy medicine on Miyu. Highlights and
// medicines must be legal on their own; a plan that needs more is rejected.
// Best legal plan from --search (2026-10-08, 4 seeds, wider medicine set).
let MARIAN_PLAN = {
  T1: ['S1'], T2: ['S1'], T3: ['S1'], T4: ['S2'], T5: ['S2'], T6: ['S2'], T7: ['G'], T8: ['HL', 'S3'],
  T9: ['M:attack_tablet', 'S2'], B1: ['M:reso_up', 'S3'], B2: ['HL', 'M:fighter_salve', 'S1'], B3: ['S2'], B4: ['M:attack_tablet', 'G']
};
function marianTurn(e, moves) {
  expectActor(e, marian.id);
  for (const code of moves) {
    if (e.actor?.id !== marian.id || e.state.phase !== 'battle') break;
    if (code === 'HL') {
      const legal = e.getHighlightActions().find(item => item.actorId === marian.id && item.enabled);
      if (!legal) throw new Error(`Marian Highlight not ready at T${e.state.attackTurn}`);
      e.stepHighlight(legal.skillId, miyu.id);
    } else if (code.startsWith('M:')) {
      const id = code.slice(2);
      if (!e.getMedicineActions().some(item => item.id === id)) throw new Error(`Marian medicine ${id} not available at T${e.state.attackTurn}`);
      e.stepMedicine(id, miyu.id);
    } else if (code === 'G') act(e, marian.id, 'guard');
    else {
      const target = code === 'S1' ? 'boss' : code === 'S2' ? 'party' : 'miyu';
      const legal = e.getAvailableActions().find(item => item.enabled && item.skill?.slot === code);
      if (!legal) throw new Error(`Marian ${code} not available at T${e.state.attackTurn}: ${e.getAvailableActions().filter(a => a.skill?.slot).map(a => `${a.skill.slot}:${a.enabled}:${a.unavailableReason || ''}:cost${a.cost}`).join(' ')} sp ${Math.round(e.actor.sp)}`);
      e.step({ type: legal.type, skillId: legal.skillId, targetId: targetId(e, target) });
    }
  }
}

function play(seed, marianPlan = MARIAN_PLAN) {
  const e = makeEngine(seed);
  // J&C's slot: her posted moves, or Marian's plan for that turn.
  const slot = (key, jcMoves) => TEAM === 'jc' ? jcMoves() : marianTurn(e, marianPlan[key]);
  const kotoneUnit = e.state.party.find(unit => unit.id === KOTONE);
  Object.assign(kotoneUnit, { crit: .354, critMult: 1.634, speed: 106.8 });
  e.runnerForcedResources = [];
  const rows = [];
  const J = jc.id, M = miyu.id;
  checkpoint(e, 'T1 opening Twin nuke', rows);
  // T1 (HP lock on from battle start)
  slot('T1', () => act(e, J, 'guard')); wonder(e, 'Sahimochi-no-kami', 'Wild Thunder'); kotone(e, 'guard');
  paddle(e); act(e, M, 'guard'); checkpoint(e, 'T1 end', rows);
  // T2-T3
  for (const turn of [2, 3]) {
    slot(`T${turn}`, () => act(e, J, 'guard')); wonder(e, 'Sahimochi-no-kami', 'Wild Thunder'); kotone(e, 'guard'); act(e, M, 'guard');
    checkpoint(e, `T${turn} end`, rows);
  }
  // T4
  slot('T4', () => act(e, J, 'guard')); wonder(e, 'Sahimochi-no-kami', 'Wild Thunder'); takemedic(e); act(e, M, 'guard'); checkpoint(e, 'T4 end', rows);
  // T5
  slot('T5', () => act(e, J, { slot: 'S1' })); wonder(e, 'Sahimochi-no-kami', 'Rebellion', 'buff'); staminaKit(e, 'wonder'); paddle(e);
  checkpoint(e, 'T5 end', rows);
  // T6
  highlight(e, M); slot('T6', () => act(e, J, { slot: 'S2' })); wonder(e, 'Yurlungur', 'Tarukaja', 'buff'); takemedic(e); paddle(e); act(e, M, 'guard');
  checkpoint(e, 'T6 end', rows);
  // T7
  miku(e, 'H1'); slot('T7', () => act(e, J, { slot: 'S1' })); wonder(e, 'Dionysus', 'Universal Theoria', 'buff'); if (TEAM === 'jc') highlight(e, J, 'boss', 'absurdity');
  kotone(e, { name: "Lyre's Melody" }, 'miyu'); paddle(e); checkpoint(e, 'T7 end', rows);
  // T8
  miku(e, 'S2'); slot('T8', () => act(e, J, { slot: 'S2' })); wonder(e, 'Sahimochi-no-kami', 'Chilling Depth'); kotone(e, { name: "Lyre's Melody" }, 'miyu');
  paddle(e); act(e, M, { slot: 'S1' }); checkpoint(e, 'T8 end', rows);
  // T9
  miku(e, 'F2'); slot('T9', () => { highlight(e, J, 'boss', 'mischief'); trueDesire(e); act(e, J, { slot: 'S1' }); });
  wonder(e, 'Dionysus', 'Cohesion', 'buff'); kotone(e, { name: "Lyre's Melody" }, 'miyu');
  paddle(e);
  // HP lock stays on for all of T9 and is switched off at the end of the turn.
  forced(e, { type: 'hp_lock_off' }); e.state.boss.lifeSustainment = false;
  checkpoint(e, 'T9 end (lock off)', rows);
  // B1
  miku(e, 'S3'); slot('B1', () => act(e, J, { slot: 'S2' }, 'minion')); highlight(e, 'wonder'); wonder(e, 'Yurlungur', 'Matarukaja', 'party');
  goForBroke(e); kotone(e, { name: 'Lunar Phaseshift' }, 'twin'); kotone(e, { name: "Burning Moon's Cry" });
  persona(e, 'Yurlungur'); highlight(e, 'wonder');
  goForBroke(e);
  for (let i = 0; i < 3 && e.actor?.id === KOTONE; i++) kotone(e, { name: "Burning Moon's Cry" });
  // Miyu's B1 Highlight is the automatic linked Highlight that fires when
  // Kotone's Go for Broke ends (user, 2026-10-01); the engine already casts it,
  // so it is not pressed here and spends no gauge or cooldown.
  if (TEAM === 'jc') highlight(e, J, 'minion', 'absurdity'); act(e, M, { slot: 'S2' }, 'minion');
  checkpoint(e, 'B1 end', rows);
  // B2
  slot('B2', () => act(e, J, { slot: 'S1' }, 'minion')); wonder(e, 'Dionysus', 'Universal Theoria', 'buff'); kotone(e, { type: 'kotone_cold' });
  highlight(e, M); act(e, M, { slot: 'S2' }); checkpoint(e, 'B2 end', rows);
  // B3
  miku(e, 'S1'); slot('B3', () => { trueDesire(e); act(e, J, { slot: 'S2' }, 'minion'); }); wonder(e, 'Dionysus', 'Cohesion', 'buff');
  kotone(e, { type: 'kotone_cold' }); act(e, M, { slot: 'S2' }); checkpoint(e, 'B3 end', rows);
  // B4 (only if the simulated battle is still running)
  if (e.state.phase !== 'battle') { forced(e, { type: 'battle_ended_before', step: 'B4', reason: e.state.result?.reason || e.state.phase }); checkpoint(e, 'B4 end', rows); return finish(e, rows); }
  miku(e, 'F1'); slot('B4', () => { highlight(e, J, 'boss', 'mischief'); act(e, J, { slot: 'S1' }, 'minion'); }); wonder(e, 'Sahimochi-no-kami', 'Chilling Depth');
  kotone(e, { name: "Lyre's Melody" }, 'miyu'); act(e, M, { slot: 'S2' }); checkpoint(e, 'B4 end', rows);
  return finish(e, rows);
}

function finish(e, rows) {
  return { rows, finalScore: e.state.result?.score ?? e.state.score, forcedResources: e.runnerForcedResources,
    damageByActor: Object.fromEntries(e.state.party.map(unit => [unit.slug || unit.id, Math.round(unit.damageDone)])),
    limitations: e.state.mechanicsLimitations };
}

const seeds = Array.from({ length: arg('seeds', 24) }, (_, i) => i + 1);
// --search (with --team=marian): pick Marian's moves turn by turn. A plan must
// play without errors and need no more forced steps than the posted J&C route
// (4: two Takemedics, the Stamina Kit and switching the HP lock off).
if (process.argv.includes('--search')) {
  TEAM = 'marian';
  const searchSeeds = seeds.slice(0, arg('search-seeds', 2));
  const forcedCap = 4;
  const evaluate = plan => {
    try {
      const results = searchSeeds.map(seed => play(seed, plan));
      if (results.some(run => run.forcedResources.length > forcedCap)) return null;
      return results.reduce((sum, run) => sum + run.finalScore, 0) / results.length;
    } catch { return null; }
  };
  const keys = Object.keys(MARIAN_PLAN);
  const skills = ['G', 'S1', 'S2', 'S3'];
  const options = key => key.startsWith('T') && Number(key.slice(1)) <= 4 ? skills.map(code => [code])
    : ['', 'HL'].flatMap(hl => ['', 'M:attack_tablet', 'M:fighter_salve', 'M:reso_up', 'M:highlight_up', 'M:one_more_up'].flatMap(med => skills.map(code => [hl, med, code].filter(Boolean))));
  // Start from guarding everywhere, then improve one turn at a time.
  let best = Object.fromEntries(keys.map(key => [key, ['G']]));
  let bestScore = evaluate(best);
  for (let pass = 0; pass < arg('passes', 3); pass++) {
    let improved = false;
    for (const key of keys) {
      for (const option of options(key)) {
        const plan = { ...best, [key]: option };
        const score = evaluate(plan);
        if (score != null && score > bestScore) { best = plan; bestScore = score; improved = true; }
      }
    }
    console.log(`pass ${pass + 1}: ${Math.round(bestScore).toLocaleString()} ${JSON.stringify(best)}`);
    if (!improved) break;
  }
  MARIAN_PLAN = best;
}
const runs = [];
for (const seed of seeds) {
  try { runs.push(play(seed)); } catch (error) { console.error(`Seed ${seed}: ${process.argv.includes("--stack") ? error.stack : error.message}`); process.exitCode = 1; break; }
}
if (runs.length === seeds.length) {
  const avg = (index, key) => Math.round(runs.reduce((sum, run) => sum + Number(run.rows[index][key] || 0), 0) / runs.length);
  const rows = runs[0].rows.map((row, index) => ({ label: row.label, attackTurn: row.attackTurn, phase: row.phase,
    weakened: row.weakened, lifeSustainment: row.lifeSustainment, enemies: row.enemies,
    score: avg(index, 'score'), totalDamage: avg(index, 'totalDamage') }));
  const output = { boss: 'surt', mode: 'devourer', team: TEAM, wonderBuffTarget: TEAM === 'marian' ? 'miyu' : WONDER_BUFFS, marianPlan: TEAM === 'marian' ? MARIAN_PLAN : null, seeds: seeds.length, rows, forcedResources: runs[0].forcedResources,
    damageByActor: runs[0].damageByActor, limitations: runs[0].limitations,
    finalScore: Math.round(runs.reduce((sum, run) => sum + run.finalScore, 0) / runs.length) };
  mkdirSync('outputs', { recursive: true });
  writeFileSync(`outputs/surt-dod-kotone-${TEAM}${TEAM === 'jc' ? `-buffs-${WONDER_BUFFS}` : ''}-2026-10-08.json`, JSON.stringify(output, null, 2) + '\n');
  console.table(rows.map(row => ({ checkpoint: row.label, turn: row.attackTurn, weakened: row.weakened, hpLock: row.lifeSustainment,
    points: Math.round(row.score / DIFFICULTY_COEFFICIENT).toLocaleString(), score: row.score.toLocaleString(), enemies: row.enemies })));
  console.log('forced/harness steps:', runs[0].forcedResources.length, '| final score', output.finalScore.toLocaleString());
}
