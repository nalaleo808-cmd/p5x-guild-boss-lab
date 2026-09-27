import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { BattleEngine, simulate } from '../src/engine.js';
import { bosses } from '../src/data.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';
import { COSMIC_YUI_ID as ID, COSMIC_YUI_COEFFICIENTS as C, normalizeCosmicYuiRecord } from '../src/cosmic-yui-data.js';

const raw = JSON.parse(readFileSync(new URL('../data/cosmic-yui-source-2026-09-12.json', import.meta.url)));
const definition = () => structuredClone(lufelCatalog.characters.find(c => c.id === ID));
const dummy = { id: 'cosmic-test-ally', name: 'Test Ally', codename: 'Ally', role: 'Support', element: 'physical', attack: 500, maxHp: 10000, maxSp: 100, crit: .05, critMult: 1.5, actionLimit: 1, skills: [] };
function fixture({ awareness = 6, sourceTier = 3, weapon = 'none', refinement = 0, staticWeaponStatsIncluded = false, allies = false, targets = 1, fastMode = false, liveHachiman = false } = {}) {
  const boss = { ...structuredClone(bosses.find(b => b.id === 'hachiman')),
    id: liveHachiman ? 'hachiman' : 'cosmic-test-boss', maxHp: 1e12, scoreAttack: true,
    finiteHp: false, summons: [], turnLimit: 12, enemyTimingModel: null, encounter: null,
    weakness: 'fire', actionScale: 0 };
  boss.summons = Array.from({length: targets - 1}, (_, i) => ({ id: `cosmic-target-${i}`, name: `Target ${i}`, maxHp: 1e12, defense: boss.defense, weakness: 'fire', scoreAttack: true, finiteHp: false, downMax: 6 }));
  const defs = allies ? [definition(), dummy] : [definition()];
  const e = new BattleEngine({ bossDefinition: boss, characterDefinitions: defs, teamIds: defs.map(d => d.id), seed: 42, fastMode,
    loadouts: { [ID]: { baseStats: { maxHp: 10000, maxSp: 1000, attack: 1000, critRate: 0, critMult: 150 }, cosmicYui: { awareness, sourceTier, weapon, refinement, staticWeaponStatsIncluded } } } });
  e.random = () => .5;
  return e;
}
const yui = e => e.state.party.find(p => p.id === ID);
const slot = (e, name) => e.getAvailableActions().find(a => a.skill?.cosmicAction === name);
const cast = (e, name) => e.step({ ...slot(e, name), targetId: e.state.boss.id });
const guard = e => e.step({ type: 'guard', skillId: 'guard', targetId: e.actor.id });
const approx = (a,b) => assert.ok(Math.abs(a-b)<1e-9, `${a} != ${b}`);

test('Cosmic Yui appears once with current names, sourced costs, local art and explicit source provenance', () => {
  assert.equal(lufelCatalog.characters.filter(c => c.slug === 'bui-cosmic').length, 1);
  const c = definition();
  assert.equal(c.name, 'Cosmic Yui'); assert.equal(c.element, 'nuclear');
  assert.deepEqual(c.skills.map(s => s.name), ['Harvest Fest', 'Veggie Knights, Go!', 'Veg-Out Attack']);
  assert.deepEqual(c.skills.map(s => s.cost), [22, 0, 23]);
  assert.deepEqual(c.skills.map(s => s.power), [1.406, 0, 1.515]);
  assert.equal(c.highlightSkill.power, 5.112);
  assert.equal(c.sourceEvidence.retrievedAt, '2026-09-12');
  assert.equal(c.sourceEvidence.files['skill.js'], 'b10b2dbb4f4dfe6babf622027ec3676968b11c35');
  assert.ok(existsSync(new URL(`..${c.artwork}`, import.meta.url)));
});

test('Cosmic source snapshot survives the catalog normalization path', () => {
  assert.deepEqual(normalizeCosmicYuiRecord(raw), definition());
});

test('all four source coefficient columns survive unchanged', () => {
  for (let tier=0;tier<4;tier++) {
    const e=fixture({sourceTier:tier,awareness:0}); const u=yui(e);
    const s=e.cosmicPrepareSkill(u,u.skills[0],'character_skill');
    assert.equal(s.power,C.harvest[tier]);
    const v=e.cosmicPrepareSkill(u,u.skills[2],'character_skill');
    assert.equal(v.power,C.mobilize[tier]);
    assert.equal(v.cosmicExtraHitPowers[0],C.knight[tier]);
  }
});

test('A0 begins with the first sourced knight only, no free opening attack or permanent harvest', () => {
  const e=fixture({awareness:0}); const c=yui(e).cosmicYui;
  assert.deepEqual(c.knights,{eggplant:1,potato:0,mushroom:0,asparagus:0});
  assert.equal(c.energy,0); assert.equal(c.seedPotato,0); assert.equal(c.color,'eggplant');
  assert.equal(c.permanentHarvest,false); assert.equal(c.automaticVegOutUses,0);
});

test('summons follow Eggplant → Potato → Mushroom → Asparagus and skip capped knights', () => {
  const e=fixture({awareness:0}); const u=yui(e);
  assert.equal(e.cosmicSummon(u),'potato'); assert.equal(e.cosmicSummon(u),'mushroom');
  assert.equal(e.cosmicSummon(u),'asparagus'); assert.equal(e.cosmicSummon(u),'potato');
  assert.equal(e.cosmicSummon(u),'potato'); assert.equal(e.cosmicSummon(u),'potato');
  assert.equal(e.cosmicSummon(u),null); assert.equal(e.cosmicKnightCount(u),7);
});

test('A1 grants four knight types, spends opening energy once and changes to Purple on first turn', () => {
  const e=fixture({awareness:1}); const u=yui(e), c=u.cosmicYui;
  assert.ok(Object.values(c.knights).every(n=>n>=1)); assert.equal(c.seedPotato,0);
  assert.equal(c.automaticVegOutUses,1); assert.equal(c.energy,0); assert.equal(c.color,'eggplant');
  assert.ok(e.state.totalDamage>0);
});

test('A2 has an additional unspendable seed potato and a maximum of eight total knights', () => {
  const e=fixture({awareness:2}); const u=yui(e);
  for(let n=0;n<12;n++)e.cosmicSummon(u);
  assert.equal(u.cosmicYui.knights.potato,4); assert.equal(u.cosmicYui.seedPotato,1);
  assert.equal(e.cosmicKnightCount(u),8);
  const s=e.cosmicPrepareSkill(u,u.skills[2],'character_skill');
  assert.equal(s.cosmicKnightsAtCast,8); assert.equal(s.cosmicSpentPotatoes,3);
  assert.equal(s.cosmicExtraHitPowers.length,11);
  e.resolveSkill(u,u.skills[2],e.state.boss.id);
  assert.equal(u.cosmicYui.knights.potato,1); assert.equal(u.cosmicYui.seedPotato,1);
});

test('A6 starts in permanent Prismatic with all four color benefits', () => {
  const e=fixture();const u=yui(e);
  assert.equal(u.cosmicYui.color,'prismatic');assert.equal(u.cosmicYui.permanentHarvest,true);
  for(const color of ['eggplant','potato','mushroom','asparagus'])assert.equal(e.cosmicHasColor(u,color),true);
});

test('S2 is free: no SP, actor turn, action number, Highlight or Havoc is consumed/advanced', () => {
  const e=fixture({allies:true});const u=yui(e);
  const before={sp:u.sp,action:e.state.actionNumber,actor:e.actor.id,turn:u.characterTurnsStarted,used:e.state.turnActionsUsed,hl:e.state.sharedCombat.highlight,havoc:u.cosmicYui.harvestHavocUses,energy:u.cosmicYui.energy};
  const result=cast(e,'assemble');
  assert.equal(result.consumedAction,false);
  assert.deepEqual({sp:u.sp,action:e.state.actionNumber,actor:e.actor.id,turn:u.characterTurnsStarted,used:e.state.turnActionsUsed,hl:e.state.sharedCombat.highlight,havoc:u.cosmicYui.harvestHavocUses,energy:u.cosmicYui.energy},before);
  approx(u.buffs.find(b=>b.id==='cosmic_assemble_attack').value,.341);
  approx(u.buffs.find(b=>b.id==='cosmic_assemble_crit').value,.136);
});

test('S2 cannot be used twice during the same owner turn; cooldown clears at the next owner turn', () => {
  const e=fixture({allies:true});cast(e,'assemble');
  assert.equal(slot(e,'assemble').enabled,false);
  assert.throws(()=>cast(e,'assemble'),/Unavailable action/);
  guard(e);guard(e);
  assert.equal(e.actor.id,ID);assert.equal(slot(e,'assemble').enabled,true);
});

test('A6 S2 grants an additional Potato Knight without exceeding caps', () => {
  const e=fixture();const u=yui(e);const before=u.cosmicYui.knights.potato;
  cast(e,'assemble');assert.equal(u.cosmicYui.knights.potato,Math.min(4,before+2));
  assert.equal(u.cosmicYui.seedPotato,1);
});

test('A0 S2 grants one knight, not the A6 bonus', () => {
  const e=fixture({awareness:0});const u=yui(e);cast(e,'assemble');
  assert.equal(e.cosmicKnightCount(u),2);assert.equal(u.cosmicYui.knights.potato,1);
});

test('Harvest Fest adds 3 energy plus Purple 1; S2 never gains Purple energy', () => {
  const e=fixture({awareness:0});const u=yui(e);cast(e,'assemble');
  assert.equal(u.cosmicYui.energy,0);
  e.resolveSkill(u,u.skills[0],e.state.boss.id);
  assert.equal(u.cosmicYui.energy,4);
});

test('A0 Huge Harvest fires at current and next owner action end, then expires', () => {
  const e=fixture({awareness:0,allies:true});const u=yui(e);
  cast(e,'harvest');assert.equal(u.cosmicYui.harvestHavocUses,1);
  guard(e);guard(e);assert.equal(u.cosmicYui.harvestHavocUses,2);
  guard(e);guard(e);assert.equal(u.cosmicYui.harvestHavocUses,2);
});

test('A6 Harvest Havoc fires once per ally counted action, never recursively from itself', () => {
  const e=fixture({allies:true});const u=yui(e);
  guard(e);assert.equal(u.cosmicYui.harvestHavocUses,1);
  guard(e);assert.equal(u.cosmicYui.harvestHavocUses,2);
  e.resolveCosmicHavoc(u,e.state.boss.id,'test');assert.equal(u.cosmicYui.harvestHavocUses,3);
});

test('seven energy triggers exactly one free automatic Veg-Out with no recursive energy award', () => {
  const e=fixture({awareness:0});const u=yui(e);
  e.cosmicGainEnergy(u,7,'test');const sp=u.sp;const count=u.cosmicYui.automaticVegOutUses;
  e.resolveCosmicAutomatic(u);
  assert.equal(u.cosmicYui.energy,0);assert.equal(u.cosmicYui.automaticVegOutUses,count+1);assert.equal(u.sp,sp);
  e.resolveCosmicAutomatic(u);assert.equal(u.cosmicYui.automaticVegOutUses,count+1);
});

test('automatic Veg-Out freezes target count and splits every coefficient evenly', () => {
  const e=fixture({awareness:0,targets:3});const u=yui(e);
  const s=e.cosmicPrepareSkill(u,{...u.skills[2],cosmicAutomatic:true},'cosmic_all_out_attack');
  assert.equal(s.cosmicTargetIds.length,3);approx(s.power,1.515/3);
  assert.ok(s.cosmicExtraHitPowers.every(p=>Math.abs(p-.341/3)<1e-9));
});

test('automatic Veg-Out damage is split rather than tripled across identical targets', () => {
  const a=fixture({awareness:0,targets:1}), b=fixture({awareness:0,targets:3});
  for (const e of [a,b]) { e.calculateDamage = (_actor, skill) => ({ amount: Math.round(skill.power * 10000), critical: false, weakness: false, defense: 0, multiplier: 1 }); e.cosmicGainEnergy(yui(e),7,'test'); e.resolveCosmicAutomatic(yui(e)); }
  assert.ok(Math.abs(a.state.totalDamage-b.state.totalDamage)<=6, `${a.state.totalDamage} vs ${b.state.totalDamage}`);
});

test('Veg-Out all-out damage bonuses do not amplify ordinary Harvest Fest', () => {
  const e=fixture({awareness:0});const u=yui(e);
  const s1=e.cosmicPrepareSkill(u,u.skills[0],'character_skill');
  const s3=e.cosmicPrepareSkill(u,u.skills[2],'character_skill');
  const before1=e.calculateDamage(u,s1,e.state.boss,'character_skill').amount;
  const before3=e.calculateDamage(u,s3,e.state.boss,'character_skill').amount;
  e.cosmicBuff(u,'test_aoa','Test AOA','allOutDamage',1);
  assert.equal(e.calculateDamage(u,s1,e.state.boss,'character_skill').amount,before1);
  assert.ok(e.calculateDamage(u,s3,e.state.boss,'character_skill').amount>before3*1.5);
});

test('shared 1More-Up medicine applies to Cosmic All-Out damage too', () => {
  const e=fixture({awareness:0});const u=yui(e);const skill=e.cosmicPrepareSkill(u,u.skills[2],'character_skill');
  const before=e.calculateDamage(u,skill,e.state.boss,'character_skill').amount;
  e.applyUnitBuff(u,{id:'medicine_one_more_damage',name:'1MORE-UP',stat:'oneMoreDamage',value:.1,duration:1});
  assert.ok(e.calculateDamage(u,skill,e.state.boss,'character_skill').amount>before);
});

test('Hachiman source formula respects Cosmic All-Out category and combined medicine bonuses', () => {
  const e=fixture({awareness:0,liveHachiman:true});const u=yui(e);const skill=e.cosmicPrepareSkill(u,u.skills[2],'character_skill');
  const result=e.calculateDamage(u,skill,e.state.boss,'character_skill');
  assert.equal(result.damageClass,'cosmic_all_out_attack');assert.equal(result.damageFormula.dreamscapeSkillCritBonus,null);
  e.cosmicBuff(u,'test_aoa','Test AOA','allOutDamage',1);
  assert.ok(e.calculateDamage(u,skill,e.state.boss,'character_skill').amount>result.amount);
});

test('satellite and A1 critical buffs cap at 4 and 5 knights, respectively', () => {
  const e=fixture();const u=yui(e);for(let i=0;i<20;i++)e.cosmicSummon(u);
  approx(u.buffs.find(b=>b.id==='cosmic_satellite').value,.324);
  approx(u.buffs.find(b=>b.id==='cosmic_knight_rounds').value,.4);
});

test('Potato Power refreshes rather than stacks; A2 adds 10 percentage points once', () => {
  const e=fixture();const u=yui(e);e.cosmicPotatoPower(u);e.cosmicPotatoPower(u);
  const effects=u.buffs.filter(b=>b.id==='cosmic_potato_power');assert.equal(effects.length,1);approx(effects[0].value,.27);
});

test('Prismatic Havoc applies one Shroom Spores debuff to the hit target', () => {
  const e=fixture({targets:2});const u=yui(e);const target=e.state.boss.summons[0];
  e.resolveCosmicHavoc(u,target.id,'test');
  approx(target.debuffs.find(b=>b.id.startsWith('cosmic_spores_')).value,.227);
  assert.ok(!e.state.boss.debuffs.some(b=>b.id.startsWith('cosmic_spores_')));
  e.resolveCosmicHavoc(u,target.id,'test');assert.equal(target.debuffs.filter(b=>b.id.startsWith('cosmic_spores_')).length,1);
});

test('Asparagus Havoc heals the living ally with lowest remaining HP, not a KO', () => {
  const e=fixture({allies:true});const u=yui(e);const ally=e.state.party[1];u.hp=8000;ally.hp=100;
  e.resolveCosmicHavoc(u,e.state.boss.id,'test');assert.equal(ally.hp,1236);
  ally.hp=0;e.resolveCosmicHavoc(u,e.state.boss.id,'test');assert.equal(ally.hp,0);assert.equal(u.hp,9136);
});

test('Asparagus self-heal is capped at 1000 per cast and cannot exceed max HP', () => {
  const e=fixture();const u=yui(e);u.hp=100;
  e.cosmicAfterSkill(u,{cosmicAction:'harvest'},e.state.boss.id,'test',1e9);assert.equal(u.hp,1100);
  u.hp=9999;e.cosmicAfterSkill(u,{cosmicAction:'harvest'},e.state.boss.id,'test',1e9);assert.equal(u.hp,10000);
});

test('Highlight has one same-target Havoc and A4 Attack buff, without an extra counted action', () => {
  const e=fixture({targets:2,allies:true});const u=yui(e);e.setSharedHighlight(100);
  const before=e.state.actionNumber;const target=e.state.boss.summons[0];const havoc=u.cosmicYui.harvestHavocUses;
  e.stepHighlight(ID,target.id);
  assert.equal(e.state.actionNumber,before);assert.equal(u.cosmicYui.harvestHavocUses,havoc+1);
  approx(u.buffs.find(b=>b.id==='cosmic_cyber_farmer').value,.35);
  const moves=e.state.history.at(-1).events.filter(ev=>ev.type==='follow_up');assert.ok(moves.some(ev=>ev.targetId===target.id));
});

test('A0 Highlight does not gain the A4 bonus', () => {
  const e=fixture({awareness:0});const u=yui(e);e.setSharedHighlight(100);e.stepHighlight(ID,e.state.boss.id);
  assert.ok(!u.buffs.some(b=>b.id==='cosmic_cyber_farmer'));
});

test('signature R6 permanent summon Attack caps at 80% and static critical rate is 34.3%', () => {
  const e=fixture({weapon:'signature',refinement:6});const u=yui(e);for(let i=0;i<20;i++)e.cosmicSummon(u);
  approx(u.buffs.find(b=>b.id==='cosmic_weapon_summon').value,.8);
  approx(u.buffs.find(b=>b.id==='cosmic_weapon_static').value,.343);
  assert.equal(u.cosmicYui.summonWeaponStacks,4);
});

test('signature conditional critical damage applies only to Veg-Out Attack', () => {
  const e=fixture({weapon:'signature',refinement:6});const u=yui(e);
  assert.equal(e.cosmicPrepareSkill(u,u.skills[2],'character_skill').temporaryCritDamage,.628);
  assert.equal(e.cosmicPrepareSkill(u,u.skills[0],'character_skill').temporaryCritDamage,undefined);
  assert.equal(e.cosmicPrepareSkill(u,u.highlightSkill,'highlight').temporaryCritDamage,undefined);
});

test('equipped-static checkbox avoids double counting only the static weapon passive, not summon buffs', () => {
  const e=fixture({weapon:'signature',refinement:6,staticWeaponStatsIncluded:true});const u=yui(e);
  assert.ok(!u.buffs.some(b=>b.id==='cosmic_weapon_static'));
  approx(u.buffs.find(b=>b.id==='cosmic_weapon_summon').value,.8);
});

test('four-star weapon grants conditional Attack to Veg-Out only after a Resonance', () => {
  const e=fixture({weapon:'four-star',refinement:6,awareness:0});const u=yui(e);
  assert.equal(e.cosmicPrepareSkill(u,u.skills[2],'character_skill').temporaryAttackBonus,undefined);
  e.resolveCosmicHavoc(u,e.state.boss.id,'test');
  approx(e.cosmicPrepareSkill(u,u.skills[2],'character_skill').temporaryAttackBonus,.43);
  assert.equal(e.cosmicPrepareSkill(u,u.skills[0],'character_skill').temporaryAttackBonus,undefined);
});

test('owner-clock buffs are not ticked by unrelated shared-round status ticking', () => {
  const e=fixture({allies:true});const u=yui(e);cast(e,'assemble');
  const buff=u.buffs.find(b=>b.id==='cosmic_assemble_attack');const expiry=buff.expiresAfterOwnerTurn;
  e.tickPartyStatuses();assert.equal(u.buffs.find(b=>b.id==='cosmic_assemble_attack').expiresAfterOwnerTurn,expiry);
  guard(e);guard(e);guard(e);
  assert.ok(!u.buffs.some(b=>b.id==='cosmic_assemble_attack'));
});

test('dead Cosmic Yui cannot perform Resonance, auto attacks or new summons on turn start', () => {
  const e=fixture({allies:true});const u=yui(e);u.hp=0;
  const damage=e.state.totalDamage;const knights=e.cosmicKnightCount(u);
  e.cosmicBeginTurn(u);e.cosmicEndCountedAction('cosmic-test-ally');e.cosmicGainEnergy(u,7,'test');e.resolveCosmicAutomatic(u);
  assert.equal(e.state.totalDamage,damage);assert.equal(e.cosmicKnightCount(u),knights);
});

test('Auto recommendation uses free assemble, then a legal normal skill, without looping', () => {
  const e=fixture();const first=e.recommend();assert.equal(first.type,'cosmic_assemble');e.step(first);
  const next=e.recommend();assert.equal(next.skill.cosmicAction,'mobilize');e.step(next);
  assert.ok(e.state.actionNumber>=1);assert.equal(e.actor.characterTurnsStarted,2);
});

test('history snapshots preserve prior energy/knight counts rather than live object references', () => {
  const e=fixture();const start=structuredClone(e.state.history[0]);cast(e,'assemble');
  assert.deepEqual(e.state.history[0],start);
  const observation=e.getObservation();observation.party[0].cosmicYui.knights.potato=999;
  assert.notEqual(yui(e).cosmicYui.knights.potato,999);
});

test('all damage reconciles to actor contributions and damage events', () => {
  const e=fixture({allies:true});for(let i=0;i<12;i++){const a=e.recommend();e.step(a);}
  assert.equal(e.state.totalDamage,e.state.party.reduce((sum,u)=>sum+u.damageDone,0)+(e.state.navigator.damageDone||0));
  const logged=e.state.history.flatMap(frame=>frame.events).filter(event=>event.type==='damage').reduce((s,event)=>s+event.amount,0);
  assert.equal(logged,e.state.totalDamage);
});

test('same configuration and decisions yield identical seeded Cosmic runs', () => {
  function run(){const e=fixture({allies:true});for(let i=0;i<18;i++)e.step(e.recommend());return {damage:e.state.totalDamage,cosmic:yui(e).cosmicYui,history:e.state.history};}
  assert.deepEqual(run(),run());
});

test('fast mode keeps the same damage/resources as normal mode', () => {
  const a=fixture({allies:true}),b=fixture({allies:true,fastMode:true});
  for(let i=0;i<18;i++){a.step(a.recommend());b.step(b.recommend());}
  assert.equal(a.state.totalDamage,b.state.totalDamage);assert.deepEqual(yui(a).cosmicYui,yui(b).cosmicYui);
});

test('unknown timings and excluded coefficients are visible in observations', () => {
  const e=fixture();const limitations=e.getObservation().mechanicsLimitations.join(' ');
  assert.match(limitations,/Cosmic Yui/);assert.match(limitations,/Brainwash/);assert.match(limitations,/live confirmation/);
});

test('invalid external loadout values are bounded and unknown weapon profiles are not applied', () => {
  const e=fixture({awareness:99,sourceTier:99,refinement:-100,weapon:'nonexistent'});const u=yui(e);
  assert.equal(u.awareness,6);assert.equal(u.cosmicYui.sourceTier,3);assert.equal(u.cosmicYui.refinement,0);assert.equal(u.cosmicYui.weapon,'none');
});

test('Cosmic Yui normal skills are disabled in the archived mechanics profile', () => {
  const e=new BattleEngine({mechanicsProfile:'recorded-2026-08-29',characterDefinitions:[definition()],teamIds:[ID]});
  assert.ok(e.getAvailableActions().filter(a=>a.type==='skill').every(a=>!a.enabled&&/live mechanics/.test(a.unavailableReason)));
});


test('lower awareness can choose one available avatar color for free before the normal action', () => {
  const e=fixture({awareness:1});const u=yui(e);const before=e.state.actionNumber;
  const action=e.getAvailableActions().find(a=>a.type==='cosmic_color'&&a.color==='asparagus');
  assert.ok(action?.enabled);const result=e.step(action);
  assert.equal(result.consumedAction,false);assert.equal(u.cosmicYui.color,'asparagus');assert.equal(e.state.actionNumber,before);
  assert.ok(e.getAvailableActions().filter(a=>a.type==='cosmic_color').every(a=>!a.enabled));
});

test('A6 has no manual avatar-color choice because all four effects are always active', () => {
  const e=fixture();assert.equal(e.getAvailableActions().filter(a=>a.type==='cosmic_color').length,0);
});

test('reported step reward includes end-action Havoc and automatic Veg-Out damage', () => {
  const e=fixture({allies:true});const before=e.state.totalDamage;const result=guard(e);
  assert.equal(result.reward,e.state.totalDamage-before);assert.ok(result.reward>0);
});

test('Concert counted actions fire A6 Havoc without a free S2 triggering it', () => {
  const e=fixture({allies:true});const u=yui(e);
  e.state.navigator.codename='MIKU';e.state.navigator.virtualConcert={active:true,roundsRemaining:2,damageByTarget:{},totalRecordedDamage:0,savedTurn:null};
  const before=u.cosmicYui.harvestHavocUses;
  cast(e,'assemble');assert.equal(u.cosmicYui.harvestHavocUses,before);
  guard(e);assert.equal(u.cosmicYui.harvestHavocUses,before+1);
});


test('source refresh fails closed when the pinned skill coefficients change', () => {
  const changed=structuredClone(raw);changed.skills.skill1.description=changed.skills.skill1.description.replace('120.8%','999.9%');
  assert.throws(()=>normalizeCosmicYuiRecord(changed),/source coefficients differ/);
});

test('archived profile cannot invoke Cosmic Yui Highlight as a generic fallback', () => {
  const e=new BattleEngine({mechanicsProfile:'recorded-2026-08-29',characterDefinitions:[definition()],teamIds:[ID]});
  e.actor.highlight=100;assert.ok(e.getHighlightActions().every(a=>!a.enabled));
});
