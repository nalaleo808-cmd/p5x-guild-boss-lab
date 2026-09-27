// Wonder's Persona and weapon systems remain separate from character kits.
export const characterResearch = {
  slug: 'wonder', name: 'Wonder', coverage: 'existing-systems-audited',
  implemented: ['Three Persona loadout slots and legal transferable skills',
    'Separate observed Cursed Ties weapon profile and configured effect triggers'],
  missing: ['Complete Persona trait coverage', 'Live confirmation of Cursed Ties trigger boundaries'],
  limitations: ['Wonder has no replacement character kit or invented awareness bonuses.',
    'Weapon panel stats are not silently added to equipped totals; unresolved trigger rules remain evidence-gated.'],
  sources: [{ file: 'src/persona-loadout.js' }, { file: 'src/wonder-weapons.js' },
    { file: 'data/character-research/wonder.json' }]
};
