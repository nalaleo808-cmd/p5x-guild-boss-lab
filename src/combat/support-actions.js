/** Explicit extra-action queue, separate from normal turn/action limits. */
export const SUPPORT_ACTION_KINDS = Object.freeze(['extra_skill', 'automatic_highlight', 'automatic_theurgy']);
export function enqueueSupportAction(runtime, action) {
  if (!action || !SUPPORT_ACTION_KINDS.includes(action.kind)) throw new TypeError('Unknown support action kind');
  for (const key of ['actorId', 'skillId', 'targetId', 'idempotencyKey', 'triggeringActorId']) {
    if (typeof action[key] !== 'string' || !action[key]) throw new TypeError(`Missing ${key}`);
  }
  if (typeof action.ignoreCost !== 'boolean') throw new TypeError('Explicit cost policy required');
  if (runtime.completedActionKeys.includes(action.idempotencyKey) || runtime.actions.some(item => item.idempotencyKey === action.idempotencyKey)) return false;
  if (runtime.actions.length >= 32) throw new RangeError('Support action queue safety limit reached');
  runtime.actions.push(structuredClone(action));
  return true;
}
export function completeSupportAction(runtime, action) {
  if (runtime.actions[0]?.idempotencyKey !== action.idempotencyKey) throw new Error('Support actions must resolve in queue order');
  runtime.actions.shift();
  runtime.completedActionKeys.push(action.idempotencyKey);
}
