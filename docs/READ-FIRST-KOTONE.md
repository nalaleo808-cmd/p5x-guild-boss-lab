# Kotone Shiomi — playable experimental update

This package adds executable character data and mechanics, not just the previous disabled draft. It targets **v2.0.0-beta only**. It is **not compatible with the newer 2.2.0 modular checkout**.

## Safest installation: full project

Extract `P5X-Kotone-Playable-Experimental-v2.zip` into:

    %USERPROFILE%\Documents\ChatGPT\

It creates a separate folder:

    p5x-simulator-kotone-playable\

Your existing `p5x-simulator` remains untouched. Use your usual local hosting method. The full package includes the rebuilt `dist/` tree. Directly opening an ES-module `index.html` as a local file is not a supported hosting method; this update does not include a new Windows executable.

## Changed-files patch

For the uploaded **v2.0.0-beta** release or the previous **v2.0.0 Kotone partial checkpoint**, back up the checkout, then merge the CONTENTS of `P5X-Kotone-Playable-Patch-v2.zip` into the project root — the directory containing `package.json`, `src/` and `assets/`.

There is no extra wrapper folder in the patch. Merge directories; do not replace/delete whole directories. The patch contains source, assets, tests and documentation, **not `dist/`**. Use the full package's entire built `dist/` directory for a static deployment, or run `npm run build` in a Node development environment.

Main module destinations:

    src\characters\kotone-shiomi-data.js
    src\characters\kotone-shiomi-mechanics.js
    src\characters\kotone-shiomi-ui.js
    src\characters\registry.js

Required shared integration:

    src\combat\support-effects.js
    src\combat\support-actions.js
    src\combat\weapon-stats.js
    src\combat\forced-theurgy.js
    src\engine.js
    src\app.js
    src\styles.css
    src\kotone-preview.js
    config\character-integrations.json
    scripts\verify-character-integrations.mjs

**Copying just the two character modules is not enough.** Apply the complete patch so the engine hooks, registry and helpers match. `KOTONE-PATCH-MANIFEST.json` lists exact new/replacement paths and hashes for both accepted bases. Do not merge over other local edits without comparing them. No files go in `sources/`; existing data and generated reference catalogs are unchanged.

## Use

Open the Kotone tab and click **Use Kotone in party slot 2 & open Builds**, or select her in Team. Set awareness, weapon and enhancement in Builds. Choose whether Attack/HP/Defense are non-weapon inputs or already-equipped totals. Enter your actual stats — defaults are illustrative.

In battle, use **Select / reselect Arcana Link** at her normal-turn opening, then **Go for Broke**. S3 selects an original buff caster; the linked ally receives copies. Resources and Cold are visible in the cards/log.

## Important limitations

This is an **experimental ordinary Global tooltip snapshot**. No Mindscape Core or Sync Mindscape is present. The complete live Lufel scripts remain unverified. A3/A5 numeric skill-level increases are not applied. Ame-no-Nuboko +1–+6 are disabled; +0 works. Vetri Vel Muruga +0–+6 works under the documented profile. The A2 copy ratio defaults to an explicit, editable 37.5% hypothesis. See `docs/KOTONE-IMPLEMENTATION.md` for all source and timing qualifications.

## Commands

    npm test
    npm run verify:characters
    npm run build
    npm run example:kotone

Test/build results, reproducible battle output, reference-preservation hashes and browser-harness screenshots are under `verification/`. Old `KOTONE-CHECKPOINT.md` and earlier fixture reports are historical; the current report is `KOTONE-IMPLEMENTATION.md`.
