import { kotoneShiomi, missingKotoneSource } from './characters/kotone-shiomi-data.js';
const esc = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderKotonePreview(root, header, bindCommon, useKotone = () => {}) {
  root.innerHTML = `${header}<main class="kotone-screen page-enter"><section class="kotone-heading"><div><span class="eyebrow">PERSONA 3 PORTABLE · SEPARATE CHARACTER ID</span><h1>Kotone Shiomi</h1><p>Playable character module, with an explicitly experimental tooltip profile.</p></div><span class="kotone-ruleset">GLOBAL ORDINARY ONLY<br><small>No Sync Mindscape or Mindscape Core</small></span></section>
  <div class="kotone-layout"><section class="kotone-art-panel"><div class="kotone-art"><img src="${kotoneShiomi.artwork}" alt="Kotone Shiomi chibi, full body and naginata" width="724" height="724"></div><p>724 × 724 transparent RGBA · 674 × 674 safe content area</p></section>
  <section class="kotone-build-panel"><h2>Combat is connected</h2><p>Arcana Link and its selection, Lunar and Powerful Bonds, three skills, Highlight, two Fortune extra actions, Cold, A6 Wonder-origin copying, and weapon effects now execute in battle.</p><p>Configure A0–A6, weapon, enhancement and stat basis in <b>Builds</b>. The regular roster and saved-loadout workflow are used; this page is no longer a separate draft editor.</p><button class="kotone-play" data-use-kotone>Use Kotone in party slot 2 &amp; open Builds</button><div class="kotone-warning"><b>EXPERIMENTAL DATA, NOT A VERIFIED GAME REPLICA</b>${missingKotoneSource.map(text=>`<p>${esc(text)}</p>`).join('')}</div></section></div></main>`;
  bindCommon();
  root.querySelector('[data-use-kotone]').addEventListener('click', useKotone);
}
