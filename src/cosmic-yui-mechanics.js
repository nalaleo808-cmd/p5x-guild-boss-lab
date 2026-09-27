import { COSMIC_KNIGHT_ORDER, COSMIC_YUI_COEFFICIENTS as C, COSMIC_YUI_WEAPONS as W, COSMIC_YUI_LIMITATIONS } from './cosmic-yui-data.js';

const integer = (value, fallback, min, max) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Math.floor(Number(value)))) : fallback;
const colorNames = { eggplant: 'EGGPLANT PURPLE', potato: 'POTATO YELLOW', mushroom: 'MUSHROOM RED', asparagus: 'ASPARAGUS GREEN', prismatic: 'PRISMATIC' };

// These hooks keep Cosmic Yui's resource/turn rules separate from the generic
// damage resolver. Every hit still uses the existing scoring/replay pipeline.
export const cosmicYuiMethods = {
  isCosmicYui(unit) { return this.usesLiveMechanics() && unit?.slug === 'bui-cosmic'; },

  initializeCosmicYui() {
    for (const unit of this.state.party.filter(member => this.isCosmicYui(member))) {
      const options = this.config.loadouts[unit.id]?.cosmicYui || {};
      const weapon = Object.hasOwn(W, options.weapon) ? options.weapon : 'none';
      unit.cosmicYui = {
        energy: 0, knights: { eggplant: 0, potato: 0, mushroom: 0, asparagus: 0 },
        seedPotato: unit.awareness >= 2 ? 1 : 0, summonCursor: 0,
        color: unit.awareness >= 6 ? 'prismatic' : unit.awareness >= 1 ? 'potato' : 'none',
        pendingColor: null, colorChosenTurn: -1, harvestUntil: -1, permanentHarvest: unit.awareness >= 6,
        weapon, refinement: integer(options.refinement, 0, 0, 6), summonWeaponStacks: 0,
        sourceTier: integer(options.sourceTier, 3, 0, 3),
        staticWeaponStatsIncluded: options.staticWeaponStatsIncluded === true,
        totalSummoned: unit.awareness >= 2 ? 1 : 0, harvestHavocUses: 0,
        automaticVegOutUses: 0, manualVegOutUses: 0,
        automaticPending: false, resolvingAutomatic: false
      };
      if (unit.awareness >= 1) {
        for (const knight of COSMIC_KNIGHT_ORDER) this.cosmicSummon(unit, knight, 'awareness_start');
        unit.cosmicYui.energy = 7;
        unit.cosmicYui.automaticPending = true;
      } else if (unit.cosmicYui.seedPotato) this.cosmicOnSummon(unit, 1);
      if (unit.cosmicYui.seedPotato && unit.awareness >= 1) this.cosmicOnSummon(unit, 1);
      if (weapon !== 'none' && !unit.cosmicYui.staticWeaponStatsIncluded) {
        const tier = unit.cosmicYui.refinement;
        this.cosmicBuff(unit, 'cosmic_weapon_static', W[weapon].name, weapon === 'signature' ? 'critRate' : 'attack',
          weapon === 'signature' ? W.signature.critRate[tier] : W['four-star'].attack[tier], null, 'equipment');
      }
      this.refreshCosmicPassives(unit);
      if (unit.awareness >= 2) this.cosmicPotatoPower(unit, 2, 'awareness');
      this.state.mechanicsLimitations.push(...COSMIC_YUI_LIMITATIONS);
      this.emit('cosmic_state', 'Cosmic Yui joined with source-based Veggie Knight mechanics.', { actorId: unit.id, sourceType: 'passive', tone: 'phase' });
    }
  },

  cosmicValue(unit, key) { return C[key][unit.cosmicYui.sourceTier]; },
  cosmicKnightCount(unit) { const c = unit.cosmicYui; return Object.values(c.knights).reduce((a, b) => a + b, 0) + c.seedPotato; },
  cosmicHasColor(unit, color) { return unit.cosmicYui.color === 'prismatic' || unit.cosmicYui.color === color; },

  cosmicBuff(unit, id, name, stat, value, duration = null, sourceType = 'passive') {
    const ownActiveTurn = this.actor?.id === unit.id && unit.characterTurnsStarted > 0;
    return this.applyUnitBuff(unit, { id, name, stat, value, duration,
      ...(duration == null ? {} : { durationClock: 'cosmic_owner_end',
        expiresAfterOwnerTurn: unit.characterTurnsStarted + duration - (ownActiveTurn ? 1 : 0) })
    }, sourceType);
  },

  cosmicPotatoPower(unit, duration = 3, sourceType = 'resonance_follow_up') {
    this.cosmicBuff(unit, 'cosmic_potato_power', 'POTATO POWER', 'allOutDamage',
      this.cosmicValue(unit, 'potatoPower') + (unit.awareness >= 2 ? .1 : 0), duration, sourceType);
  },

  refreshCosmicPassives(unit) {
    const count = this.cosmicKnightCount(unit);
    this.cosmicBuff(unit, 'cosmic_satellite', 'VEGGIE SATELLITE', 'damage', .081 * Math.min(4, count));
    this.cosmicBuff(unit, 'cosmic_mixed_vegetables', 'MIXED VEGETABLES', 'allOutDamage', .15);
    this.cosmicBuff(unit, 'cosmic_yellow', 'POTATO YELLOW', 'allOutDamage', this.cosmicHasColor(unit, 'potato') ? .15 : 0);
    this.cosmicBuff(unit, 'cosmic_knight_rounds', 'VEGGIE KNIGHT ROUNDS', 'critDamage', unit.awareness >= 1 ? .08 * Math.min(5, count) : 0);
  },

  cosmicOnSummon(unit, count = 1) {
    const c = unit.cosmicYui;
    if (c.weapon === 'signature') {
      c.summonWeaponStacks = Math.min(4, c.summonWeaponStacks + count);
      this.cosmicBuff(unit, 'cosmic_weapon_summon', 'STARLIGHT DECIMATORS · SUMMON', 'attack',
        c.summonWeaponStacks * W.signature.summonAttack[c.refinement]);
    }
  },

  cosmicSummon(unit, requestedKnight = null, sourceType = 'character_passive') {
    const c = unit.cosmicYui;
    let knight = requestedKnight;
    if (!knight) {
      for (let offset = 0; offset < COSMIC_KNIGHT_ORDER.length; offset += 1) {
        const index = (c.summonCursor + offset) % COSMIC_KNIGHT_ORDER.length;
        const candidate = COSMIC_KNIGHT_ORDER[index];
        if (c.knights[candidate] < (candidate === 'potato' ? 4 : 1)) {
          knight = candidate;
          c.summonCursor = (index + 1) % COSMIC_KNIGHT_ORDER.length;
          break;
        }
      }
    }
    if (!Object.hasOwn(c.knights, knight) || c.knights[knight] >= (knight === 'potato' ? 4 : 1)) return null;
    c.knights[knight] += 1;
    c.totalSummoned += 1;
    this.cosmicOnSummon(unit);
    if (c.color === 'none') c.color = knight;
    this.refreshCosmicPassives(unit);
    this.emit('cosmic_summon', `Cosmic Yui summoned ${knight} knight (${this.cosmicKnightCount(unit)} present).`, {
      actorId: unit.id, knight, knights: structuredClone(c.knights), seedPotato: c.seedPotato, sourceType, tone: 'buff'
    });
    return knight;
  },

  cosmicBeginTurn(unit) {
    if (!this.isCosmicYui(unit) || unit.hp <= 0) return;
    const c = unit.cosmicYui;
    if (unit.characterTurnsStarted === 1 && unit.awareness >= 1 && unit.awareness < 6) c.color = 'eggplant';
    this.cosmicSummon(unit, null, 'turn_start');
    this.refreshCosmicPassives(unit);
  },

  cosmicPrepareSkill(unit, original, sourceType) {
    if (!this.isCosmicYui(unit) || !original.cosmicAction) return original;
    const skill = { ...original };
    delete skill.buff; delete skill.debuff; delete skill.heal; delete skill.healFlat;
    const action = skill.cosmicAction;
    if (['harvest', 'highlight', 'havoc'].includes(action)) skill.power = this.cosmicValue(unit, action);
    if (action === 'assemble') skill.power = 0;
    if (action === 'mobilize') {
      const c = unit.cosmicYui;
      const count = this.cosmicKnightCount(unit);
      const spent = Math.max(0, c.knights.potato - 1);
      // Freeze the recipient count and knight inventory before any hit can spawn or defeat a target.
      const targetIds = skill.cosmicAutomatic ? this.enemies.filter(e => e.alive !== false).map(e => e.id) : null;
      const divisor = Math.max(1, targetIds?.length || 1);
      skill.power = this.cosmicValue(unit, 'mobilize') / divisor;
      skill.cosmicExtraHitPowers = [
        ...Array(count).fill(this.cosmicValue(unit, 'knight') / divisor),
        ...Array(spent).fill(this.cosmicValue(unit, 'spentPotato') / divisor)
      ];
      skill.damageClass = 'cosmic_all_out_attack';
      skill.cosmicSpentPotatoes = spent;
      skill.cosmicKnightsAtCast = count;
      skill.cosmicTargetIds = targetIds;
      if (c.weapon === 'signature') skill.temporaryCritDamage = W.signature.vegOutCritDamage[c.refinement];
      if (c.weapon === 'four-star' && unit.buffs.some(b => b.id === 'cosmic_four_star_ready')) {
        skill.temporaryAttackBonus = (skill.temporaryAttackBonus || 0) + W['four-star'].resonanceVegOutAttack[c.refinement];
      }
    }
    return skill;
  },

  cosmicGainEnergy(unit, amount, trigger) {
    const c = unit.cosmicYui;
    c.energy = Math.min(7, c.energy + amount);
    this.emit('cosmic_energy', `Veggie Energy: ${c.energy}/7 (${trigger}).`, { actorId: unit.id, resource: 'veggieEnergy', amount: c.energy, trigger, sourceType: 'character_passive', tone: 'buff' });
    if (c.energy >= 7) c.automaticPending = true;
  },

  resolveCosmicAutomatic(unit) {
    if (!this.isCosmicYui(unit) || unit.hp <= 0 || !unit.cosmicYui.automaticPending || unit.cosmicYui.resolvingAutomatic || this.state.phase !== 'battle') return 0;
    const c = unit.cosmicYui;
    if (c.energy < 7 || !this.enemies.some(e => e.alive !== false)) return 0;
    c.automaticPending = false;
    c.energy = 0;
    c.resolvingAutomatic = true;
    c.automaticVegOutUses += 1;
    this.emit('cosmic_auto', '7 Veggie Energy spent: automatic Veg-Out Attack, split across the current field.', {
      actorId: unit.id, sourceType: 'cosmic_all_out_attack', targetId: 'all_enemies', tone: 'phase'
    });
    try {
      const skill = { ...unit.skills.find(s => s.cosmicAction === 'mobilize'),
        id: `${unit.id}-automatic-veg-out`, name: 'Veg-Out Attack · Automatic', cost: 0,
        target: 'all_enemies', cosmicAutomatic: true };
      return this.resolveSkill(unit, skill, 'all_enemies', 'cosmic_all_out_attack', { ignoreCost: true, grantsHighlight: false, canReduceDown: false });
    } finally { c.resolvingAutomatic = false; }
  },

  cosmicAfterSkill(unit, skill, targetId, sourceType, damage) {
    if (!this.isCosmicYui(unit) || !skill.cosmicAction) return 0;
    const c = unit.cosmicYui;
    const action = skill.cosmicAction;
    let extraDamage = 0;
    if (action === 'mobilize') {
      c.knights.potato = Math.max(0, c.knights.potato - Number(skill.cosmicSpentPotatoes || 0));
      this.refreshCosmicPassives(unit);
      this.emit('cosmic_spend', `Veg-Out Attack used ${skill.cosmicKnightsAtCast} knights; spent ${skill.cosmicSpentPotatoes} regular potatoes. Seed potato preserved.`, {
        actorId: unit.id, spent: skill.cosmicSpentPotatoes, seedPotato: c.seedPotato,
        knightsAtCast: skill.cosmicKnightsAtCast, sourceType, tone: 'phase'
      });
      if (!skill.cosmicAutomatic && sourceType === 'character_skill') {
        c.manualVegOutUses += 1;
        this.cosmicGainEnergy(unit, 2, 'manual Veg-Out Attack');
        if (c.knights.eggplant) c.pendingColor = 'eggplant';
      }
    }
    if (action === 'harvest' && sourceType === 'character_skill') {
      c.harvestUntil = unit.characterTurnsStarted + 1;
      this.cosmicGainEnergy(unit, 3, 'Harvest Fest');
      if (c.knights.potato + c.seedPotato > 0) c.pendingColor = 'potato';
    }
    if (sourceType === 'character_skill' && ['harvest', 'mobilize'].includes(action) && this.cosmicHasColor(unit, 'eggplant')) this.cosmicGainEnergy(unit, 1, 'Eggplant Purple');
    if (damage > 0 && this.cosmicHasColor(unit, 'asparagus') && ['harvest', 'mobilize', 'highlight'].includes(action)) {
      const healed = Math.max(0, Math.min(Math.floor(damage * .01), 1000, unit.maxHp - unit.hp));
      unit.hp += healed;
      if (healed) this.emit('heal', `Asparagus Green restored ${healed} HP to Cosmic Yui.`, { actorId: unit.id, targetId: unit.id, amount: healed, sourceType: 'passive', tone: 'heal' });
    }
    if (action === 'highlight' && sourceType === 'highlight') {
      if (unit.awareness >= 4) this.cosmicBuff(unit, 'cosmic_cyber_farmer', 'CYBER FARMER', 'attack', .35, 4, 'awareness');
      // Same-target follow-up only. Do not invent unspecified Highlight-specific changes.
      const target = this.findEnemy(targetId);
      if (target && target.alive !== false) extraDamage += this.resolveCosmicHavoc(unit, target.id, 'highlight');
    }
    if (action === 'havoc') {
      if (c.weapon === 'four-star') this.cosmicBuff(unit, 'cosmic_four_star_ready', 'SPROUTING VOYAGERS READY', 'cosmicWeaponReady', 1, 2, 'equipment');
      if (this.cosmicHasColor(unit, 'potato')) this.cosmicPotatoPower(unit);
      const target = this.findEnemy(targetId);
      if (this.cosmicHasColor(unit, 'mushroom') && target && target.alive !== false) {
        const effect = this.applyEnemyStatus(target, 'debuffs', { id: `cosmic_spores_${unit.id}`, name: 'SHROOM SPORES', damageTaken: true,
          value: this.cosmicValue(unit, 'spores'), duration: 2 }, 'resonance_follow_up', unit.id);
        if (effect) this.emit('debuff', `${target.name} gained Shroom Spores.`, { actorId: unit.id, targetId: target.id, status: structuredClone(effect), sourceType: 'resonance_follow_up', tone: 'debuff' });
      }
      if (this.cosmicHasColor(unit, 'asparagus')) {
        const ally = this.state.party.filter(p => p.hp > 0).sort((a, b) => a.hp - b.hp)[0];
        if (ally) {
          const healed = Math.max(0, Math.min(this.cosmicValue(unit, 'heal'), ally.maxHp - ally.hp));
          ally.hp += healed;
          if (healed) this.emit('heal', `Harvest Havoc restored ${healed} HP to ${ally.codename}.`, { actorId: unit.id, targetId: ally.id, amount: healed, sourceType: 'resonance_follow_up', tone: 'heal' });
        }
      }
      if (this.cosmicHasColor(unit, 'eggplant')) this.cosmicGainEnergy(unit, 1, 'Harvest Havoc');
    }
    if (action !== 'assemble') extraDamage += this.resolveCosmicAutomatic(unit);
    return extraDamage;
  },

  resolveCosmicHavoc(unit, targetId = null, trigger = 'ally_action_end') {
    if (!this.isCosmicYui(unit) || unit.hp <= 0 || this.state.phase !== 'battle') return 0;
    const targets = this.enemies.filter(e => e.alive !== false);
    if (!targets.length) return 0;
    const target = targetId ? targets.find(e => e.id === targetId) : targets[Math.floor(this.random() * targets.length)];
    if (!target) return 0;
    unit.cosmicYui.harvestHavocUses += 1;
    this.emit('follow_up', `Cosmic Yui activated Harvest Havoc (${trigger}).`, { actorId: unit.id, targetId: target.id, sourceType: 'resonance_follow_up', tone: 'navigator' });
    return this.resolveSkill(unit, { id: `${unit.id}-havoc`, name: 'Harvest Havoc', slot: 'FU', element: 'nuclear',
      cost: 0, power: this.cosmicValue(unit, 'havoc'), target: 'boss', cosmicAction: 'havoc' }, target.id, 'resonance_follow_up', { ignoreCost: true, grantsHighlight: false });
  },

  cosmicEndCountedAction(completedActorId) {
    for (const unit of this.state.party.filter(p => this.isCosmicYui(p) && p.hp > 0)) {
      const c = unit.cosmicYui;
      const ownAction = unit.id === completedActorId;
      if (ownAction && c.pendingColor) {
        if (!c.permanentHarvest) c.color = c.pendingColor;
        c.pendingColor = null;
        this.refreshCosmicPassives(unit);
      }
      // A6 listens to *counted* actions, including Concert. Free assemble,
      // highlights, medicines, one-mores and nested follow-ups never call here.
      if (c.permanentHarvest || (ownAction && unit.characterTurnsStarted <= c.harvestUntil)) this.resolveCosmicHavoc(unit);
    }
  },

  cosmicEndOwnerTurn(unit) {
    if (!this.isCosmicYui(unit)) return;
    unit.buffs = unit.buffs.filter(effect => {
      if (effect.durationClock !== 'cosmic_owner_end') return true;
      effect.duration = Math.max(0, effect.expiresAfterOwnerTurn - unit.characterTurnsStarted);
      return effect.duration > 0;
    });
  },

  cosmicColorActions(actor) {
    if (!this.isCosmicYui(actor) || actor.awareness >= 6 || actor.hp <= 0) return [];
    const c = actor.cosmicYui;
    return COSMIC_KNIGHT_ORDER.filter(color => c.knights[color] + (color === 'potato' ? c.seedPotato : 0) > 0).map(color => ({
      type: 'cosmic_color', skillId: `cosmic-color:${color}`, actorId: actor.id,
      name: colorNames[color], target: 'self', color, cost: 0,
      enabled: color !== c.color && c.colorChosenTurn !== actor.characterTurnsStarted && this.state.turnActionsUsed === 0
    }));
  },

  stepCosmicColor(action) {
    const actor = this.actor;
    actor.cosmicYui.color = action.color;
    actor.cosmicYui.colorChosenTurn = actor.characterTurnsStarted;
    this.refreshCosmicPassives(actor);
    this.emit('cosmic_color', `Vegetable Avatar changed to ${colorNames[action.color]}.`, { actorId: actor.id, color: action.color, sourceType: 'cosmic_color', tone: 'phase' });
    this.recordFrame(action.name);
    return { nextState: this.config.fastMode ? null : this.getObservation(), reward: 0, done: false, consumedAction: false,
      events: this.config.fastMode ? [] : structuredClone(this.state.history.at(-1).events) };
  },

  stepCosmicAssemble(action) {
    const actor = this.actor;
    if (!this.isCosmicYui(actor)) throw new Error('Cosmic Yui is not the current actor');
    const c = actor.cosmicYui;
    this.cosmicBuff(actor, 'cosmic_assemble_attack', 'VEGGIE KNIGHTS · ATK', 'attack', this.cosmicValue(actor, 'assembleAttack'), 2, 'character_skill');
    this.cosmicBuff(actor, 'cosmic_assemble_crit', 'VEGGIE KNIGHTS · CRIT', 'critRate', this.cosmicValue(actor, 'assembleCrit'), 2, 'character_skill');
    this.cosmicSummon(actor, null, 'cosmic_assemble');
    if (actor.awareness >= 6) this.cosmicSummon(actor, 'potato', 'awareness');
    actor.skillCooldowns[action.skillId] = 1;
    this.emit('move', 'Cosmic Yui used Veggie Knights, Go! — free action; normal skill remains available.', { actorId: actor.id, skillId: action.skillId, sourceType: 'cosmic_assemble', tone: 'buff' });
    this.recordFrame(action.name);
    return { nextState: this.config.fastMode ? null : this.getObservation(), reward: 0, done: false, consumedAction: false,
      events: this.config.fastMode ? [] : structuredClone(this.state.history.at(-1).events) };
  },

  cosmicRecommendation(candidates) {
    if (!this.isCosmicYui(this.actor)) return null;
    const assemble = candidates.find(a => a.type === 'cosmic_assemble');
    if (assemble) return { ...structuredClone(assemble), targetId: this.actor.id, reason: 'Free summon and self-buffs before spending the normal action.', confidence: .95 };
    const c = this.actor.cosmicYui;
    const action = candidates.find(a => a.skill?.cosmicAction === (!c.permanentHarvest && c.harvestUntil < this.actor.characterTurnsStarted ? 'harvest' : 'mobilize'));
    if (!action) return null;
    const target = this.enemies.filter(e => e.alive !== false).sort((a, b) => (a.resistances?.includes('nuclear') ? 1 : 0) - (b.resistances?.includes('nuclear') ? 1 : 0) || b.hp - a.hp)[0];
    return { ...structuredClone(action), targetId: target.id, reason: 'Maintain Huge Harvest, then use knight-scaled Veg-Out Attack.', confidence: .9 };
  }
};
