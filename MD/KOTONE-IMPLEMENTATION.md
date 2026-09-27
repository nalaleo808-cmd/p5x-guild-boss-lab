# Kotone Shiomi — playable experimental implementation

**Target:** the uploaded `v2.0.0-beta` runtime, not the newer 2.2.0 modular checkout. **Character ID:** `kotone-shiomi`. **Profile:** `global-ordinary-tooltip-2026-09-26`. There is no Sync Mindscape or Mindscape Core implementation.

This replaces the previous disabled draft with executable combat. It is **not a fully source-verified game replica**. The complete requested live Lufel JavaScript files, including their trailing overrides, could not be retrieved. A published Japanese/Global tooltip transcription supplies the fixed numerical snapshot. Where that evidence is incomplete, this implementation either exposes a hypothesis or blocks the unsupported selection. See `kotone-source-audit.json` and the on-screen warnings.

## Files and integration

- `src/characters/kotone-shiomi-data.js`: independent identity, ordinary coefficients, three skills, Highlight, awareness descriptions, weapon components and enhancement tables.
- `src/characters/kotone-shiomi-mechanics.js`: serializable combat state, Arcana Link, Lunar/Powerful Bond, Fortune, Cold, Go for Broke budget, provenance-aware copying, equipment accounting and recommendation policy.
- `src/characters/registry.js`: local editable registry and post-import character overlay.
- `src/characters/kotone-shiomi-ui.js`: normal build editor, equipment safeguards and combat resource displays.
- `src/combat/support-effects.js`, `support-actions.js`, `weapon-stats.js`: shared provenance, clocks, action and stat primitives.
- `src/combat/forced-theurgy.js`: automatic S.E.E.S. Theurgy adapter, described below.
- `config/character-integrations.json`: integration input kept outside generated/synced references.
- `src/engine.js`, `src/app.js`, `src/styles.css`: actual engine and application wiring, not catalog-only registration.

The character is selectable in Team. The Kotone tab provides a shortcut into the real Builds workflow. Her build is stored in the existing `p5x-loadouts-v3` store, not just the historical draft store. The regular action UI exposes link reselection and Go for Broke, and explains that S3 selects a **buff caster**, not its eventual recipient. Buff provenance is retained in battle state and copied effects. Resource and equipment transitions appear in the combat log.

### Import/regeneration workflow

The release archive does not contain the original `import-lufelnet.mjs` or live synchronizer mentioned in `package.json`. Those missing upstream scripts have **not** been fabricated. Instead, the engine and UI apply the editable registry **after** reading their input catalogs. Replacing/regenerating `src/generated/lufel-catalog.js` does not overwrite Kotone's modules. A newly imported `slug: kotone` record is replaced by the local `kotone-shiomi` entry; Montagne/Frostgale entries remain independent.

Run `npm run verify:characters` after an upstream catalog regeneration. `npm run build` also runs that check. It checks the integration manifest, module paths, identity uniqueness, ruleset and profile. It never rewrites the reference catalog. All existing `data/` files and the generated catalog remain byte-for-byte unchanged.

## Runtime behavior and explicit policies

At battle start the link selects the highest-Attack living Sweeper/Assassin ally. It can be reselected once at Kotone's normal-turn opening. Reselection resets Lunar Bond and moves A1's permanent Powerful Bond. The same already-linked ally cannot be selected to refresh resources for free. Go for Broke remains available after a genuine reselection. No reselection is allowed during Fortune or Cold.

Lunar Bond is capped at ten; qualifying skill casts add once, not once per damage hit, buff component or copied stat. Attack, pierce and critical-damage thresholds are evaluated dynamically. Powerful Bonds are capped at three. Temporary stacks have individual recipient-normal-turn clocks; at cap, the earliest-expiring temporary stack is replaced. A1's permanent stack survives while linked. Temporary stacks on the old recipient are allowed to expire normally after reselection. These boundary rules are explicit simulator policies, not independently observed game timing.

S1, S3 and S2's supported damage-taken effect scale with Kotone's current Attack, capped at 4684 for the fixed tooltip snapshot. S2 resolves three actual Fire packets with separate damage calculations and applies its eligible debuff after damage. Fortune's `292.8%` wording is interpreted as **+2.928 power per hit**, not a ×2.928 multiplier. That interpretation remains provisional. The ordinary profile uses **two** Down points, not a mixed regional value.

Go for Broke costs no SP, Highlight gauge or counted turn. It opens three chosen actions: one normal action followed by two extra actions. The engine completes the normal turn only after the two extra actions, then resolves the linked automatic ultimate and enters two normal turns of Cold. A1 adds the automatic own Highlight at activation. A6 provides a second complete use; a third use is unavailable. Cold blocks skills and paid Highlight. Its skips do not charge Highlight. Extra actions and automatic ultimates do not advance recipient-normal-turn durations or S3's two-normal-turn cooldown. Kotone's Concert extra-turn handling also leaves her normal counter, skill cooldown and Cold clock unchanged.

Normal recipient-turn clocks are explicit. A self-granted buff has same-casting-turn grace; a buff placed on a different recipient first ticks at that recipient's normal turn end. Automatic Highlights do not consume the normal-turn opening. Enemy debuffs use the existing engine's enemy/round clock. Existing non-Kotone legacy character clocks are not globally redefined.

### A6 and buff provenance

S3 inspects eligible buffs **already on the linked ally**, retaining the original caster of every supported application. The selected non-self, non-linked ally is the ordinary copy source. At A6, Wonder is an additional source when neither the selected target nor the linked ally is Wonder. Wonder does not become a new recipient. Source lists are deduplicated.

The original effect remains; the additional copy is a separate, refreshable effect. Identity includes original caster, skill and effect, avoiding same-name collisions. The same activation cannot copy one root twice, and later casts refresh the corresponding copy instead of stacking duplicate copies. Copies cannot copy other copies. Enemy debuffs, negative effects, permanent/unknown-duration effects, unknown origins, unsupported stats and unrecognized special-effect fields fail closed. The allowlist does not pretend to support arbitrary custom mechanics, shields or Skill Amplification copying.

Below A2, the fixed profile adds 30% of the eligible original effect. **A2's ratio is unresolved:** the default is the explicit `0.30 × 1.25 = 0.375` hypothesis. The build editor exposes the ratio for testing a different interpretation. Original-caster amplification is already present in the original value; Kotone amplification applies once to the additional copied value. Copied duration is 1 normal recipient turn, 2 during Fortune, or 3 during Fortune at A2+. These policies are represented directly in the stored copy metadata and tests.

### Automatic Highlight / Theurgy

The same executable Highlight skill is used without gauge, SP, normal-turn or Highlight-cooldown expenditure. Miku A4 and Yukari's applicable follow-up buff handling are included. Core beta characters with no explicit Highlight object use the **existing engine's generic 2.8-power Highlight fallback**; that is not a newly sourced claim about their in-game skills.

For the uploaded beta's Makoto, Yukari and Akihiko, the forced-only adapter executes Ardhanari, Cyclone Arrow and Lightning Spike rather than allowing the generic Theurgy blocker to swallow the action. It uses the supplied beta catalog's structured power/tooltip snapshot, including Makoto's four hits and Full Moon/On-Site Leader support, Yukari's associated effects and Akihiko's guaranteed-crit/resource handling. Theurgy is not charged or spent for this forced activation.

This does **not** add complete natural Theurgy gauge charging, manual Theurgy menus, Cadenza selection, or a newly verified full S.E.E.S. kit. An unknown descriptive-only special ultimate still emits a visible unsupported warning; it is not silently replaced with invented damage.

## Equipment accounting

The five-star weapon has seven explicit enhancement entries. The four-star weapon has verified fallback values only at **+0**; +1–+6 are `null`, disabled in the UI, and rejected by combat normalization. They are not interpolated or silently downgraded.

Four-star temporary Attack is driven by Kotone's own buff-grant casts. One cast counts once, even for multiple party targets, copied effects or buff components. S1, S3 and Highlight trigger it; a pure damaging S2 cast does not. Passive effects do not recursively trigger themselves. The cap is three, with individual three-normal-turn expiry and earliest-stack refresh. This cast-level trigger granularity remains a declared policy awaiting direct source confirmation.

The five-star Skill Amplification is conditioned on the Lunar threshold. Ally critical damage follows each recipient's current Powerful Bond stack count and expires/reduces with those stacks. The three published arrays are separate from the weapon's HP/Attack/Defense component stats.

For non-weapon inputs, the declared formula is:

```
permanent Attack = (non-weapon Attack + weapon component Attack)
                 × (1 + weapon static Attack)
                 × (1 + Revelation Attack)
```

Weapon component HP is added before the Revelation HP multiplier. Defense component is added once. Final-equipped mode adds none of those components or static bonuses again. A weapon/enhancement change requires new equipped totals and confirmation, or a switch to non-weapon inputs. Battle buffs remain dynamic and continue to affect support scaling. Default 2500 Attack / 3200 HP are **illustrative editable build inputs**, not verified natural level-80 stats.

## Verification and reproducible example

```
npm test
npm run verify:characters
npm run build
npm run example:kotone
```

`tests/kotone-runtime.test.mjs` exercises the actual engine dispatch, awareness gates, caster/recipient matrix, source provenance, copy rejection/refresh/expiry, both Go for Broke cycles and blocked third use, normal versus extra clocks, components versus equipped totals, all seven five-star levels, the four-star +0 runtime, rejection of its missing levels, saved-state normalization, forced Theurgy and public `simulate()` full/fast parity. Existing sampled release routes and reference hashes remain regression-tested.

The example uses seed 17 and the deliberately explicit high-HP trainer in `tests/helpers/kotone.js`, avoiding the release boss's HP floor. Two external 20% Attack buffs are synthetic **test inputs**, not asserted character coefficients. The output is written to `verification/kotone-battle-example.json`: A5 produces one eligible source copy and one Go for Broke cycle; A6 adds Wonder's copy and a second cycle. Both weapons change damage; all five-star enhancements are shown. Values are simulator fixture outputs, not predictions of live game damage.

Chromium exercised the **actual ES application modules**, battle engine and UI controls at desktop and mobile sizes. Local HTTP navigation returned `ERR_BLOCKED_BY_ADMINISTRATOR`, so the browser test embeds local assets and supplies an in-memory adapter for the real serialized storage strings. Native HTTP navigation and native persistent localStorage are not claimed verified. No browser policy was changed. Screenshots and exact checks are in `verification/kotone-playable-*`; the Python harness is provided for reproduction. The 724-square RGBA chibi from the previous checkpoint is reused, not regenerated in this update.

## Remaining source gaps

1. Complete live Lufel skill/ritual/weapon scripts and trailing overrides remain unavailable.
2. A3/A5 numerical skill-level increases are **not implemented**; the displayed tooltip coefficients are held fixed across awareness.
3. Four-star enhancements +1–+6 are unavailable.
4. A2 copy ratio, Fortune S2 power interpretation, copy/stack duration boundary rules and weapon trigger granularity are provisional and explicitly documented above.
5. Natural base stats and full manual/natural S.E.E.S. Theurgy support are outside this verified runtime subset.

A future source correction should change this local profile and its tests, never the read-only reference tree. The current implementation is useful for exercising Kotone's combat state machine and declared hypotheses; it must not be represented as a fully calibrated Global ruleset.
