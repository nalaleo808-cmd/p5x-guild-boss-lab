// Explicit registration keeps source descriptions separate from executable rules.
// Modules must never import BattleEngine, so engine and UI can share this registry.
import { characterResearch as cosmicResearch } from './bui-cosmic-data.js';
import { characterResearch as wonderResearch } from './wonder-data.js';
import * as data0 from './blitz-data.js';
import { characterMechanics as mechanics0 } from './blitz-mechanics.js';
import * as data1 from './luce-data.js';
import { characterMechanics as mechanics1 } from './luce-mechanics.js';
import * as data2 from './crow-data.js';
import { characterMechanics as mechanics2 } from './crow-mechanics.js';
import * as data3 from './turbo-data.js';
import { characterMechanics as mechanics3 } from './turbo-mechanics.js';
import * as data4 from './violet-data.js';
import { characterMechanics as mechanics4 } from './violet-mechanics.js';
import * as data5 from './wind-tempest-data.js';
import { characterMechanics as mechanics5 } from './wind-tempest-mechanics.js';
import * as data6 from './howler-data.js';
import { characterMechanics as mechanics6 } from './howler-mechanics.js';
import * as data7 from './mont-frostgale-data.js';
import { characterMechanics as mechanics7 } from './mont-frostgale-mechanics.js';
import * as data8 from './noir-data.js';
import { characterMechanics as mechanics8 } from './noir-mechanics.js';
import * as data9 from './ange-data.js';
import { characterMechanics as mechanics9 } from './ange-mechanics.js';
import * as data10 from './joker-data.js';
import { characterMechanics as mechanics10 } from './joker-mechanics.js';
import * as data11 from './rin-data.js';
import { characterMechanics as mechanics11 } from './rin-mechanics.js';
import * as data12 from './mona-data.js';
import { characterMechanics as mechanics12 } from './mona-mechanics.js';
import * as data13 from './okyann-data.js';
import { characterMechanics as mechanics13 } from './okyann-mechanics.js';
import { characterResearch as legacyResearch0 } from './berry-data.js';
import { legacyMethods as legacy0 } from './berry-mechanics.js';
import { characterResearch as legacyResearch1 } from './puppet-wavecatcher-data.js';
import { characterMechanics as wavecatcherMechanics, legacyMethods as legacy1 } from './puppet-wavecatcher-mechanics.js';
import { characterResearch as legacyResearch2 } from './marian-beachflower-data.js';
import { legacyMethods as legacy2 } from './marian-beachflower-mechanics.js';
import { characterResearch as legacyResearch3 } from './miku-data.js';
import { legacyMethods as legacy3 } from './miku-mechanics.js';
import { characterResearch as legacyResearch4 } from './j-c-data.js';
import { characterMechanics as jcMechanics, legacyMethods as legacy4 } from './j-c-mechanics.js';
import { characterResearch as legacyResearch5 } from './rin-firecracker-data.js';
import { legacyMethods as legacy5 } from './rin-firecracker-mechanics.js';
import { characterResearch as legacyResearch6 } from './matoi-data.js';
import { legacyMethods as legacy6 } from './matoi-mechanics.js';
import { characterResearch as legacyResearch7 } from './akihiko-data.js';
import { characterMechanics as akihikoMechanics, legacyMethods as legacy7 } from './akihiko-mechanics.js';
import { characterResearch as legacyResearch8 } from './yukari-data.js';
import { legacyMethods as legacy8 } from './yukari-mechanics.js';
import { characterResearch as legacyResearch9 } from './makoto-data.js';
import { legacyMethods as legacy9 } from './makoto-mechanics.js';

export const characterModules = [
  { research: wonderResearch },
  { research: legacyResearch0, legacyMethods: legacy0 },
  { research: legacyResearch1, legacyMethods: legacy1, mechanics: wavecatcherMechanics },
  { research: legacyResearch2, legacyMethods: legacy2 },
  { research: legacyResearch3, legacyMethods: legacy3 },
  { research: legacyResearch4, legacyMethods: legacy4, mechanics: jcMechanics },
  { research: legacyResearch5, legacyMethods: legacy5 },
  { research: legacyResearch6, legacyMethods: legacy6 },
  { research: legacyResearch7, legacyMethods: legacy7, mechanics: akihikoMechanics },
  { research: legacyResearch8, legacyMethods: legacy8 },
  { research: legacyResearch9, legacyMethods: legacy9 },
  { research: cosmicResearch, existingLimitations: true },
  { research: data0.characterResearch, mechanics: mechanics0, adapt: data0.adaptCharacterDefinition, definition: data0.characterDefinition },
  { research: data1.characterResearch, mechanics: mechanics1, adapt: data1.adaptCharacterDefinition, definition: data1.characterDefinition },
  { research: data2.characterResearch, mechanics: mechanics2, adapt: data2.adaptCharacterDefinition, definition: data2.characterDefinition },
  { research: data3.characterResearch, mechanics: mechanics3, adapt: data3.adaptCharacterDefinition, definition: data3.characterDefinition },
  { research: data4.characterResearch, mechanics: mechanics4, adapt: data4.adaptCharacterDefinition, definition: data4.characterDefinition },
  { research: data5.characterResearch, mechanics: mechanics5, adapt: data5.adaptCharacterDefinition, definition: data5.characterDefinition },
  { research: data6.characterResearch, mechanics: mechanics6, adapt: data6.adaptCharacterDefinition, definition: data6.characterDefinition },
  { research: data7.characterResearch, mechanics: mechanics7, adapt: data7.adaptCharacterDefinition, definition: data7.characterDefinition },
  { research: data8.characterResearch, mechanics: mechanics8, adapt: data8.adaptCharacterDefinition, definition: data8.characterDefinition },
  { research: data9.characterResearch, mechanics: mechanics9, adapt: data9.adaptCharacterDefinition, definition: data9.characterDefinition },
  { research: data10.characterResearch, mechanics: mechanics10, adapt: data10.adaptCharacterDefinition, definition: data10.characterDefinition },
  { research: data11.characterResearch, mechanics: mechanics11, adapt: data11.adaptCharacterDefinition, definition: data11.characterDefinition },
  { research: data12.characterResearch, mechanics: mechanics12, adapt: data12.adaptCharacterDefinition, definition: data12.characterDefinition },
  { research: data13.characterResearch, mechanics: mechanics13, adapt: data13.adaptCharacterDefinition, definition: data13.characterDefinition },
];

export const registeredLegacyMethods = Object.assign({}, ...characterModules.map(module => module.legacyMethods || {}));

export function characterKey(unit) {
  return unit?.slug || unit?.sourceCharacterId?.replace(/^lufel-recent-/, '')
    || unit?.id?.replace(/^navigator-/, '');
}

export function characterModuleFor(unit) {
  const key = characterKey(unit);
  return characterModules.find(module => module.research.slug === key) || null;
}

export function adaptRegisteredCharacter(record) {
  const module = characterModuleFor(record);
  if (module?.definition) return { ...record, ...structuredClone(module.definition) };
  if (!module?.adapt) return record;
  const adapted = module.adapt(record);
  // Full research belongs in the registry, not in every replay frame.
  if (adapted !== record) delete adapted.characterResearch;
  return adapted;
}

export function initializeRegisteredCharacters(engine) {
  if (!engine.usesLiveMechanics()) return;
  for (const unit of [...engine.state.party, engine.state.navigator]) {
    const module = characterModuleFor(unit);
    if (!module) continue;
    for (const limitation of module.existingLimitations ? [] : module.research.limitations || []) {
      const message = `${module.research.slug}: ${limitation}`;
      if (!engine.state.mechanicsLimitations.includes(message)) engine.state.mechanicsLimitations.push(message);
    }
    module.mechanics?.initialize?.(engine, unit);
  }
}

export function characterHook(engine, unit, hook, ...args) {
  if (!engine.usesLiveMechanics()) return undefined;
  return characterModuleFor(unit)?.mechanics?.[hook]?.(engine, unit, ...args);
}

export function notifyCharacterActionEnd(engine, actor, context) {
  if (!engine.usesLiveMechanics()) return;
  characterHook(engine, actor, 'onActionEnd', context);
  for (const unit of [...engine.state.party, engine.state.navigator]) {
    if (unit.hp != null && unit.hp <= 0) continue;
    characterHook(engine, unit, 'onAllyActionEnd', actor, context);
  }
}

export function prepareCharacterDamage(engine, actor, skill, target, sourceType) {
  if (!engine.usesLiveMechanics()) return skill;
  for (const unit of [...engine.state.party, engine.state.navigator]) {
    if (unit.hp != null && unit.hp <= 0) continue;
    skill = characterHook(engine, unit, 'beforeDamage', actor, skill, target, sourceType) || skill;
  }
  return skill;
}

export function notifyCharacterDamage(engine, packet) {
  if (!engine.usesLiveMechanics()) return;
  for (const unit of [...engine.state.party, engine.state.navigator]) {
    if (unit.hp != null && unit.hp <= 0) continue;
    characterHook(engine, unit, 'onDamage', packet);
  }
}

export function notifyCharacterSpecialAction(engine, actor, context) {
  if (!engine.usesLiveMechanics()) return;
  for (const unit of [...engine.state.party, engine.state.navigator]) {
    if (unit.hp != null && unit.hp <= 0) continue;
    characterHook(engine, unit, 'onAllySpecialAction', actor, context);
  }
}

export function notifyCharacterKnockout(engine, target, context = {}) {
  if (!engine.usesLiveMechanics()) return;
  for (const unit of [...engine.state.party, engine.state.navigator]) {
    if (unit.hp != null && unit.hp <= 0) continue;
    characterHook(engine, unit, 'onAllyKnockout', target, context);
  }
}
