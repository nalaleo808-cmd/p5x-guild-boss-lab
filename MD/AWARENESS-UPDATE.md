# A0–A6 roster settings — v2.2.0

## Use

Extract the complete ZIP into a folder. On Windows run `run-local.bat`; on macOS/Linux run `node serve.mjs`. Open `http://127.0.0.1:4173` in your browser. Node.js 18 or newer is required by this existing application.

Go to **Builds**, search or select a character, and press **A0–A6**. The full existing roster is available without changing your party. A compact selector also appears on each active party card and below the navigator. Settings auto-save to the existing `p5x-loadouts-v3` local-storage key, separately for every entry. Use the same browser and origin to retain local settings when moving to the new folder.

## What changed

- Added one canonical `loadouts[characterId].awareness` value to the editor and battle engine for all 26 existing entries: 23 combatants and 3 navigators.
- Added a searchable, scrollable full-roster build rail; compact, keyboard-focusable A0–A6 buttons; rank labels on party and navigator choices; and a navigator build editor.
- Preserved legacy Cosmic Yui awareness, weapon and refinement settings. The canonical rank takes priority, including A0; the old Cosmic alias is synchronized for compatibility.
- Rank-specific Level 80 source rows supply default stats. Hachiman source-scale encounters use the source values directly; archived-scale encounters retain their existing scale and apply the source's rank-to-baseline ratios. The default A6 values are unchanged.
- Opening Builds no longer silently turns displayed default stats into manual overrides. Blank fields show the automatic value as a placeholder. Entered values remain explicit overrides. Existing manual values survive old-preset migrations.
- Navigator profiles are passed separately from party loadouts. Direct engine callers can also key an imported navigator loadout by its original `sourceCharacterId`.
- J&C's account-wide A6 flag now follows her saved awareness even when she is off-party, rather than being forced on. Both recorded A6 presets explicitly restore the intended party and navigator ranks.
- Restored access to the existing recorded-team Sahimochi Persona by exposing the exact skill adapter that was already present in the UI; the source catalog is unchanged.
- New battle results include `awarenessProfiles`. A running engine owns a copy of its loadouts, so later edits cannot silently alter that battle's reset state.

## Modeling boundaries

This is a settings and integration update, not a claim that every character's full game kit has been implemented. Source-provided rank stats and already-coded awareness gates are applied. The imported skill coefficients remain unchanged; missing awareness effects, per-level skill scaling, and unverified A3/A5 upgrades are not inferred from names or generic multipliers. Cosmic Yui retains her explicit source-column setting independently of awareness.

The original built-in Wonder, Joker, Rin, Mona, and Okyann templates contain no A0–A6 source progression. Their selected rank is saved and passed to the engine, but unsupported progression is not invented. Their editor therefore labels this as **profile setting only**. Wonder's Persona system is unchanged.

Manual/equipped stat totals do not automatically change with awareness. Clear an override to use automatic source-backed defaults. Existing kit-coverage notices remain visible. No characters, portraits, or chibi assets were invented or replaced in this update.

## Verification

The Node suite covers all seven ranks for each combatant and navigator, legacy Cosmic migration, canonical A0 precedence, all 147 imported rank/stat combinations, actual lower-rank default stats, manual equipped values, J&C's A6 conditions, other modeled starting resources, results, deterministic repeatability, and source-data immutability.

Browser verification renders the actual application code offline and checks all 182 rank buttons, build search, migration, independent battle profiles, engine invalidation, recorded presets, and desktop/mobile layout. The environment blocks browser navigation; this check therefore uses an in-memory serialized-storage adapter, not a claim of a native browser-storage persistence test. No browser policy was changed. Application storage code remains ordinary `localStorage` in the distributed app.

See `verification/awareness-test-results.txt`, the browser results and file manifest in `verification/awareness-2026-09-12-checks.json`, and the desktop/mobile screenshots. The delivery ZIP is checked against a SHA-256 file manifest, re-extracted, tested, and rebuilt before delivery.

Run `npm test` and `npm run build` to repeat the dependency-free application checks. The optional offline browser test in `verification/verify-awareness-ui.py` requires Python, Pillow, Playwright, and Chromium; it does not change the installed application or real browser profiles.
