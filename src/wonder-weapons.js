export const CURSED_TIES_WEAPON_ID = 'cursed-ties';
export const CURSED_TIES_LIVE_PROFILE_ID = 'cursed-ties-live-2026-09-05';

export const WONDER_WEAPON_DATAMINE_SOURCE = Object.freeze({
  steamBuildId: 22780114,
  resourceVersion: 'R051409.E1629.C6613.L9859',
  extractedAt: '2026-09-19',
  ownerId: 101,
  sourceTables: Object.freeze(['ConfWeapon', 'ConfWeapon_EN', 'ConfSkill', 'ConfSkill_EN', 'ConfSkillFormula'])
});

export const WONDER_WEAPON_RANK6_CALIBRATION = Object.freeze({
  refinementInput: 6,
  localFormulaRuntimeVariables: Object.freeze(['f86', 'f87', 'f88']),
  localFormulaRuntimeVariableMapping: 'unresolved_in_steam_export',
  lufelCrossCheckProvenance: 'user_lufel_live_interactive_2026-09-21',
  validation: 'The supplied A6 values are a separate Lufel cross-check for local formulas that reference runtime variables.'
});

const catalogRows = [
  ['damascus-knife', 200101, 'Damascus Knife', 2, 'Soaring Spirit', [1189, 330, 220], ['f500211'],
    'Increase Wonder\'s Attack.'],
  ['fatal-knife', 200102, 'Fatal Knife', 3, 'Unravel', [1427, 396, 264], ['f500312'],
    'Increase Wonder\'s Attack for each equipped Persona.'],
  ['midnight-sun', 200103, 'Midnight Sun', 4, 'Upward Shift', [1902, 528, 352], ['f500412', 'f500411'],
    'Increase Wonder\'s Attack, with an additional temporary increase after changing Personas.'],
  ['sennight-inferno', 200104, 'Sennight Inferno', 5, 'Corroding Lava', [2140, 594, 396], ['f500514', 'f500512', 'f500513'],
    'Increase Attack and damage for each equipped Persona attribute. Knocking down a foe temporarily decreases its Defense.'],
  ['all-in', 200105, 'All In', 5, 'Protecting Light', [2140, 594, 396], ['f500613', 'f500611', 'f500612'],
    'Increase healing and shields. While Wonder is on the field, increase party Defense and restore HP after using a skill on an ally.'],
  ['arc-knife', 200106, 'Arc Knife', 5, 'Power of Creation', [1926, 654, 396], ['f500721', 'f500731', 'f500741', 'f500751'],
    'Increase Attack and elemental ailment accuracy. Elemental ailments raise Wonder\'s Attack, and attacks reduce Defense based on the target\'s elemental ailments.'],
  ['ex-machina', 200107, 'Ex Machina', 5, 'Overboost', [2051, 654, 356], ['f500811', 'f500812', 'f500813', 'f500814'],
    'Increase Wonder\'s Attack and party Attack. Boost damage matching the Persona equipped at battle start, with a smaller party-wide share.'],
  ['glimmer', 200108, 'Glimmer', 5, 'Holy Resonance', [1926, 654, 396], ['f500911', 'f500914', 'f500912', 'f500913'],
    'Increase Attack, Bless damage, and healing. Periodically grant Blessing and a damage bonus to an ally.'],
  ['eye-of-obsequies', 200109, 'Eye of Obsequies', 5, 'Eye of the Abyss', [1926, 654, 396], ['f590011', 'f590012', 'f590016', 'f590013', 'f590014'],
    'After Wonder inflicts a status ailment, reduce the foe\'s ailment resistance and Defense while increasing Wonder\'s Attack. Higher stacks increase Physical damage taken.'],
  ['starry-compass', 200110, 'Starry Compass', 5, 'Read the Stars', [2051, 654, 356], ['f590111', 'f590112', 'f590113', 'f590114'],
    'Build Guidance when allies deal damage. Guidance thresholds reduce foe Defense and increase party ailment accuracy and Psychokinesis damage.'],
  ['abyss-fang', 200111, 'Abyss Fang', 5, 'Hunter\'s Instinct', [1926, 689, 356], ['f590230', 'f590237', 'f590231', 'f590232', 'f590235', 'f590236'],
    'Skill damage builds Hunter\'s Instinct, increasing damage and granting critical bonuses at higher stacks.'],
  ['purgatory', 200112, 'Purgatory', 5, 'Inferno of Nothingness', [2051, 654, 356], ['f590311', 'f590312', 'f590313', 'f590314', 'f590315', 'f590316'],
    'Fire skill damage builds Trial by Fire. Stack thresholds increase party Attack, damage, and Fire damage.'],
  ['plasma-blade', 200113, 'Plasma Blade', 5, 'Harmonic Element', [2051, 654, 356], ['f590411', 'f590431', 'f590432', 'f590435'],
    'Activate Harmonic Element at battle start or after Almighty skill damage. Flames of Desire increase Attack, Almighty damage, and party critical damage.'],
  ['pheromone-sting', 200114, 'Pheromone Sting', 5, 'Infestation', [1926, 654, 396], ['f590521', 'f590531', 'f590532', 'f590542', 'f590544'],
    'Increase ailment accuracy and infliction chance. Ailments apply Infestation, which increases damage taken and empowers Wonder while present.'],
  ['cyclotron', 200115, 'Cyclotron', 5, 'Magnetized Plasma', [2051, 654, 356], ['f590621', 'f590631', 'f590641', 'f590642'],
    'Increase Attack and critical rate. Electric damage grants the party Magnetized Plasma, increasing damage and Electric critical damage.'],
  [CURSED_TIES_WEAPON_ID, 200116, 'Cursed Ties', 5, 'Evil Eye', [1926, 654, 396], ['f590721', 'f590731', 'f590744', 'f590743'],
    'After an ally deals Curse damage, Evil Eye can reduce the target\'s Defense and increase Curse damage taken. Wonder gains Attack against marked foes.'],
  ['ice-age', 200117, 'Ice Age', 5, 'Ancient Frost', [2051, 654, 356], ['f590821', 'f590832', 'f590841', 'f590842'],
    'Grant Ancient Frost to allies at battle start and when Wonder targets them. It increases their damage and Ice damage while empowering Wonder.'],
  ['event-horizon', 200118, 'Event Horizon', 5, 'Spaghettification', [2051, 654, 356], ['f590921', 'f590932', 'f590941', 'f590942'],
    'Grant Spaghettification to allies at battle start and after Nuclear skill damage. Its stacks increase Attack and Nuclear critical damage.']
];

// weaponRefineCounta formulas are evaluated locally at A6. Descriptions that
// require f86, f87, or f88 use separately identified Lufel A6 cross-checks.
const rank6Descriptions = Object.freeze({
  'damascus-knife': 'Attack +21.5%.',
  'fatal-knife': 'For each equipped Persona, Attack +9.5%.',
  'midnight-sun': 'Attack +24.0%. After changing Personas, gain Attack +12.2% more for 1 turn; this effect is doubled.',
  'sennight-inferno': 'Attack +56.0%. Damage +12.0% per distinct equipped Persona attribute, maximum 3. After a knockdown, target Defense -30.0% for 1 turn.',
  'all-in': 'Healing and shield +40.0%. On-field party Defense +30.0%. After using a skill on an ally, restore 20.0% of the main target max HP.',
  'arc-knife': 'Attack +56.0%. After inflicting an elemental ailment, Attack +20.0% for 2 turns. Elemental ailment accuracy +30.0%. Attacks reduce target Defense by 9.0% for each elemental ailment, maximum 4, for 2 turns.',
  'ex-machina': 'Attack +56.0%. On-field party Attack +240. Starting-Persona attribute damage +34.0%; other allies receive 40% of that effect.',
  glimmer: 'Attack +56.0%. Bless damage and healing +22.0%. Every 2 turns, grant Blessing and damage +16.0% to 1 ally; Bless allies gain Bless damage +27.0% more.',
  'eye-of-obsequies': 'Attack +56.0%. After Wonder inflicts a status ailment: target ailment resistance -12.0%, Defense -10.0%, and holder Attack +20.0% for 3 turns, maximum 2 stacks. At 1 stack, target Physical damage taken +28.0% for 3 turns.',
  'starry-compass': 'Attack +56.0%. Start with 10 Guidance, maximum 20; each ally damage event grants 1 and Wonder turn end removes 5. At 5: all foes Defense -22.0%. At 10: party ailment accuracy +18.0%. At 15: party Psychokinesis damage +22.0%.',
  'abyss-fang': 'Attack +56.0%. Skill damage grants 3 Hunter\'s Instinct stacks and every 2 damage events grants 1 more. Each stack grants damage +6.6% for 1 turn, maximum 5. At 3/5: critical rate +12.0%/+18.0% and critical damage +24.0%/+36.0%.',
  purgatory: 'Attack +60.7%. Start with 2 Trial by Fire stacks; ally Fire skill damage grants 1, lasting 3 turns, maximum 3. At 1: holder Attack +360 and other allies +300. At 2: holder damage +16.0% and other allies +6.0%. At 3: party Fire damage +24.0%.',
  'plasma-blade': 'Attack +60.7%. Harmonic Element activates for 2 turns at battle start and after ally Almighty skill damage. At 1 Flame: holder Attack +30.0% and Almighty damage +18.0%, half to other allies. At 2 Flames: party critical damage +18.0%.',
  'pheromone-sting': 'Ailment accuracy +68.0%; elemental or spiritual ailment chance +25.0%; Infestation damage taken +20.0% for 3 turns. While an Infested foe exists: ailment accuracy +8.0% and Attack +14.0%.',
  cyclotron: 'Attack +56.0%; battle-start critical rate +19.0%. Ally Electric damage grants all allies 2-turn Magnetized Plasma: damage +18.0%, and Electric critical damage +18.0%.',
  [CURSED_TIES_WEAPON_ID]: 'Ailment accuracy +68.0%. After ally Curse damage, Wonder has a 70% chance to inflict 3-turn Evil Eye: Defense -25.0% and Curse damage taken +16.0%. Wonder gains Attack +36.0% against Evil Eye targets.',
  'ice-age': 'Attack +56.0%. Ancient Frost grants damage +16.0% and Ice damage +22.0% for 3 turns. Wonder damage increases by +35.0% while an ally has Ancient Frost.',
  'event-horizon': 'Attack +56.0%. Start with 2 Spaghettification stacks on all allies; ally Nuclear skill damage grants one more. Per affected ally, Wonder Attack +100. Each stack lasts 2 turns independently, caps at 2, and grants Attack +11.0% plus Nuclear critical damage +10.0%.'
});

const rank6FormulaStatus = Object.freeze({
  'damascus-knife': 'self_contained_local_a6_formula',
  'fatal-knife': 'self_contained_local_a6_formula',
  'midnight-sun': 'self_contained_local_a6_formula',
  'sennight-inferno': 'lufel_a6_cross_check_with_local_formula',
  'all-in': 'lufel_a6_cross_check_with_local_formula',
  'arc-knife': 'lufel_a6_cross_check_with_local_formula',
  'ex-machina': 'lufel_a6_cross_check_with_local_formula',
  glimmer: 'lufel_a6_cross_check_with_local_formula',
  'eye-of-obsequies': 'lufel_a6_cross_check_with_local_formula',
  'starry-compass': 'lufel_a6_cross_check_with_local_formula',
  'abyss-fang': 'lufel_a6_cross_check_with_local_formula',
  purgatory: 'lufel_a6_cross_check_with_local_formula',
  'plasma-blade': 'lufel_a6_cross_check_with_local_formula',
  'pheromone-sting': 'self_contained_local_a6_formula',
  cyclotron: 'self_contained_local_a6_formula',
  [CURSED_TIES_WEAPON_ID]: 'self_contained_local_a6_formula',
  'ice-age': 'self_contained_local_a6_formula',
  'event-horizon': 'self_contained_local_a6_formula'
});

const rank6DescriptionProvenance = Object.freeze(Object.fromEntries(
  Object.entries(rank6FormulaStatus).map(([weaponId, status]) => [weaponId,
    status === 'lufel_a6_cross_check_with_local_formula'
      ? 'user_lufel_live_interactive_2026-09-21_with_local_formula_reference'
      : 'steam_datamine_2026-09-19_confskillformula'
  ])
));

const runtimeStatusByWeapon = Object.freeze({
  'damascus-knife': 'implemented',
  'fatal-knife': 'implemented',
  'midnight-sun': 'implemented',
  'sennight-inferno': 'implemented',
  'all-in': 'implemented',
  'arc-knife': 'partial',
  'ex-machina': 'implemented',
  glimmer: 'partial',
  'eye-of-obsequies': 'partial',
  'starry-compass': 'partial',
  'abyss-fang': 'partial',
  purgatory: 'partial',
  'plasma-blade': 'partial',
  'pheromone-sting': 'partial',
  cyclotron: 'implemented',
  [CURSED_TIES_WEAPON_ID]: 'partial',
  'ice-age': 'partial',
  'event-horizon': 'partial'
});

function datamineProfileId(weaponId) {
  return `${weaponId}-datamine-l80-r6-2026-09-19`;
}

function buildProfile(row) {
  const [weaponId, , , , skillName, [maxHp, attack, defense], formulaIds, effectSummary] = row;
  const profileId = weaponId === CURSED_TIES_WEAPON_ID
    ? CURSED_TIES_LIVE_PROFILE_ID
    : datamineProfileId(weaponId);
  const commonProfile = {
    id: profileId,
    provenance: weaponId === CURSED_TIES_WEAPON_ID
      ? 'datamine_2026-09-19_and_direct_game_gui_2026-09-05'
      : 'steam_datamine_2026-09-19',
    configuration: Object.freeze({ level: 80, userRank: 6 }),
    weaponStats: Object.freeze({ maxHp, attack, defense }),
    forge: Object.freeze({
      name: skillName,
      summary: rank6Descriptions[weaponId] || effectSummary,
      rank6Description: rank6Descriptions[weaponId] || null,
      rank6FormulaStatus: rank6FormulaStatus[weaponId] || 'runtime_variables_unresolved',
      rank6DescriptionProvenance: rank6DescriptionProvenance[weaponId] || 'steam_datamine_2026-09-19',
      formulaIds: Object.freeze(formulaIds),
      runtimeImplemented: runtimeStatusByWeapon[weaponId] === 'implemented' || runtimeStatusByWeapon[weaponId] === 'partial',
      runtimeStatus: runtimeStatusByWeapon[weaponId] || 'catalog-only'
    })
  };

  if (weaponId !== CURSED_TIES_WEAPON_ID) return Object.freeze(commonProfile);

  return Object.freeze({
    ...commonProfile,
    observed: Object.freeze({ level: 80, userRank: 6 }),
    forge: Object.freeze({
      ...commonProfile.forge,
      ailmentAccuracyBonus: 0.68,
      trigger: Object.freeze({
        element: 'curse',
        chance: 0.7,
        triggerActor: 'ally',
        holderEligibility: 'unverified',
        procGranularity: null
      }),
      evilEye: Object.freeze({
        id: 'cursed_ties_evil_eye',
        name: 'EVIL EYE',
        duration: 3,
        defenseDown: 0.25,
        curseDamageTaken: 0.16
      }),
      holderAttackAgainstEvilEye: 0.36,
      conflictingPriorObservation: Object.freeze({
        values: Object.freeze({ ailmentAccuracyBonus: 0.623, defenseDown: 0.229, curseDamageTaken: 0.147, holderAttackAgainstEvilEye: 0.33 }),
        provenance: 'direct_game_gui_2026-09-05',
        status: 'does_not_match_current_local_a6_formula'
      })
    })
  });
}

export const WONDER_WEAPON_CATALOG = Object.freeze(Object.fromEntries(catalogRows.map(row => {
  const [id, datamineId, name, rarity, skillName, , formulaIds, effectSummary] = row;
  const profile = buildProfile(row);
  return [id, Object.freeze({
    id,
    datamineId,
    name,
    holderId: 'wonder',
    rarity,
    skillName,
    effectSummary,
    formulaIds: Object.freeze(formulaIds),
    defaultProfileId: profile.id,
    runtimeStatus: runtimeStatusByWeapon[id] || 'catalog-only',
    profiles: Object.freeze({ [profile.id]: profile })
  })];
})));

export function listWonderWeaponDefinitions() {
  return Object.values(WONDER_WEAPON_CATALOG);
}

export function getWonderWeaponDefinition(weaponId) {
  return WONDER_WEAPON_CATALOG[weaponId] || null;
}

export function getDefaultWonderWeaponProfileId(weaponId) {
  return getWonderWeaponDefinition(weaponId)?.defaultProfileId || null;
}

export function getWonderWeaponProfile(weaponId, profileId) {
  const weapon = getWonderWeaponDefinition(weaponId);
  if (!weapon) return null;
  return weapon.profiles?.[profileId || weapon.defaultProfileId] || null;
}
