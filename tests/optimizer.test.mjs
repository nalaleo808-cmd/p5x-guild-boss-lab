import test from 'node:test';
import assert from 'node:assert/strict';
import { optimizeSlaughter, replayCandidate, runCandidate } from '../scripts/optimize-slaughter.mjs';
import { runOptimizedSlaughter } from '../scripts/benchmark-slaughter.mjs';
import { CURRENT_MECHANICS_PROFILE } from '../src/engine.js';

const tinySearch = {
  generations: 2,
  populationSize: 12,
  eliteCount: 4,
  refinePasses: 0,
  searchSeed: 20260829,
  battleSeed: 808
};

test('optimizer resets its seeded PRNG for every call', () => {
  const first = optimizeSlaughter(tinySearch);
  const second = optimizeSlaughter(tinySearch);

  assert.deepEqual(second.search, first.search);
  assert.deepEqual(second.optimized.candidate, first.optimized.candidate);
  assert.equal(second.optimized.score, first.optimized.score);
  assert.deepEqual(second.progress, first.progress);
  assert.equal(second.candidatesEvaluated, first.candidatesEvaluated);
});

test('optimizer baseline is the current seed 808 Full Auto policy', () => {
  const result = optimizeSlaughter({
    generations: 0,
    populationSize: 1,
    eliteCount: 1,
    refinePasses: 0,
    searchSeed: 20260829,
    battleSeed: 808
  });

  assert.equal(result.metadata.recordedBenchmarkScore, 3642530108);
  const currentAuto = runOptimizedSlaughter({ mechanicsProfile: CURRENT_MECHANICS_PROFILE });
  assert.equal(result.metadata.mechanicsProfile, CURRENT_MECHANICS_PROFILE);
  assert.equal(result.metadata.autoBaselineScore, currentAuto.metrics.score);
  assert.equal(result.baseline.score, currentAuto.metrics.score);
  assert.deepEqual(result.replayParity, { baseline: true, optimized: true });
});

// Live Nexus is 6 Attack Turns. These planner tests ask for 8 explicitly so
// turn-7 plans and both Concert rounds stay reachable.
const longNexus = { turnLimit: 8 };

test('candidate replay has exact fast/full parity and preserves replay context', () => {
  const result = optimizeSlaughter({ ...tinySearch, ...longNexus });
  assert.equal(result.search.turnLimit, 8);
  const replay = replayCandidate(result.optimized.candidate, { battleSeed: result.search.battleSeed, turnLimit: result.search.turnLimit });

  assert.equal(replay.fastScore, replay.fullScore);
  assert.equal(replay.fullScore, result.optimized.score);
  assert.equal(replay.parity, true);
  assert.ok(replay.result.rotation.some(row => row.actionContext === 'concert-1'));
  assert.ok(replay.result.rotation.some(row => row.actionContext === 'concert-2'));
});

test('True Desire plans can reserve each stack until its scheduled J&C turn', () => {
  const baseline = optimizeSlaughter({ generations: 0, populationSize: 1, eliteCount: 1, refinePasses: 0, ...longNexus }).baseline.candidate;
  const candidate = structuredClone(baseline);
  candidate.trueDesirePlan = [7, null];
  const engine = runCandidate(candidate, { fastMode: false, battleSeed: 808, ...longNexus });
  const toggles = engine.state.history.filter(frame => frame.label === 'True Desire On');

  assert.equal(toggles.length, 1);
  assert.equal(toggles[0].attackTurn, 7);
  assert.equal(engine.state.party.find(unit => unit.slug === 'j-c').trueDesireStacks, 1);
});

test('J&C opening mask and Marian per-turn medicine plans reach the full replay', () => {
  const baseline = optimizeSlaughter({ generations: 0, populationSize: 1, eliteCount: 1, refinePasses: 0, ...longNexus }).baseline.candidate;
  const candidate = structuredClone(baseline);
  candidate.jcOpeningMask = 'mischief';
  candidate.medicinePlan = {
    7: { name: 'Fighter Salve', targetId: 'lufel-recent-puppet-wavecatcher' }
  };
  const engine = runCandidate(candidate, { fastMode: false, battleSeed: 808, ...longNexus });
  const firstManualMask = engine.state.history.find(frame => frame.label.startsWith('Mask of '));
  const medicines = engine.state.history.filter(frame => frame.label.startsWith('Medicine'));

  assert.equal(firstManualMask.label, 'Mask of Mischief & Innocence');
  assert.equal(medicines.length, 2);
  assert.ok(medicines.every(frame => frame.attackTurn === 7));
  assert.equal(engine.state.party.find(unit => unit.slug === 'marian-beachflower').medicineUses, 2);
});
