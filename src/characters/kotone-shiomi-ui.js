import { KOTONE_SHIOMI_ID, kotoneWeapons, kotoneAwareness, kotoneShiomi, kotoneWeaponProfile } from './kotone-shiomi-data.js';
import { normalizeKotoneDraft } from './kotone-shiomi-mechanics.js';
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function kotoneBuildEditor(loadout) {
  const b = normalizeKotoneDraft(loadout);
  const weapon = kotoneWeapons.find(item => item.id === b.weaponId);
  const invalidTotals = b.statsMode === 'equipped' && loadout.equippedTotalsFor && loadout.equippedTotalsFor !== `${b.weaponId}+${b.enhancement}`;
  const profile = weapon.supportedEnhancements.includes(b.enhancement) ? kotoneWeaponProfile(b.weaponId, b.enhancement) : null;
  return `<section class="build-section kotone-combat-build"><div class="build-section-title"><div><span>PLAYABLE · EXPERIMENTAL GLOBAL PROFILE</span><h3>Kotone combat configuration</h3></div><em>No Mindscape Core</em></div>
  <div class="kotone-fields">
    <label>Awareness<select data-kotone-build="awareness">${kotoneAwareness.map(tier => `<option value="${tier.level}" ${b.awareness === tier.level ? 'selected' : ''}>A${tier.level}${tier.implemented ? '' : ' · level coefficients pending'}</option>`).join('')}</select></label>
    <label>Weapon<select data-kotone-build="weaponId">${kotoneWeapons.map(item => `<option value="${item.id}" ${item.id === b.weaponId ? 'selected' : ''}>${item.rarity ? `${item.rarity}★ ` : ''}${esc(item.name)}</option>`).join('')}</select></label>
    <label>Enhancement<select data-kotone-build="enhancement" ${b.weaponId === 'none' ? 'disabled' : ''}>${Array.from({length:7},(_,n) => `<option value="${n}" ${b.enhancement === n ? 'selected' : ''} ${weapon.supportedEnhancements.includes(n) ? '' : 'disabled'}>+${n}${weapon.supportedEnhancements.includes(n) ? '' : ' · data unavailable'}</option>`).join('')}</select></label>
    <label>Stat basis<select data-kotone-build="statsMode"><option value="base" ${b.statsMode === 'base' ? 'selected' : ''}>Non-weapon inputs</option><option value="equipped" ${b.statsMode === 'equipped' ? 'selected' : ''}>Final equipped totals</option></select></label>
    <label>A2+ copy ratio % — PROVISIONAL<input data-kotone-build="a2CopyRatio" type="number" min="0" max="200" step="0.1" value="${Number((b.a2CopyRatio * 100).toFixed(4))}"></label>
  </div>
  ${invalidTotals ? '<p class="kotone-warning" role="alert">Weapon changed. Enter the new equipped HP, Attack and Defense below, then confirm.</p><button data-kotone-confirm-totals>Confirm entered totals match this weapon</button>' : ''}
  <p class="formula-note">Default 2500 Attack and 3200 HP are illustrative build inputs, not verified natural stats. Replace them with your build.</p>
  <p class="formula-note">${b.statsMode === 'base' ? 'Weapon component HP/Attack/Defense and static Attack are added once. Do not enter values that already include the weapon.' : 'Entered totals already include this weapon and static passive. Neither is added again. Temporary battle buffs still apply.'}</p>
  <p>${profile ? `Component HP ${profile.component.maxHp}; Attack ${profile.component.attack}; Defense ${profile.component.defense}. Static Attack +${(profile.staticAttack*100).toFixed(0)}%.` : 'This weapon level is unavailable.'}</p>
  <p class="kotone-warning">Fixed displayed-tooltip coefficients, not verified live Lufel values. A3/A5 skill-level increases are NOT applied. A2 defaults to the explicit 30% × 1.25 hypothesis (37.5% extra copy); change the field to test another ordinary-Global interpretation. Four-star +1–+6 are disabled.</p>
  <details><summary>Awareness and runtime policies</summary>${kotoneAwareness.map(tier => `<p><b>A${tier.level}: ${esc(tier.name)}</b> — ${esc(tier.note)}</p>`).join('')}<p>Duration clocks advance on normal personal turns, not Fortune extras. Temporary stacks have individual clocks; at cap the earliest-expiring temporary stack is replaced. Copies count as one buff-grant cast, not one weapon stack per copied stat.</p></details>
  </section>`;
}
export function bindKotoneBuild(root, loadout, saveAndRender) {
  root.querySelectorAll('[data-kotone-build]').forEach(control => control.addEventListener('change', () => {
    const key = control.dataset.kotoneBuild;
    const wasEquipped = loadout.statsMode === 'equipped';
    const oldWeapon = `${loadout.weaponId || 'none'}+${loadout.enhancement || 0}`;
    loadout[key] = ['awareness','enhancement'].includes(key) ? Number(control.value) : key === 'a2CopyRatio' ? Math.max(0, Math.min(2, Number(control.value) / 100)) : control.value;
    if (key === 'a2CopyRatio') loadout.copyRatioPolicy = 'explicit-build-input';
    if (key === 'weaponId') loadout.enhancement = 0;
    if (wasEquipped && ['weaponId','enhancement'].includes(key)) loadout.equippedTotalsFor = oldWeapon;
    if (key === 'statsMode') {
      if (loadout.statsMode === 'equipped') loadout.equippedTotalsFor = 'confirmation-required';
      else delete loadout.equippedTotalsFor;
    }
    saveAndRender();
  }));
  root.querySelector('[data-kotone-confirm-totals]')?.addEventListener('click', () => {
    loadout.equippedTotalsFor = `${loadout.weaponId || 'none'}+${loadout.enhancement || 0}`;
    saveAndRender();
  });
}
export function kotoneStatusMarkup(unit, party) {
  const owner = party.find(member => member.id === KOTONE_SHIOMI_ID);
  const k = owner?.kotone;
  if (!k) return '';
  const pb = (k.powerfulBonds[unit.id] || []).length;
  if (unit.id !== KOTONE_SHIOMI_ID) return unit.id === k.linkedId || pb ? `<div class="mechanic-chip kotone"><b>${unit.id === k.linkedId ? `ARCANA LINK · LUNAR ${k.lunarBond}/10` : 'POWERFUL BOND'}</b><em>POWERFUL BOND ${pb}/3</em></div>` : '';
  const linked = party.find(member => member.id === k.linkedId);
  return `<div class="mechanic-chip kotone"><b>${k.cold ? `COLD · ${k.cold} TURNS` : k.fortune ? `FORTUNE · ${k.fortuneActionsLeft} ACTIONS LEFT` : 'KOTONE READY'}</b><em>GO FOR BROKE ${k.goForBroke.limit - k.goForBroke.used}/${k.goForBroke.limit} · LINK ${esc(linked?.codename || 'NONE')}</em><em>LUNAR ${k.lunarBond}/10 · WEAPON +${k.weapon.enhancement}${k.weapon.grantAttack ? ` · ATK STACKS ${k.weaponStacks.length}/3` : ''}</em></div>`;
}
export function kotoneSkillSummary() {
  return `<section class="build-section character-skills"><h3>Ordinary Global tooltip snapshot</h3><div class="character-skill-grid">${[...kotoneShiomi.skills,kotoneShiomi.highlightSkill].map(skill => `<article><div><small>${skill.slot} · ${skill.cost} SP</small><b>${esc(skill.name)}</b><p>${esc(skill.note)}</p></div></article>`).join('')}</div><p class="formula-note">Skill level was not identified in the fallback tooltip. These are not asserted to be A6 Level 13 coefficients.</p></section>`;
}
