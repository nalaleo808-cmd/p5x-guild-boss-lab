import {
  DREAMSCAPE_RESULT_FORMULA_EVIDENCE,
  DREAMSCAPE_SURVIVAL_HUD_OBSERVATIONS
} from './mode-scoring.js';

export const elementMeta = {
  none: { label: 'NONE', glyph: '·', color: '#77757d' },
  curse: { label: 'CURSE', glyph: '◆', color: '#a756dc' },
  almighty: { label: 'ALMIGHTY', glyph: '✦', color: '#dedede' },
  psychic: { label: 'PSY', glyph: '◉', color: '#ec5daf' },
  wind: { label: 'WIND', glyph: '↟', color: '#4dcf7a' },
  bless: { label: 'BLESS', glyph: '✧', color: '#f0d36f' },
  physical: { label: 'PHYS', glyph: '✕', color: '#f07a58' },
  gun: { label: 'GUN', glyph: '⌁', color: '#b9bcc5' },
  fire: { label: 'FIRE', glyph: '▲', color: '#ff5a38' },
  ice: { label: 'ICE', glyph: '❄', color: '#6bc8ff' },
  electric: { label: 'ELEC', glyph: 'ϟ', color: '#ffd84a' },
  nuclear: { label: 'NUKE', glyph: '◌', color: '#78e7d6' },
  support: { label: 'SUPPORT', glyph: '+', color: '#62b7ff' }
};

export const personas = [
  {
    id: 'alice', name: 'Alice', arcana: 'Death', element: 'curse', trait: 'Die For Me!',
    skills: [
      { id: 'maeigaon', slot: 'S1', name: 'Maeigaon', element: 'curse', cost: 22, power: 1.7, target: 'boss', note: 'Heavy Curse damage.' },
      { id: 'curse_amp', slot: 'S2', name: 'Curse Amp', element: 'support', cost: 18, power: 0, target: 'boss', debuff: { id: 'curse_vuln', name: 'Curse Exposed', value: 0.25, duration: 2 }, note: 'Curse damage taken +25% for 2 rounds.' },
      { id: 'megidola', slot: 'S3', name: 'Megidola', element: 'almighty', cost: 30, power: 2.05, target: 'boss', note: 'Severe Almighty damage.' }
    ]
  },
  {
    id: 'trumpeter', name: 'Trumpeter', arcana: 'Judgement', element: 'almighty', trait: 'Final Measure',
    skills: [
      { id: 'debilitate', slot: 'S1', name: 'Debilitate', element: 'support', cost: 20, power: 0, target: 'boss', debuff: { id: 'def_down', name: 'DEF ↓', value: 0.3, duration: 3 }, note: 'Boss DEF -30% for 3 rounds.' },
      { id: 'megidolaon', slot: 'S2', name: 'Megidolaon', element: 'almighty', cost: 32, power: 2.35, target: 'boss', note: 'Severe Almighty damage.' },
      { id: 'heat_riser', slot: 'S3', name: 'Heat Riser', element: 'support', cost: 24, power: 0, target: 'self', buff: { id: 'power_up', name: 'ATK ↑', value: 0.3, duration: 3 }, note: 'Wonder damage +30% for 3 rounds.' }
    ]
  },
  {
    id: 'yoshitsune', name: 'Yoshitsune', arcana: 'Tower', element: 'physical', trait: 'Peerless Blade',
    skills: [
      { id: 'hassou_tobi', slot: 'S1', name: 'Hassou Tobi', element: 'physical', cost: 26, power: 2.25, target: 'boss', note: 'Eight light Physical hits.' },
      { id: 'charge', slot: 'S2', name: 'Charge', element: 'support', cost: 16, power: 0, target: 'self', buff: { id: 'charge', name: 'Charged', value: 0.65, duration: 1 }, note: 'Next Physical action +65%.' },
      { id: 'brave_blade', slot: 'S3', name: 'Brave Blade', element: 'physical', cost: 20, power: 1.85, target: 'boss', note: 'Heavy Physical damage.' }
    ]
  }
];

export const roster = [
  {
    id: 'wonder', name: 'Wonder', codename: 'Wonder', role: 'Wildcard', element: 'almighty', maxHp: 920, maxSp: 180, attack: 225, crit: 0.14,
    portrait: 'W', artwork: '/assets/characters/wonder.png', accent: '#e61d2f', personas: personas.map(p => p.id), actionLimit: 1, maxAmmo: 8, gunPower: 0.62,
    skills: []
  },
  {
    id: 'joker', name: 'Ren Amamiya', codename: 'Joker', role: 'Sweeper', element: 'curse', artwork: '/assets/characters/joker.webp', maxHp: 850, maxSp: 170, attack: 248, crit: 0.2,
    portrait: 'J', accent: '#b832d8', actionLimit: 1, maxAmmo: 8, gunPower: 0.68,
    skills: [
      { id: 'eiha', slot: 'S1', name: 'Eigaon', element: 'curse', cost: 20, power: 1.75, target: 'boss', note: 'Heavy Curse damage.' },
      { id: 'trickster', slot: 'S2', name: 'Trickster', element: 'support', cost: 16, power: 0, target: 'self', buff: { id: 'trickster', name: 'Trickster', value: 0.32, duration: 2 }, note: 'Damage +32% for 2 rounds.' },
      { id: 'phantom_show', slot: 'S3', name: 'Phantom Show', element: 'curse', cost: 28, power: 2.15, target: 'boss', debuff: { id: 'curse_vuln', name: 'Curse Exposed', value: 0.2, duration: 2 }, note: 'Damage and Curse exposure.' }
    ]
  },
  {
    id: 'rin', name: 'Rin Nishimori', codename: 'Rin', role: 'Saboteur', element: 'psychic', artwork: '/assets/characters/rin.webp', maxHp: 900, maxSp: 190, attack: 205, crit: 0.12,
    portrait: 'R', accent: '#ed4a9f', actionLimit: 1, maxAmmo: 8, gunPower: 0.56,
    skills: [
      { id: 'psycho_blast', slot: 'S1', name: 'Psycho Blast', element: 'psychic', cost: 18, power: 1.45, target: 'boss', note: 'Medium Psychic damage.' },
      { id: 'mind_break', slot: 'S2', name: 'Mind Break', element: 'support', cost: 20, power: 0, target: 'boss', debuff: { id: 'def_down', name: 'DEF ↓', value: 0.28, duration: 3 }, note: 'Boss DEF -28% for 3 rounds.' },
      { id: 'latent_bloom', slot: 'S3', name: 'Latent Bloom', element: 'support', cost: 24, power: 0, target: 'party', buff: { id: 'team_amp', name: 'DMG ↑', value: 0.2, duration: 2 }, note: 'Party damage +20% for 2 rounds.' }
    ]
  },
  {
    id: 'mona', name: 'Morgana', codename: 'Mona', role: 'Medic', element: 'wind', artwork: '/assets/characters/mona.webp', maxHp: 820, maxSp: 210, attack: 190, crit: 0.1,
    portrait: 'M', accent: '#54c883', actionLimit: 1, maxAmmo: 8, gunPower: 0.52,
    skills: [
      { id: 'garula', slot: 'S1', name: 'Garula', element: 'wind', cost: 17, power: 1.4, target: 'boss', note: 'Medium Wind damage.' },
      { id: 'mediarama', slot: 'S2', name: 'Mediarama', element: 'support', cost: 24, power: 0, heal: 0.42, target: 'ally', note: 'Choose one ally and restore 42% HP.' },
      { id: 'miracle_punch', slot: 'S3', name: 'Miracle Punch', element: 'physical', cost: 22, power: 1.65, target: 'boss', critBonus: 0.28, note: 'High critical chance.' }
    ]
  }
];

export const navigator = {
  id: 'okyann', name: 'Kayo Tomiyama', codename: 'Okyann', portrait: 'O', artwork: '/assets/characters/okyann.webp', accent: '#4fb4ff',
  skills: [
    { id: 'opening_act', name: 'Opening Act', cooldown: 3, target: 'party', actionBonus: 1, buff: { id: 'nav_amp', name: 'NAV AMP', value: 0.28, duration: 2 }, note: 'Party damage +28% and current turn action limit +1.' },
    { id: 'encore', name: 'Encore', cooldown: 4, target: 'party', heal: 0.18, spRestore: 18, note: 'Restore 18% HP and 18 SP to all allies.' }
  ]
};

export const nightmareModes = [
  { id: 'nexus', name: 'Nexus of Dreams', note: 'Life Sustainment locks the linked enemies at 1 HP, then exactly 2 Weakened Attack Turns.' },
  {
    id: 'multidimensional',
    name: 'Multidimensional Dreamscape',
    note: 'One Hachiman result confirms the displayed result composition. Point accumulation and the ending trigger remain unresolved.',
    scoreModel: 'multidimensional_dreamscape_observed',
    evidenceStatus: 'partial_live_observation',
    evidenceId: DREAMSCAPE_RESULT_FORMULA_EVIDENCE.id
  },
  { id: 'devourer', name: 'Devourer of Dreams', note: 'Switch Life Sustainment off to reach 0 HP, then score at 3x during 2 infinite-HP Weakened boss turns.' }
];

export const multidimensionalDreamscapeEvidence = Object.freeze({
  modeId: 'multidimensional',
  scoreModel: 'multidimensional_dreamscape_observed',
  status: 'partial_live_observation',
  modeText: "Each turn, the boss's attacks grow stronger, and you get more points!",
  resultFormula: DREAMSCAPE_RESULT_FORMULA_EVIDENCE,
  hudMultiplierObservations: DREAMSCAPE_SURVIVAL_HUD_OBSERVATIONS,
  accumulation: Object.freeze({
    foeDefensePoints: 'unknown',
    turnsSurvivedBonus: 'unknown',
    hudMultiplierSchedule: 'observed_for_one_run_not_a_validated_general_rule'
  }),
  endTrigger: Object.freeze({
    status: 'unknown',
    observation: 'Attack Turns Left reached 0, then play continued through Wonder Action 40 before Auto produced the result.'
  }),
  observedRun: Object.freeze({
    bossId: 'hachiman',
    difficulty: 'NIGHTMaRe',
    result: Object.freeze({
      foeDefensePoints: 258_098_432,
      turnsSurvived: 6,
      turnsSurvivedBonus: 125_000,
      difficultyBonus: 8,
      finalScore: 2_065_787_456
    }),
    initialAction: 6,
    initialAttackTurnsLeft: 5,
    postZeroPlayableAction: 40
  }),
  source: Object.freeze({
    kind: 'direct_live_observation_log',
    reference: 'LIVE-BATTLE-CHECK-2026-09-04.md',
    observedOn: '2026-09-04'
  })
});

export const bosses = [
  {
    id: 'slaughter_drive', name: 'Slaughter Drive', subtitle: 'Nexus of Dreams · Recorded Benchmark', level: 78,
    artwork: '/assets/bosses/slaughter-drive.png',
    maxHp: 209244, finiteHp: true, defense: 385, weakness: 'electric', resistance: 'none', turnLimit: 8,
    scoreMultiplier: 1, scoreAttack: true, scoreModel: 'recorded_nightmare',
    defaultMode: 'nexus', difficultyBonus: 4, bossAttackPoints: 250000, weakenedTurns: 2,
    hpLockDamage: 827135,
    basePointScale: 1, weakenedPointScale: 3.67084627298469,
    downedDamageTaken: 0.8,
    encounter: {
      kind: 'fixed_five_targets',
      soulLink: true,
      lifeSustainment: true,
      note: 'One Slaughter Drive and four Scarlet Turrets share a linked HP percentage. Life Sustainment keeps every linked enemy at 1 HP while enabled.'
    },
    summons: [
      { id: 'crimson_turret_1', name: 'Scarlet Turret I', kind: 'scarlet_turret', maxHp: 154474, finiteHp: true, soulLinked: true, defense: 385, weakness: 'electric', resistance: 'none', downMax: 6, downedDamageTaken: 0.8, scoreAttack: true, position: 'far-left' },
      { id: 'crimson_turret_2', name: 'Scarlet Turret II', kind: 'scarlet_turret', maxHp: 154474, finiteHp: true, soulLinked: true, defense: 385, weakness: 'electric', resistance: 'none', downMax: 6, downedDamageTaken: 0.8, scoreAttack: true, position: 'left' },
      { id: 'crimson_turret_3', name: 'Scarlet Turret III', kind: 'scarlet_turret', maxHp: 154474, finiteHp: true, soulLinked: true, defense: 385, weakness: 'electric', resistance: 'none', downMax: 6, downedDamageTaken: 0.8, scoreAttack: true, position: 'right' },
      { id: 'crimson_turret_4', name: 'Scarlet Turret IV', kind: 'scarlet_turret', maxHp: 154474, finiteHp: true, soulLinked: true, defense: 385, weakness: 'electric', resistance: 'none', downMax: 6, downedDamageTaken: 0.8, scoreAttack: true, position: 'far-right' }
    ],
    phases: [
      { threshold: 1, name: 'Life Sustainment · HP Lock', defense: 385 },
      { threshold: 0.25, name: 'Weakened · Infinite HP · 2 Boss Turns', defense: 385 }
    ]
  },
  {
    id: 'vishnu', name: 'Vishnu', subtitle: 'Video Timing Model · Provisional 75% / 50% Gates', level: 90,
    artwork: '/assets/bosses/vishnu.png',
    maxHp: 450000, defense: 385, weakness: 'electric', resistance: 'none', turnLimit: 8,
    scoreMultiplier: 1, scoreAttack: true, defaultMode: 'nexus', downMax: 5, actionScale: 0.25,
    enemyTimingModel: 'anchored_enemy_turns',
    encounter: {
      kind: 'threshold_clones',
      thresholdConfidence: 'provisional',
      thresholdNote: 'The recording confirms 1, then 3, then 5 Vishnus. Exact HP gates and clone HP remain unverified; the gates are editable below.',
      initialEnemyAnchor: 'before_last_party',
      cloneDefinitions: [
        { id: 'vishnu_copy_2', name: 'Vishnu II', maxHp: 999999999, position: 'far-left' },
        { id: 'vishnu_copy_3', name: 'Vishnu III', maxHp: 999999999, position: 'left' },
        { id: 'vishnu_copy_4', name: 'Vishnu IV', maxHp: 999999999, position: 'right' },
        { id: 'vishnu_copy_5', name: 'Vishnu V', maxHp: 999999999, position: 'far-right' }
      ],
      cloneThresholds: [
        { hpRatio: 0.75, totalEnemies: 3, cloneIds: ['vishnu_copy_2', 'vishnu_copy_3'] },
        { hpRatio: 0.5, totalEnemies: 5, cloneIds: ['vishnu_copy_4', 'vishnu_copy_5'] }
      ]
    },
    phases: [
      { threshold: 1, name: 'One Vishnu', defense: 385 },
      { threshold: 0.75, name: 'Three Vishnus', defense: 385 },
      { threshold: 0.5, name: 'Five Vishnus', defense: 385 }
    ]
  },
  {
    id: 'hachiman', name: 'Hachiman', subtitle: 'Multidimensional Dreamscape · Live Observation', level: 82,
    artwork: '/assets/bosses/hachiman-goofy.png',
    // Lufelnet Defense Reduction Calc, Hachiman row (user screenshot 2026-09-06):
    // base Defense 821, boss Defense coefficient 258.4%. The boss model is
    // 1400 / (1400 + baseDef x defCoef), reductions subtract from the
    // coefficient and Pierce scales the remainder. Supersedes the 567 x 263.2%
    // area-boss example used earlier the same day.
    maxHp: 99999999, finiteHp: false, defense: 2121.464, baseDefense: 821, defenseCoefficient: 2.584,
    defenseEvidence: 'lufelnet_defense_calc_hachiman_row_2026-09-06',
    weakness: 'curse', resistance: 'none',
    resistances: ['fire', 'ice', 'electric', 'nuclear'],
    immunities: ['instant_kill', 'spiritual_ailment', 'control_ailment'],
    turnLimit: 5, previewAttackTurns: 6,
    previewLimitNote: 'Six party turns match the observed run length; this is a preview stop, not a verified game-end trigger.',
    defaultMode: 'multidimensional', difficultyBonus: 8,
    scoreModel: 'multidimensional_dreamscape_observed', scoreEvidence: multidimensionalDreamscapeEvidence,
    finalDamageTakenMultiplier: 1.2, finalDamageDealtMultiplier: 0.4,
    specialEffect: 'Increase final damage taken by 20% and decrease final damage dealt by 60%.',
    scoreMultiplier: 1, scoreAttack: true,
    minionKillBonus: { id: 'minion_break', name: 'MINION BREAK', value: 0.4, duration: 1 },
    liveDaisoujouProfile: {
      level: 82, speed: 80, weakness: 'curse', resistance: 'none',
      resistances: ['physical', 'gun', 'bless'],
      damageTakenPerStack: 0.1, damageTakenStackCap: 4,
      stackDuration: null, durationKnown: false,
      damageTakenEvidence: 'user_correction_daisoujou_10_percent_2026-09-05',
      evidence: 'user_photo_daisoujou_2026-09-05'
    },
    // The opening live run cleared all four idols with Berry S1 and showed none
    // at Attack Turn 2. This prevents only the generic turn-end respawn; a
    // future observed scripted summon must call the explicit respawn path.
    summonRespawnPolicy: 'scripted_only',
    summons: [
      { id: 'idol_left_a', species: 'daisoujou', name: 'Left Idol A', artwork: '/assets/bosses/dreamscape-idol-goofy.png', maxHp: 180000, defense: 240, weakness: 'fire', resistance: 'curse', downMax: 3, position: 'far-left' },
      { id: 'idol_left_b', species: 'daisoujou', name: 'Left Idol B', artwork: '/assets/bosses/dreamscape-idol-goofy.png', maxHp: 180000, defense: 240, weakness: 'ice', resistance: 'curse', downMax: 3, position: 'left' },
      { id: 'idol_right_a', species: 'daisoujou', name: 'Right Idol A', artwork: '/assets/bosses/dreamscape-idol-goofy.png', maxHp: 180000, defense: 240, weakness: 'fire', resistance: 'curse', downMax: 3, position: 'right' },
      { id: 'idol_right_b', species: 'daisoujou', name: 'Right Idol B', artwork: '/assets/bosses/dreamscape-idol-goofy.png', maxHp: 180000, defense: 240, weakness: 'ice', resistance: 'curse', downMax: 3, position: 'far-right' }
    ],
    encounterEvidence: {
      status: 'partial_live_observation',
      infiniteHpHud: true,
      berserkNumericEffect: 'unknown',
      summonDefinitions: 'provisional_simulator_data',
      summonRespawnPolicy: 'live opening has no generic end-of-round respawn; later scripted respawns remain unverified'
    },
    phases: [{ threshold: 1, name: 'Score Phase · Infinite HP', defense: 2121.464, baseDefense: 821 }]
  },
  {
    id: 'surt', name: 'Surt', subtitle: 'MLD / NOD / DOD · Screenshot Sourced', level: 82,
    artwork: '/assets/bosses/surt.png',
    // Lufelnet Defense Reduction Calc screenshots supplied 2026-09-20:
    // Surt base Defense 821 and Jack-o'-Lantern base Defense 364. Both use
    // the NTMR boss Defense coefficient 258.4%, giving damage multipliers
    // 0.398 and 0.598 through 1400 / (1400 + baseDef x defCoef).
    maxHp: 99999999, finiteHp: false,
    defense: 2121.464, baseDefense: 821, defenseCoefficient: 2.584,
    defenseEvidence: 'lufelnet_defense_calc_surt_and_jack_2026-09-20',
    downMax: 4,
    weakness: 'ice', resistance: 'none',
    resistances: ['physical', 'gun', 'fire', 'nuclear'],
    immunities: ['instant_kill'],
    turnLimit: 5, previewAttackTurns: 6,
    previewLimitNote: 'The live MLD battle confirms six scored Attack Turns. HP and NOD/DOD ending rules remain provisional.',
    defaultMode: 'multidimensional', supportedModes: ['multidimensional', 'nexus', 'devourer'],
    difficultyBonus: 4, scoreMultiplier: 1, scoreAttack: true,
    scoreModel: 'multidimensional_dreamscape_observed',
    dreamscapeScoreVerified: true, turnsSurvivedBonus: 250000,
    specialEffects: [
      'At each Attack Turn end, foes gain 1 Berserk stack, up to 3. Berserk increases damage by a set amount that is not shown.',
      'All allies and enemies begin with 2 Ragnarok stacks and gain 2 more at each Attack Turn end, up to 10. Each stack increases damage by 5%; the HP loss amount is not shown.',
      'Party Ice damage is increased by 20%.',
      'Party Attack is increased by 25%. Resonance critical damage is increased by 25%.',
      'With a Guardian or Medic, foes deal 60% less final damage and take 20% more. Without one, foes deal 60% more final damage.',
      'Surt permanently nullifies insta-kill effects.',
      'Party ranged attacks deal 10% more damage. Gun damage gains an additional 20%.',
      'A party member whose ammo is depleted fully reloads after 2 turns. The exact owner or shared turn clock is still unverified.'
    ],
    encounter: {
      kind: 'surt_and_jack_o_lantern',
      initialRagnarokStacks: 2,
      ragnarokStacksPerTurn: 2, ragnarokStackCap: 10, ragnarokDamagePerStack: 0.05,
      berserkStacksPerTurn: 1, berserkStackCap: 3,
      partyIceDamageBonus: 0.2, partyAttackBonus: 0.25, resonanceCritDamageBonus: 0.25,
      rangedDamageBonus: 0.1, gunDamageBonus: 0.2, ammoReloadAfterTurns: 2,
      note: 'Live status panels show all allies and enemies at Ragnarok x2 during the opening turn. Every later Attack Turn adds 2 more, up to 10. Each stack increases damage by 5%. The set HP loss is not shown and is not modeled. Live Battle Intel confirms party Ice damage +20%, party Attack +25%, Resonance critical damage +25%, ranged damage +10%, Gun damage +20% more, and an ammo-depletion reload after 2 turns. Reload clock ownership is not yet modeled.'
    },
    summons: ['far-left', 'left', 'right', 'far-right'].map((position, index) => ({
      id: index === 0 ? 'jack_o_lantern' : `jack_o_lantern_${index + 1}`,
      species: 'jack_o_lantern', name: "Jack-o'-Lantern",
      artwork: '/assets/bosses/jack-o-lantern.png', maxHp: 180000, finiteHp: false,
      defense: 940.576, baseDefense: 364, defenseCoefficient: 2.584,
      defenseEvidence: 'lufelnet_defense_calc_surt_and_jack_2026-09-20',
      weakness: 'ice', weaknesses: ['physical', 'gun', 'ice', 'wind'],
      resistance: 'fire', resistances: ['fire'], downMax: 4, scoreAttack: true, position
    })),
    encounterEvidence: {
      status: 'battle_log_and_result_screen_2026-09-20',
      confirmed: ['MLD six-Attack-Turn limit', 'MLD result formula', '250,000 Turns Survived Bonus', 'difficulty bonus', 'level', 'affinities', 'Surt plus four Jack-o\'-Lanterns', 'Surt and Jack-o\'-Lantern Defense inputs', 'shared four-point Down gauges', 'Berserk stack gain and cap', 'Ragnarok stack gain, cap, and damage bonus', 'Guardian/Medic composition effect', 'Null Insta-kill', 'party Ice damage bonus', 'party Attack +25%', 'Resonance critical damage +25%', 'ranged damage bonus', 'Gun damage bonus', 'ammo reload delay'],
      result: {
        foeDefensePoints: 1_729_515_136, turnsSurvived: 6,
        turnsSurvivedBonus: 250_000, difficultyBonus: 4,
        finalScore: 6_919_060_544,
        formula: '(1,729,515,136 + 250,000) x 4 = 6,919,060,544',
        source: 'P5X_Battle_Log_20260920_151414 plus user-supplied result screen'
      },
      liveTrace: {
        source: 'live MLD Surt calibration run, 2026-09-19',
        team: ['Wonder', 'Ichigo Shikano', 'Beachflower Minami', 'Justine & Caroline', 'Hatsune Miku'],
        personaLoadout: ['Dionysus', 'Nian', 'Sahimochi-no-kami'],
        openingScore: 48212,
        action: 'Justine & Caroline S1 Mask of Mischief & Innocence targeting Surt',
        endingScore: 72611,
        scoreDelta: 24399,
        runtimePanels: {
          wonder: { displayName: 'Shunichi Kudo', level: 64, hp: 13944, maxHp: 13944, sp: 100, maxSp: 100 },
          marian: { displayName: 'Beachflower Minami', level: 80, hp: 17711, maxHp: 17711, sp: 100, maxSp: 100, partySlot: 3 }
        },
        note: 'A live trace for regression comparison only. It does not identify Surt HP, Defense, or the score conversion formula. Runtime panels captured during this trace verify the listed Wonder and Marian HP, SP, levels, and Marian party slot.'
      },
      unknown: ['numeric HP', 'Berserk damage amount', 'Ragnarok HP loss', 'ammo reload clock ownership', 'NOD and DOD score and ending rules', 'exact per-packet game rounding']
    },
    phases: [{ threshold: 1, name: "Surt and Jack-o'-Lantern · Escalating Shadows", defense: 2121.464, baseDefense: 821 }]
  },
  {
    id: 'shadow_ruin', name: 'Shadow of Ruin', subtitle: 'Nexus of Dreams · Nightmare IV', level: 90,
    artwork: '/assets/bosses/shadow-ruin.png',
    maxHp: 3250000, defense: 385, weakness: 'curse', resistance: 'physical', turnLimit: 8, scoreMultiplier: 1.12,
    phases: [
      { threshold: 1, name: 'Phase I · Iron Will', defense: 385 },
      { threshold: 0.65, name: 'Phase II · Fracture', defense: 340 },
      { threshold: 0.3, name: 'Phase III · Desperation', defense: 300 }
    ]
  },
  {
    id: 'abyssal_warden', name: 'Abyssal Warden', subtitle: 'Multi-Dimensional · Depth 7', level: 92,
    artwork: '/assets/bosses/abyssal-warden.png',
    maxHp: 2900000, defense: 360, weakness: 'psychic', resistance: 'curse', turnLimit: 8, scoreMultiplier: 1.18,
    phases: [
      { threshold: 1, name: 'Phase I · Watchful', defense: 360 },
      { threshold: 0.5, name: 'Phase II · Open Core', defense: 290 }
    ]
  }
];

export const recordedNightmareBenchmark = Object.freeze({
  source: 'Steam recording captured 2026-08-29',
  encounter: 'Slaughter Drive',
  difficulty: 'Nightmare',
  duration: '16:52',
  baseDamagePoints: 827135,
  weakenedDamagePoints: 909555392,
  baseRawDamage: 827135,
  weakenedRawDamage: 59789832,
  bossAttackPoints: 250000,
  difficultyBonus: 4,
  finalScore: 3642530108,
  confirmedMechanics: [
    'Persona selection is free. The selected Persona skill is the counted action.',
    'Navigator support, Highlights, medicine, and Catch a Wave resolve without consuming the current Action.',
    'Fighter Salve grants 25% damage for 1 turn.',
    'Catch a Wave triggers after an ally turn while Surf is active and enough SP is available.',
    'The boss acts after the party action cycle.'
  ]
});

export const demoDataset = {
  schemaVersion: '1.0', source: 'Built-in structured demo; compatible with normalized Lufelnet imports',
  characters: roster, personas, navigators: [navigator], bosses
};
