import { BattleEngine, CURRENT_MECHANICS_PROFILE } from '../src/engine.js';
import { createSlaughterBenchmarkEngine } from './benchmark-slaughter.mjs';

const template = createSlaughterBenchmarkEngine({ mechanicsProfile: CURRENT_MECHANICS_PROFILE, seed: 808 });
const config = {
  ...template.config,
  seed: 808,
  bossId: 'surt',
  modeId: 'multidimensional',
  mechanicsProfile: CURRENT_MECHANICS_PROFILE,
  characterDefinitions: template.characterDefinitions,
  personaDefinitions: template.personaDefinitions,
  navigatorDefinition: template.navigatorDefinition,
  teamIds: [
    template.state.party.find(unit => unit.slug === 'j-c').id,
    'wonder',
    template.state.party.find(unit => unit.slug === 'marian-beachflower').id,
    template.state.party.find(unit => unit.slug === 'puppet-wavecatcher').id
  ],
  personaIds: template.config.personaIds,
  loadouts: structuredClone(template.config.loadouts || {})
};

const equipped = {
  wonder: { attack: 8681, defense: 2910, maxHp: 13823, maxSp: 100, speed: 111.8, critRate: 47.1, critMult: 299.2, pierceRate: 14.1 },
  'marian-beachflower': { attack: 7845, defense: 2403, maxHp: 17853, maxSp: 100, speed: 106.8, critRate: 20.2, critMult: 323.8, pierceRate: 17.6 },
  'puppet-wavecatcher': { attack: 12509, defense: 2163, maxHp: 11142, maxSp: 450, speed: 98.8, critRate: 65.5, critMult: 524.4, pierceRate: 45.6, spRecovery: 202.5 },
  'j-c': { attack: 9524, defense: 2784, maxHp: 13100, maxSp: 100, speed: 113.4, critRate: 48.5, critMult: 313.8, spRecovery: 5 }
};

for (const [key, stats] of Object.entries(equipped)) {
  const unit = key === 'wonder'
    ? { id: 'wonder', slug: 'wonder' }
    : template.state.party.find(candidate => candidate.slug === key);
  if (!unit) continue;
  config.loadouts[unit.id] = {
    ...(config.loadouts[unit.id] || {}), statsMode: 'equipped', navigatorShareApplied: true,
    baseStats: {
      ...stats,
      critRate: stats.critRate,
      critMult: stats.critMult,
      pierceRate: stats.pierceRate,
      spRecovery: stats.spRecovery
    }
  };
}

const engine = new BattleEngine(config);
const snapshot = label => ({
  label,
  score: engine.state.score,
  foeDefensePoints: engine.state.scoreBreakdown.foeDefensePoints,
  totalDamage: engine.state.totalDamage,
  packets: engine.state.log.filter(event => event.type === 'damage').map(event => ({
    actor: event.actor, action: event.action, target: event.target, amount: event.amount,
    sourceType: event.sourceType, critical: event.critical
  }))
});

const results = [snapshot('after opening auto-nuke')];
const s1 = engine.getAvailableActions().find(action => action.enabled && action.skill?.slot === 'S1');
const before = engine.state.score;
engine.step({ type: s1.type, skillId: s1.skillId, targetId: 'jack_o_lantern' });
results.push({ ...snapshot('after J&C S1 on Jack-o-Lantern'), scoreDelta: engine.state.score - before });
let safety = 0;
while (engine.state.phase === 'battle' && safety++ < 200) {
  const action = engine.recommend() || engine.getAvailableActions().find(candidate => candidate.enabled && candidate.type === 'guard');
  if (!action) break;
  const targetId = action.target === 'ally'
    ? action.targetId || engine.state.party.find(unit => unit.slug === 'puppet-wavecatcher')?.id
    : action.target === 'boss' || action.target === 'enemy' ? 'jack_o_lantern' : action.target;
  engine.step({ type: action.type, skillId: action.skillId, targetId });
}
console.log(JSON.stringify({
  party: engine.state.party.map(unit => ({ id: unit.id, slug: unit.slug, attack: unit.attack, crit: unit.crit, critMult: unit.critMult, pierce: unit.pierceRate })),
  results,
  completion: engine.state.result ? {
    finalScore: engine.state.result.score,
    totalDamage: engine.state.result.totalDamage,
    scoreBreakdown: engine.state.result.scoreBreakdown
  } : null
}, null, 2));
