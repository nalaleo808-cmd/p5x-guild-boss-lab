# Cosmic Yui update — 12 September 2026

## Open the updated simulator

Extract the ZIP. On Windows, run `run-local.bat`; open the local address printed in the console. Alternatively run `npm start` in this folder. The existing local server defaults to port 4173. No npm install is needed: this project has no runtime packages to install.

In **Team**, select any teammate slot and choose **Cosmic Yui**. In **Builds**, select Cosmic Yui to choose awareness, the coefficient column, weapon passives and refinement. Existing saved teams are not replaced automatically. Start a new battle after changing a build. The ordinary roster and the original 20 imported character records are retained.

Default Cosmic setup: A6, fourth source coefficient column, no weapon passive. These are simulator configuration defaults, not a claim about your account. Enter your equipped stats for a meaningful comparison with Berry; the imported normalized stats are not your measured equipment totals.

## What changed

- Added Cosmic Yui to the catalog, teammate picker, build editor, combat UI, state snapshots and normal/fast simulation paths.
- Added a dedicated, isolated character module rather than generic attack/buff approximations for her main kit.
- Added source-modeled A0–A6 behavior: ordered/capped Veggie Knights; seven-point energy; free, owner-turn-limited S2; Harvest Fest and Harvest Havoc; manual and automatic multi-hit Veg-Out; protected seed potato; color effects; A6 ally-action follow-ups; Highlight and A4 bonus.
- Classified Veg-Out as All-Out damage separately from ordinary skill damage and Resonance. Shared 1More-Up (which also names All-Out damage) applies; unrelated ordinary-skill and Resonance bonuses are not silently substituted.
- Added signature and four-star weapon passive options R0–R6. Equipment HP/Attack/Defense components are not silently added to manual stat inputs. The static-passive checkbox prevents counting a static weapon passive twice.
- Added original transparent chibi fan artwork, a portrait, four color variants, editable SVG originals, and four Veggie Knight SVG/PNG assets. The packaged assets depict teal-haired Cosmic Yui; unrelated generated UI mockups are not included.
- Added source-change validation: a future refresh that changes one of the pinned core coefficient arrays fails with a review-needed error instead of mixing new descriptions with old formulas.
- Updated `npm test` to `node --test`. The uploaded script used `--test-isolation=none`, which the available Node runtime did not accept.
- Replaced stale hard-coded UI coverage counts with per-character coverage notices. Existing dedicated kits remain described as partial/source-modeled, not fully validated.

## Source and versioning

Requested character page: https://lufel.net/en/character/bui-cosmic/

The character page is client-rendered. Numeric mechanics were checked against the current upstream `absolroot/lufelnet` files under `data/characters/YUI·스텔라/`. The uploaded vendor fork uses older Prism/Smash/Mobilize names and several superseded coefficients. The new snapshot is `data/cosmic-yui-source-2026-09-12.json`; exact file hashes and the retrieval date are included there and in `src/cosmic-yui-data.js`.

Core fourth-column coefficients in the checked snapshot:

| Effect | Coefficient / value |
| --- | ---: |
| Harvest Fest | 140.6% Attack |
| Harvest Havoc | 108.8% Attack |
| Free S2 Attack / critical rate | 34.1% / 13.6% |
| Veg-Out base hit | 151.5% Attack |
| Each existing knight | +34.1% Attack as a separate hit |
| Each spent regular potato | +28.4% Attack as a separate hit |
| Highlight | 511.2% Attack |
| Potato Power | +17.0% All-Out damage; A2 adds 10 percentage points |
| Shroom Spores | +22.7% damage taken |
| Havoc Asparagus heal | 1,136 HP |

All four source coefficient columns are retained and selectable. The original app associates the fourth column with its A6/level-13 setup; this new editor shows source-column labels explicitly and does not add another inferred awareness-level multiplier.

## Boundaries that still require a live recording

This is a source-based implementation, not a calibrated prediction of live game scores. The original simulator already has provisional score, timing, damage-category and generic-character rules.

The source does not specify the extra coefficient for Cosmic Yui's contribution to the shared party All-Out Attack. That extra coefficient is not invented. Brainwash chance/accuracy/control interactions are likewise excluded and disclosed.

The implemented boundary choices are visible in the build editor and battle limitations: skip capped knight types in source order; treat A2's protected seed as additional to the regular four-potato cap; resolve A1's maximum-energy attack after battle-start passives; apply skill-driven color changes before end-action Havoc; allow one free lower-awareness color choice before the normal action; check energy at cast boundaries; cap the Asparagus self-heal per cast; and retain the four-star conditional Veg-Out Attack effect for two owner turns following Resonance. These details require live confirmation.

Automatic Veg-Out freezes the living target list at cast start and splits each coefficient evenly before per-target defense, affinity and critical resolution. Its exact in-game split/critical rounding needs confirmation. Highlight currently triggers one Havoc on its original target; additional unspecified Highlight-specific rules are not invented. These limitations matter when comparing absolute damage with Berry.

## Review and verification

The untouched uploaded code passed 183 existing tests when invoked with supported Node flags. The updated catalog contains 21 imported characters, and the original first 20 character records compare exactly equal to the original archive.

The updated suite has **231 passing tests**, including **48 Cosmic-specific tests**, with zero failed/skipped tests. Coverage includes source arrays, source-drift rejection, free-action/cooldown behavior, knight and energy caps, protected potatoes, split damage, category bonuses, awareness/color gates, weapons, healing, owner clocks, Highlight, Concert counted-action behavior, deterministic replays, fast-mode equivalence, and event/actor/total-damage reconciliation. The test log and machine-readable report are in `verification/`.

The app was exercised in Chromium at 1440×1100 and 390×844: select Cosmic Yui, edit/persist A6/R6 signature options, enter battle, advance to her turn, use S2 without spending the normal action, inspect its cooldown, and verify images. No JavaScript errors or broken images were found in that harness. Container Chromium policy blocks ordinary URL navigation, so the browser check used real local modules with network URLs mapped to in-memory Blob/data URLs, plus in-memory storage/fetch. It is a UI smoke test, not a claim that a separately deployed production server was tested. The local server's HTTP files are checked separately by the packaging verification.

The existing optimizer's saved benchmark results were not regenerated or advertised as Cosmic Yui-optimal. The runtime recommendation supports her free S2 and normal skill choice; the existing recorded benchmark remains its original team.

## Important implementation files

- `src/cosmic-yui-data.js`: pinned coefficients, awareness/weapon reference, normalization checks.
- `src/cosmic-yui-mechanics.js`: dedicated state and action hooks.
- `src/engine.js`: integration with damage, score, action clocks and replay state.
- `src/app.js` / `src/styles.css`: roster/build/battle controls and indicators.
- `tests/cosmic-yui.test.mjs`: 48 character-specific checks.
- `assets/characters/cosmic-yui/`: editable SVGs, knight assets and manifest.
- `scripts/render-cosmic-assets.py`: optional reproducible vector/raster renderer; requires Pillow and CairoSVG only when regenerating artwork.

`npm run build` refreshes the included `dist/` static build. `npm run sync:lufel` rebuilds the catalog from the local source snapshot; source drift fails closed for the new adapter. Runtime weapon/awareness mechanics remain explicitly pinned to the reviewed snapshot until reviewed and updated together.
