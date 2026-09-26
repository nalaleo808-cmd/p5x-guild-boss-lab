/** Generic stat accounting, not published Kotone weapon data. Ratios use 0.10 = 10%. */
const nonnegative = (value, name) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new TypeError(`${name} must be a nonnegative number`);
  return value;
};
export function enhancementValue(values, enhancement, name = 'Enhancement values') {
  if (!Array.isArray(values) || values.length !== 7 || values.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0)) throw new TypeError(`${name} must contain exactly seven finite values (+0…+6)`);
  if (!Number.isInteger(enhancement) || enhancement < 0 || enhancement > 6) throw new RangeError('Enhancement must be +0 through +6');
  return values[enhancement];
}
/** An equipped total is never reverse-engineered into an assumed base. */
export function equippedAttack({ mode, baseAttack, totalAttack, componentAttack, staticAttackRatio, selectedWeaponId, totalIncludesWeaponId, temporaryAttackRatio = 0 }) {
  nonnegative(temporaryAttackRatio, 'Temporary Attack');
  if (mode === 'equipped') {
    nonnegative(totalAttack, 'Equipped Attack total');
    if (selectedWeaponId !== totalIncludesWeaponId) throw new Error('Weapon changed: enter a new equipped total or switch to base stats');
    return { permanentAttack: totalAttack, attack: totalAttack * (1 + temporaryAttackRatio), componentAdded: 0, staticPassiveAdded: 0, mode };
  }
  if (mode !== 'base') throw new TypeError('Explicit base/equipped mode required');
  nonnegative(baseAttack, 'Base Attack'); nonnegative(componentAttack, 'Weapon component Attack'); nonnegative(staticAttackRatio, 'Static Attack passive');
  const subtotal = baseAttack + componentAttack;
  const permanentAttack = subtotal * (1 + staticAttackRatio);
  return { permanentAttack, attack: permanentAttack * (1 + temporaryAttackRatio), componentAdded: componentAttack, staticPassiveAdded: subtotal * staticAttackRatio, mode };
}
/** Policies are supplied from a verified profile, never inferred from a tooltip. */
export function grantStack({ stacks, grant, ownerId, now, cap, duration, copiedBuffsCount }) {
  if (!Array.isArray(stacks) || !grant || typeof copiedBuffsCount !== 'boolean') throw new TypeError('Explicit stack and trigger policy required');
  if (!Number.isInteger(cap) || cap < 1 || !Number.isInteger(duration) || duration < 1 || !Number.isInteger(now) || now < 0) throw new TypeError('Invalid clock, cap or duration');
  const active = stacks.filter(stack => stack.expiresAt > now);
  if (grant.casterId !== ownerId || grant.kind !== 'buff' || (grant.isCopy && !copiedBuffsCount) || !grant.castId) return active;
  // One cast must not count once per party recipient or once per status component.
  if (active.some(stack => stack.castId === grant.castId)) return active;
  if (active.length >= cap) return active; // No implicit all-stack refresh at cap.
  return [...active, { castId: grant.castId, expiresAt: now + duration }];
}
