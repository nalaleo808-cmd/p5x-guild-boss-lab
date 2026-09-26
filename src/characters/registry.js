/** Editable character overlay. Kept outside generated/synced reference catalogs.
 * Engine hooks: initialize, resolve, afterSkill, turnStart, normalTurnEnd,
 * decorateActions, stepControl, deferCompletion, recommend, refreshAuras.
 */
import { kotoneShiomi, KOTONE_SHIOMI_ID } from './kotone-shiomi-data.js';
import { KotoneShiomiMechanics } from './kotone-shiomi-mechanics.js';
export const localCharacters = Object.freeze([kotoneShiomi]);
export const characterMechanicsRegistry = Object.freeze({ [KOTONE_SHIOMI_ID]: KotoneShiomiMechanics });
export function createCharacterMechanics(id, engine) {
  const Mechanic = characterMechanicsRegistry[id];
  return Mechanic ? new Mechanic(engine) : null;
}
export function withLocalCharacters(characters) {
  const ids = new Set(localCharacters.map(unit => unit.id));
  const sourceSlugs = new Set(localCharacters.map(unit => unit.sourceSlug));
  return [...characters.filter(unit => !ids.has(unit.id) && !sourceSlugs.has(unit.slug)), ...localCharacters];
}
