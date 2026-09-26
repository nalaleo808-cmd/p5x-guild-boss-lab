# Kotone Shiomi — partial engineering checkpoint

**Not a completed character implementation. Kotone is not playable in this package.**

Target: the uploaded `p5x-guild-boss-lab-v2.0.0-beta.zip` runtime release.
Date: 2026-09-26. Ruleset: Global ordinary only. Mindscape Core and Sync Mindscape are not implemented.

## Why this is a checkpoint

The supplied beta is an older monolithic runtime release, not the newer modular 2.2 source tree in the earlier partial upload. It contains the application and catalog but no original `scripts/` or `tests/`. `AGENTS.md` and the chibi-style manifest were inspected from the earlier upload; the working copy is separate from both extracted inputs.

The live Lufel page could be read only as an unhydrated page shell. The complete Kotone `skill.js`, `ritual.js` and `weapon.js` could not be retrieved. Neither uploaded project contains Kotone's source records. Consequently no current ordinary coefficients, trailing overrides, exact weapon arrays, copy multiplier, A6 selection rule or weapon component stats have been verified. No cached English, Reddit numbers or Sync Mindscape values have been substituted.

The missing sources are not the only remaining work: the full character state machine, source-driven weapon profiles, original importer integration, battle/loadout/optimizer integration and Global battle validations still need implementation once the data can be verified. Attaching source scripts will not automatically enable the current draft.

## Implemented and tested here

| Area | Actual scope |
|---|---|
| Identity | Separate `kotone-shiomi` id and module, not an alias for Montagne. Direct engine selection fails with an explicit missing-data error. |
| Draft UI | Dedicated Kotone draft screen; A0–A6, both named weapons, +0…+6, no weapon and base/equipped basis persist under a separate storage key. It does not feed a battle or optimizer. A disabled roster entry links the identity conceptually to the draft. |
| Direct buff provenance | Generic `skill.buff` and `selectedAllyBuff` record original caster, skill, cast, recipient and effect instance. Nested casts restore their source context. Same-name skills from distinct casters do not overwrite each other. Uninstrumented legacy special/passive effects remain unknown and cannot be copied. This is not a completed audit of every character's effect path. |
| Guarded copy API | Accepts an **explicit** source list and copy policy. A caller can supply Wonder as a source without making him the recipient. Rejects unsupported/special/negative/permanent/expired/unknown-source effects, enemy-held effects, recursive copies and duplicate activation copies. Uses the live registered ally buff rather than a forged external value. Copy amounts are resolved once. A6's actual source-selection eligibility, A2 and Fortune rules are not supplied. |
| Explicit copy clocks | Copy policies specify recipient- or caster-normal-turn-end clocks. These avoid the legacy round tick. Extra actions/interrupts do not count as normal turns. These are infrastructure policies, not verified Kotone durations. |
| Extra-action API | Separate serializable queue and idempotency keys; executable synthetic skills, Highlights and Theurgy resolve through the engine without consuming the normal turn, gauge or cooldown. Only explicitly implemented `supportExecutable` skills qualify. Missing real Theurgy definitions fail visibly; no actual P3 Theurgy kit was invented or silently substituted. |
| Go for Broke use limit | Standalone counter: one use at A0–A5; two at A6; duplicate activation and third-use rejection. These counts come from the user's specification. It does not implement Go for Broke's real activation, phases, Cold or automatic actions. |
| Weapon-stat accounting | Separate component Attack, static passive, temporary modifiers and equipped totals. Repeated equipment evaluation recomputes from base; mismatched equipped totals reject a weapon switch. Engine helper updates Attack and mechanicAttack together. Seven-entry validation and grant-stack policies are tested with **synthetic tables only**. |
| Assets | Earlier full-body generated art normalized into lossless RGBA WebP assets, both 724×724, alpha bounds within the centered 674×674 safe area. Both portrait and battle-preview roles use the same full-body composition. The earlier cropped upper-body image is not represented as an unclipped full-body asset. |
| Build/test workflow | New dependency-free static builder and portable non-zero-test discovery runner. These replace absent functionality; they are not recovered copies of upstream scripts. |

## Not implemented

All of Kotone's actual skills, passives and Highlight; complete A0–A6 effects; Arcana Link selection/reselection; Lunar Bond; Powerful Bond; Fortune; Cold; full Go for Broke lifecycle and automatic activations; source-correct A6 eligibility/copy rate/A2 interactions; both weapons' exact published arrays and real triggers; complete base/component stat audit; original catalog-import regeneration; playable build/roster/actions/optimizer integration; and an actual sourced Kotone battle example.

The named weapon controls are draft settings, not combat weapons. The generic extra-action and copy APIs are not connected to a playable Kotone module. Do not interpret the test count as a completed Global combat validation.

## Verification

`npm test`: **79 passing tests, 0 failing, 0 skipped** in Node v22.16.0. These are newly added tests, not the missing upstream suite.

The test groups include direct engine provenance/copy/clock behavior, queue/cost/gauge boundaries, use-count gates, synthetic equipment models across seven enhancement indices, draft serialization, asset hashes, and 18 untouched-release route comparisons. Each release comparison covers 16 recommended actions (or the earlier encounter end), and checks both full and fast modes for Slaughter Drive, Vishnu and Hachiman, seeds 17/808/2026, live and recorded profiles. This is sampled regression coverage, not proof of all legacy mechanics.

`npm run build`: **passed**, with static output in `dist/`. `npm run build:exe` and the original Lufel sync/import commands are not validated or repaired; their upstream scripts are absent from the input archive.

`npm run example:kotone-foundation`: produces `verification/foundation-example.txt`. Every numeric combat policy in it is a clearly labeled synthetic fixture. It demonstrates actual engine damage changes and timing, not Kotone's published weapons or A6 combat output.

### UI verification limitation

Chromium blocked navigation even to localhost with `ERR_BLOCKED_BY_ADMINISTRATOR`. No browser policy was changed. The complete running application, native HTTP-origin storage, roster clicks and live battle screen were **not** browser-verified.

Instead, an offline harness renders the actual new draft modules and application CSS, with identical asset bytes embedded and an explicitly mocked in-memory storage interface. Inspected at 1365×1000 desktop and 390×844 mobile; local artwork renders at 724 natural resolution, 56 px roster-preview and 118 px battle-preview sizes. Draft controls, re-render restoration, source gate and mobile overflow checks pass without page errors. See `verification/ui-checks.json`. The screenshots are this offline draft harness, not a live Kotone battle.

`verification/offline-preview.html` may be opened directly to inspect the UI fixture without Node. It is not the simulator and its mock storage does not persist across closing the page.

## Asset provenance

Makoto and Yukari artwork and the shared chibi manifest from the earlier upload were visually inspected. This checkpoint normalizes the Kotone artwork generated earlier in the conversation; it does not claim a new generation using those references. Live Lufel artwork was unavailable, so direct identity-reference verification against that live asset is still pending. See `assets/characters/kotone-shiomi-asset-manifest.json` for hashes and exact alpha bounds.

## Source and input preservation

The original archives and extracted inputs were not edited. Existing `data/` and `src/generated/lufel-catalog.js` are byte-for-byte preserved. No `sources/` directory was present in this runtime release; none was created or modified. The shared chibi manifest from the earlier input was not overwritten; the new asset manifest is additive. `AGENTS.md` in the complete checkpoint is an unmodified copy of the earlier supplied instructions, and is not included as a replacement in the patch.

The original catalog importer is absent, so its real regeneration workflow remains unverified. The draft uses its own module outside the generated catalog rather than pretending to be a generated, executable character record.
