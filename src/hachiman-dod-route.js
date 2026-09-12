// Devourer of Dreams (DOD) Hachiman: Sleepy's all-A6 rotation as supplied by Joker
// on 2026-09-09 (recorded score 9,565,851,160), expressed in the shared route
// grammar. DOD rules per Joker: HP capped at 410,000 before the break, HP Lock
// only prevents HP going under 1, break damage scores 3x, shields work
// normally, turn limit 120. Difficulty and survival bonuses are unknown.
import { lufelCatalog } from './generated/lufel-catalog.js';
import { buildPersonaLoadoutCatalog } from './persona-loadout.js';
import {
  HACHIMAN_RECORDED_SEED, IN_BATTLE_PANEL_STATS, NAVIGATOR_SHARED_STATS, PERSONA_SKILL_ADAPTERS,
  combatSkill, createHachimanRecordedConfig, required, withNavigatorShare
} from './hachiman-recorded-team.js';

const clone = value => structuredClone(value);
const JC = 'lufel-recent-j-c';
const MARIAN = 'lufel-recent-marian-beachflower';
const BERRY = 'lufel-recent-berry';

export const SLEEPY_DOD_RECORDED_SCORE = 9565851160;

// Sleepy's Berry panel as supplied; HP, Defense and Speed are not supplied and
// stay on Joker's panel values.
export const SLEEPY_BERRY_PANEL = Object.freeze({ attack: 5127, critRate: 52.4, critMult: 242.9, pierceRate: 9.7, damageBonus: 45.7 });

// Loadout labels supplied: Twins Harmony + Victory (S1 F/I, S2 P/N), Marian
// Trust + Power, MIKU Integrity + Labor. Only the catalog's structured set
// fields are applied (Victory set2 wind +10%, Power set2 own Attack +12%);
// Victory set4 (25% extra hit) and Power set4 (+10% Attack per 6 turns, up to
// 3 stacks) are not modeled.
export const SLEEPY_ASSUMPTIONS = Object.freeze([
  'J&C, Marian, Wonder and MIKU stats are Joker\'s panels, not Sleepy\'s.',
  'Hachiman\'s Dreamscape stage effects (+30% continuous damage, +20% Curse, the skill/Resonance critical conversion, the composition +20% final damage taken) apply in DOD as in Multidimensional Dreamscape (Joker, 2026-09-09).',
  'Difficulty bonus and survival bonus for DOD are unknown; the result is reported as points, with x8 shown only as a what-if.',
  '"Takemedic" is modeled as Marian using DOT-Up on Berry from her prescriptions. Sleepy\x27s "Item + skill" pairs are read as her free Potent Medicine (an ordinary item ends her turn); only the second B2 item (HL-Up) is an ordinary item.',
  '"Guard or Heal" rounds use Guard for everyone.',
  'Item stock is set to 3 of each Dreamscape item so the route\'s repeated DoT and DMG items are legal; the real DOD inventory is unknown.',
  'True Desire ("A6 button") presses that the recharge (eight J&C counted actions, Joker\'s live run 2026-09-10) has not restored are skipped rather than failing the route.',
  'A6 Summer Marian\'s basket does not consume medicine (Joker, 2026-09-11); one basket use per Marian turn is the only limit.',
  'Sleepy\'s Janosik carries Matarukaja; Joker\'s does not (Tatra Shot, Rakunda, Tarukaja) and Joker\'s Dionysus has Tarukaja instead of Rakunda (live run 2026-09-10).'
]);

function personaSet(owner = 'sleepy') {
  const catalog = buildPersonaLoadoutCatalog(lufelCatalog);
  const transferable = name => required(catalog.transferableSkills.find(skill => skill.name === name), `Missing Persona skill ${name}.`);
  const persona = name => required(lufelCatalog.personas.find(item => item.name === name), `Missing ${name}.`);
  const adapt = (skill, index, extra = {}) => {
    const adapter = PERSONA_SKILL_ADAPTERS[skill.name];
    return combatSkill(skill, index, adapter ? { cost: adapter.cost, ...(adapter.debuff ? { debuff: clone(adapter.debuff) } : {}), ...(adapter.buff ? { buff: clone(adapter.buff) } : {}), ...(adapter.runnerPer500Attack ? { runnerPer500Attack: adapter.runnerPer500Attack, runnerPer500AttackCap: adapter.runnerPer500AttackCap } : {}), sourceConfidence: adapter.sourceConfidence, ...extra } : extra);
  };
  const dionysus = persona('Dionysus');
  const vasuki = persona('Vasuki');
  const janosik = persona('Janosik');
  const define = (p, skills) => ({ id: p.id, name: p.name, arcana: p.position || `Grade ${p.grade}`, element: p.element, trait: p.passive?.at(-1)?.name || p.description, source: 'Local Lufelnet catalog with DOD route adapters', skills });
  return [
    define(dionysus, [
      combatSkill(required(dionysus.skills.find(skill => skill.kind === 'unique' && skill.name === 'Revolution'), 'Missing Revolution.'), 0, { cost: 22 }),
      adapt(transferable('Universal Theoria'), 1, { cost: 24 }),
      // Joker's Dionysus carries Tarukaja in the third slot (live run 2026-09-10).
      owner === 'joker' ? adapt(transferable('Tarukaja'), 2) : adapt(transferable('Rakunda'), 2)
    ]),
    define(vasuki, [
      adapt(required(vasuki.skills.find(skill => skill.name === 'Venomous Spiral'), 'Missing Venomous Spiral.'), 0),
      adapt(transferable('Media'), 1, { cost: 23 }),
      adapt(transferable('Rakunda'), 2)
    ]),
    define(janosik, owner === 'joker' ? [
      adapt(transferable('Tatra Shot'), 0, { cost: 22 }),
      adapt(transferable('Rakunda'), 1),
      adapt(transferable('Tarukaja'), 2)
    ] : [
      adapt(transferable('Tatra Shot'), 0, { cost: 22 }),
      adapt(transferable('Tarukaja'), 1),
      adapt(transferable('Matarukaja'), 2, { cost: 22 })
    ])
  ];
}

export function createHachimanDodConfig(seed = HACHIMAN_RECORDED_SEED, options = {}) {
  const base = createHachimanRecordedConfig(seed, 'normal_weakness_cast_rates', options);
  const config = base.config;
  config.modeId = 'devourer';
  // In the game the lock is off at T1 and Berry's T1 hit is about 300,000 (Joker,
  // 2026-09-09), so no break occurs before the lock goes on at T2. The model's T1
  // is inflated by the known early Lovesick tick overshoot and would break the
  // boss on turn 1, so the lock starts on here; the 410,000 cap makes the
  // pre-break points identical either way. The T2 "HP Lock ON" step is a no-op.
  config.lifeSustainment = true;
  config.jcMaskPair = ['mischief', 'absurdity'];
  config.itemInventory = { dot_up: 3, attack_tablet: 3, fighter_salve: 3, highlight_up: 3 };
  // options.personaOwner = 'joker' uses Joker's observed Persona skill slots.
  const personaOwner = options.personaOwner === 'joker' ? 'joker' : 'sleepy';
  const personas = personaSet(personaOwner);
  // A6 Summer Marian does not consume medicine (Joker, 2026-09-11); unlimited unless a what-if sets a budget.
  if (Number(options.marianPrescriptions) > 0) config.marianPrescriptions = Number(options.marianPrescriptions);
  config.personaDefinitions = personas;
  config.personaIds = personas.map(persona => persona.id);
  // options.berryPanel = 'joker' keeps Joker's own Berry (the recorded preset) for
  // planning his run; the default is Sleepy's panel for validation.
  const berryLoadout = config.loadouts[BERRY];
  if (options.berryPanel !== 'joker') config.loadouts[BERRY] = withNavigatorShare(base.berry, {
    ...berryLoadout,
    navigatorShareApplied: false,
    baseStats: { ...berryLoadout.baseStats, ...SLEEPY_BERRY_PANEL, attack: SLEEPY_BERRY_PANEL.attack, critRate: SLEEPY_BERRY_PANEL.critRate, critMult: SLEEPY_BERRY_PANEL.critMult, pierceRate: SLEEPY_BERRY_PANEL.pierceRate, damageBonus: SLEEPY_BERRY_PANEL.damageBonus },
    statsPresetId: 'sleepy-berry-dod-2026-09-09'
  });
  // The recorded-team share helper already added the share to the preset
  // values; rebuild from the panel so it is added exactly once.
  const share = NAVIGATOR_SHARED_STATS.partyBonus;
  if (options.berryPanel !== 'joker') config.loadouts[BERRY].baseStats = {
    ...berryLoadout.baseStats,
    attack: SLEEPY_BERRY_PANEL.attack + share.attack,
    critRate: SLEEPY_BERRY_PANEL.critRate + share.critRate,
    critMult: SLEEPY_BERRY_PANEL.critMult + share.critMult,
    pierceRate: SLEEPY_BERRY_PANEL.pierceRate + share.pierceRate,
    damageBonus: SLEEPY_BERRY_PANEL.damageBonus + share.damageBonus
  };
  config.loadouts[JC] = { ...config.loadouts[JC], jcMasks: ['mischief', 'absurdity'], revelationMain: 'Harmony', revelationSet: 'Victory', revelationName: 'Harmony / Victory', revelationCombat: { elementBonus: { element: 'wind', value: 0.1 } } };
  const power = lufelCatalog.revelationSets.find(set => set.name === 'Power');
  config.loadouts[MARIAN] = { ...config.loadouts[MARIAN], revelationMain: 'Trust', revelationSet: 'Power', revelationName: 'Trust / Power', revelationCombat: clone(power?.combat || {}) };
  return { ...base, config, personas };
}

const skill = (actor, slot, target, concert = false) => ({ expectedActorId: actor, expectedConcert: concert, type: 'skill', slot, target });
const named = (actor, name, target, concert = false) => ({ expectedActorId: actor, expectedConcert: concert, type: 'skill', name, target });
const guard = (actor, concert = false) => ({ expectedActorId: actor, expectedConcert: concert, kind: 'guard', target: 'self' });
const navigator = (actor, name, concert = false) => ({ expectedActorId: actor, expectedConcert: concert, kind: 'navigator', name, target: 'party' });
const song = (actor, name, concert = false) => ({ expectedActorId: actor, expectedConcert: concert, kind: 'setSong', nextSong: name });
const highlight = (turnActor, owner, target, concert = false) => ({ expectedActorId: turnActor, expectedConcert: concert, kind: 'highlight', actorId: owner, target, forceGauge: true });
const maskHighlight = (turnActor, mask, concert = false) => ({ expectedActorId: turnActor, expectedConcert: concert, kind: 'selectedMaskHL', actorId: JC, mask, target: 'party', forceGauge: true });
const medicine = (id, concert = false) => ({ expectedActorId: MARIAN, expectedConcert: concert, kind: 'medicine', id, target: 'berry' });
const item = (id, concert = false) => ({ expectedActorId: MARIAN, expectedConcert: concert, kind: 'item', id, target: 'berry' });
const trueDesire = (actor, concert = false) => ({ expectedActorId: actor, expectedConcert: concert, kind: 'trueDesire', target: 'self', optional: true });
const lock = (actor, enabled) => ({ expectedActorId: actor, expectedConcert: false, kind: 'lifeSustainment', enabled, target: 'boss' });
const sw = (name, concert = false) => ({ expectedActorId: 'wonder', expectedConcert: concert, kind: 'switch', type: 'switch', name, target: 'self' });

const allGuard = (label, concert = false) => [
  [`${label} Twins Guard`, guard(JC, concert)], [`${label} Wonder Guard`, guard('wonder', concert)],
  [`${label} Marian Guard`, guard(MARIAN, concert)], [`${label} Berry Guard`, guard(BERRY, concert)]
];

export const SLEEPY_DOD_ROUTE = Object.freeze({
  T1: [
    ['T1 Twins A6 button', trueDesire(JC)], ['T1 Twins Guard', guard(JC)],
    ['T1 Wonder Guard', guard('wonder')], ['T1 Marian Guard', guard(MARIAN)],
    ['T1 Berry S1 on first add', skill(BERRY, 'S1', 'first_add')]
  ],
  T2: [
    ['T2 HP Lock ON', lock(JC, true)], ['T2 Twins Guard', guard(JC)], ['T2 Wonder Guard', guard('wonder')],
    ['T2 Berry Highlight boss', highlight(MARIAN, BERRY, 'boss')],
    ['T2 Marian S3 on Berry', skill(MARIAN, 'S3', 'berry')], ['T2 Berry S3 boss', skill(BERRY, 'S3', 'boss')]
  ],
  T3: [['T3 MIKU song Heaven', song(JC, 'Heaven')], ['T3 MIKU Heaven S2', navigator(JC, 'Clear Sound')], ...allGuard('T3')],
  T4: [['T4 MIKU song Spring Storm', song(JC, 'Spring Storm')], ['T4 MIKU Spring S1', navigator(JC, 'Feel the Beat')], ...allGuard('T4')],
  T5: [
    ['T5 MIKU song Play-With-Fire', song(JC, 'Play-With-Fire')], ['T5 MIKU Fire S1', navigator(JC, 'Feel the Beat')],
    ['T5 Twins Guard', guard(JC)], ['T5 Wonder Guard', guard('wonder')], ['T5 Marian Guard', guard(MARIAN)],
    ['T5 Berry S3 boss', skill(BERRY, 'S3', 'boss')]
  ],
  T6: [
    ['T6 Berry Highlight boss', highlight(JC, BERRY, 'boss')], ['T6 MIKU Showstopper', navigator(JC, 'Showstopper')],
    ['T6 Twins Guard', guard(JC, true)], ['T6 Wonder Guard', guard('wonder', true)],
    ['T6 Marian S3 on Berry', skill(MARIAN, 'S3', 'berry', true)],
    // Second T6 Highlight comes from the gauge (Concert doubles charge); the
    // once-per-battle Chain 4 free Highlight is the "Alt HL" at B2.
    ['T6 Berry second Highlight boss', highlight(BERRY, BERRY, 'boss', true)],
    ['T6 Berry Guard', guard(BERRY, true)]
  ],
  T7: allGuard('T7', true),
  T8: allGuard('T8'),
  T9: [['T9 Twins Guard', guard(JC)], ['T9 Wonder Guard', guard('wonder')], ['T9 Marian S3 on Berry', skill(MARIAN, 'S3', 'berry')], ['T9 Berry S3 boss', skill(BERRY, 'S3', 'boss')]],
  T10: allGuard('T10'),
  T11: [['T11 Berry Highlight boss', highlight(JC, BERRY, 'boss')], ...allGuard('T11')],
  T12: [['T12 Twins Guard', guard(JC)], ['T12 Wonder Guard', guard('wonder')], ['T12 Marian S3 on Berry', skill(MARIAN, 'S3', 'berry')], ['T12 Berry S3 boss', skill(BERRY, 'S3', 'boss')]],
  T13: [['T13 Twins Guard', guard(JC)], ['T13 Wonder Guard', guard('wonder')], ['T13 Marian DOT-Up on Berry', medicine('dot_up')], ['T13 Marian Guard', guard(MARIAN)], ['T13 Berry Guard', guard(BERRY)]],
  T14: allGuard('T14'),
  T15: [
    ['T15 Berry Highlight boss', highlight(JC, BERRY, 'boss')], ['T15 Twins Guard', guard(JC)], ['T15 Wonder Guard', guard('wonder')],
    ['T15 Marian DOT-Up on Berry', medicine('dot_up')], ['T15 Marian S3 on Berry', skill(MARIAN, 'S3', 'berry')], ['T15 Berry S3 boss', skill(BERRY, 'S3', 'boss')]
  ],
  T16: [
    ['T16 MIKU song Heaven', song(JC, 'Heaven')], ['T16 MIKU Heaven S1', navigator(JC, 'Feel the Beat')],
    ['T16 Twins S2 P/N boss', skill(JC, 'S2', 'boss')],
    ['T16 Wonder switch to Vasuki', sw('Vasuki')], ['T16 Vasuki Venomous Spiral boss', named('wonder', 'Venomous Spiral', 'boss')],
    ['T16 Marian Highlight on Berry', highlight(MARIAN, MARIAN, 'berry')], ['T16 Marian S2 Summer Garden', skill(MARIAN, 'S2', 'party')],
    ['T16 Berry Guard', guard(BERRY)]
  ],
  T17: [
    ['T17 MIKU song Play-With-Fire', song(JC, 'Play-With-Fire')], ['T17 MIKU Fire S1', navigator(JC, 'Feel the Beat')],
    ['T17 Twins S1 F/I boss (A6 nuke)', skill(JC, 'S1', 'boss')],
    ['T17 Wonder switch to Dionysus', sw('Dionysus')], ['T17 Dionysus Rakunda boss', named('wonder', 'Rakunda', 'boss')],
    ['T17 Marian DOT-Up on Berry', medicine('dot_up')], ['T17 Marian S1 Beach Basket', skill(MARIAN, 'S1', 'party')],
    ['T17 Berry Guard', guard(BERRY)]
  ],
  T18: [
    ['T18 MIKU song Spring Storm', song(JC, 'Spring Storm')], ['T18 MIKU Spring S2', navigator(JC, 'Clear Sound')],
    ['T18 Twins F/I Highlight', maskHighlight(JC, 'mischief')], ['T18 Twins A6 button', trueDesire(JC)], ['T18 Twins S2 P/N boss', skill(JC, 'S2', 'boss')],
    ['T18 Wonder switch to Janosik', sw('Janosik')], ['T18 Janosik Tarukaja on Berry', named('wonder', 'Tarukaja', 'berry')],
    ['T18 Marian Attacker Tablet on Berry', medicine('attack_tablet')], ['T18 Marian S3 on Berry', skill(MARIAN, 'S3', 'berry')],
    ['T18 HP Lock OFF', lock(BERRY, false)], ['T18 Berry S3 boss (break)', skill(BERRY, 'S3', 'boss')]
  ],
  B1: [
    ['B1 MIKU Showstopper', navigator(JC, 'Showstopper')],
    ['B1 Twins S1 F/I boss (A6 nuke)', skill(JC, 'S1', 'boss', true)],
    ['B1 Wonder switch to Dionysus', sw('Dionysus', true)], ['B1 Dionysus Universal Theoria on Berry', named('wonder', 'Universal Theoria', 'berry', true)],
    ['B1 Marian Highlight on Berry', highlight(MARIAN, MARIAN, 'berry', true)], ['B1 Marian Fighter Salve on Berry', medicine('fighter_salve', true)], ['B1 Marian S2 Summer Garden', skill(MARIAN, 'S2', 'party', true)],
    ['B1 Berry S3 boss', skill(BERRY, 'S3', 'boss', true)]
  ],
  B2: [
    ['B2 Twins F/I Highlight', maskHighlight(JC, 'mischief', true)], ['B2 Twins S2 P/N boss', skill(JC, 'S2', 'boss', true)],
    ['B2 Wonder switch to Janosik', sw('Janosik', true)], ['B2 Janosik Matarukaja', named('wonder', 'Matarukaja', 'party', true)],
    ['B2 Marian DOT-Up on Berry', medicine('dot_up', true)], ['B2 Marian HL-Up item on Berry', item('highlight_up', true)],
    ['B2 Berry Highlight boss', highlight(BERRY, BERRY, 'boss', true)],
    ['B2 Berry free Highlight boss', { expectedActorId: BERRY, expectedConcert: true, kind: 'freeHL', target: 'boss' }],
    ['B2 Berry Alt S3 boss', { expectedActorId: BERRY, expectedConcert: true, kind: 'berryAlt', slot: 'S3', target: 'boss' }]
  ],
  B3: [
    ['B3 MIKU song Spring Storm', { expectedActorId: JC, expectedConcert: false, kind: 'setSong', nextSong: 'Spring Storm' }], ['B3 MIKU Spring S1', navigator(JC, 'Feel the Beat')],
    ['B3 Twins A6 button', trueDesire(JC)], ['B3 Twins S1 F/I boss', skill(JC, 'S1', 'boss')],
    ['B3 Wonder switch to Dionysus', sw('Dionysus')], ['B3 Dionysus Universal Theoria on Berry', named('wonder', 'Universal Theoria', 'berry')],
    ['B3 Marian S3 on Berry', skill(MARIAN, 'S3', 'berry')],
    ['B3 Berry S3 boss', skill(BERRY, 'S3', 'boss')]
  ],
  B4: [
    ['B4 MIKU song Play-With-Fire', { expectedActorId: JC, expectedConcert: false, kind: 'setSong', nextSong: 'Play-With-Fire' }], ['B4 MIKU Fire S1', navigator(JC, 'Feel the Beat')],
    ['B4 Twins P/N Highlight', maskHighlight(JC, 'absurdity')], ['B4 Twins S2 P/N boss', skill(JC, 'S2', 'boss')],
    ['B4 Wonder switch to Vasuki', sw('Vasuki')], ['B4 Vasuki Venomous Spiral boss', named('wonder', 'Venomous Spiral', 'boss')],
    ['B4 Marian Fighter Salve on Berry', medicine('fighter_salve')], ['B4 Marian S2 Summer Garden', skill(MARIAN, 'S2', 'party')],
    ['B4 Berry S3 boss', skill(BERRY, 'S3', 'boss')]
  ]
});

export const SLEEPY_DOD_TURNS = Object.freeze(Object.keys(SLEEPY_DOD_ROUTE));

// Route grammar helpers and unit ids for scripts that build DOD route variants.
export const DOD_ROUTE_HELPERS = Object.freeze({ JC, MARIAN, BERRY, skill, named, guard, navigator, song, highlight, maskHighlight, medicine, item, trueDesire, lock, sw, allGuard });
