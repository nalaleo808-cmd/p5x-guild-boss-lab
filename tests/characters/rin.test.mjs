import test from 'node:test';
import assert from 'node:assert/strict';
import { characterDefinition } from '../../src/characters/rin-data.js';
import { characterMechanics } from '../../src/characters/rin-mechanics.js';

test('Yaoling’s conditional Curse bonuses and per-packet exposures are source-tiered', () => {
  const target = { id: 'boss', hp: 80, maxHp: 100, finiteHp: true, alive: true, debuffs: [] };
  const engine = { config: { loadouts: { rin: { sourceTier: 2, characterResearch: { sourceTier: 1 } } } }, enemies: [target],
    applyUnitBuff: () => {}, applyEnemyStatus: (foe, list, status) => { foe[list].push(status); return status; } };
  const rin = { id: 'rin', slug: 'rin', hp: 100, speed: 106, awareness: 0, sourceTier: 3, buffs: [] };
  characterMechanics.initialize(engine, rin);
  const s2 = characterDefinition.skills.find(skill => skill.characterAction === 'rin:S2');
  const s3 = characterDefinition.skills.find(skill => skill.characterAction === 'rin:S3');
  const highlight = characterDefinition.highlightSkill;
  const prepared = characterMechanics.beforeSkill(engine, rin, s2, target.id, 'character_skill');
  assert.equal(prepared.power, s2.powerTiers[1]);
  assert.equal(characterMechanics.beforeDamage(engine, rin, rin, prepared, target, 'character_skill').actionDamageBonus, .30);
  target.debuffs.push({ id: 'test_debuff' });
  assert.equal(characterMechanics.beforeDamage(engine, rin, rin, prepared, target, 'character_skill').actionDamageBonus, .50);
  target.debuffs = [];
  target.hp = 40;
  assert.equal(characterMechanics.beforeDamage(engine, rin, rin, prepared, target, 'character_skill').actionDamageBonus, undefined);
  const s3Prepared = characterMechanics.beforeSkill(engine, rin, s3, target.id, 'character_skill');
  characterMechanics.afterSkill(engine, rin, s3Prepared, target.id, 'character_skill', { targets: [target] });
  const lily = target.debuffs.find(status => status.id === 'base_rin_red_spider_rin');
  assert.equal(lily.hitsRemaining, 2);
  characterMechanics.onDamage(engine, rin, { actualDamage: 1, target });
  assert.equal(lily.hitsRemaining, 1);
  characterMechanics.onDamage(engine, rin, { actualDamage: 1, target });
  assert.equal(target.debuffs.includes(lily), false);
  const highlightPrepared = characterMechanics.beforeSkill(engine, rin, highlight, target.id, 'highlight');
  characterMechanics.afterSkill(engine, rin, highlightPrepared, target.id, 'highlight', { targets: [target] });
  const nextHit = target.debuffs.find(status => status.id === 'base_rin_highlight_rin');
  assert.equal(nextHit.hitsRemaining, 1);
  characterMechanics.onDamage(engine, rin, { actualDamage: 1, target });
  assert.equal(target.debuffs.includes(nextHit), false);
});
