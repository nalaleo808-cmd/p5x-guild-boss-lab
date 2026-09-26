# P5X Guild Boss Lab - Showdown Battle Room

A dependency-free, browser-based Persona 5: The Phantom X guild boss simulator built around the interaction grammar of Pokémon Showdown.

## Run

No install needed on Windows: download `P5X-Guild-Boss-Lab.exe` from the latest GitHub release and double-click it. It starts the simulator and opens your browser; close its window to stop it. Windows SmartScreen may warn because the exe is unsigned: choose "More info", then "Run anyway".

From source, Node.js 18 or newer is required:

- Windows: double-click `launch-p5x.bat` (starts the server and opens the browser)
- macOS/Linux: run `./run-local.sh`
- Manual: run `npm start`

Open <http://127.0.0.1:4173>.

## Folder layout

- `index.html`, `manifest.webmanifest`, `src/`, `assets/`, `data/`: the app. `npm run build` copies these to `dist/`.
- `scripts/`: optimizers, replays, and the Lufel data importers.
- `tests/`: `node --test` suites.
- `docs/`: evidence reports, audits, and handoff notes. Start with [docs/README.md](docs/README.md).
- `outputs/`: script results. `outputs/validation/` holds release validation artifacts and `outputs/logs/` holds run logs.
- `vendor/`: pinned Lufel.net source snapshot used by the importer.

## Validate and build

```bash
npm test
npm run build
```

The static production copy is written to `dist/`.

`npm run build:exe` builds `dist-exe/P5X-Guild-Boss-Lab.exe`, a single file that embeds the app (the same files as `dist/`) into a copy of the running Node binary using Node's single executable application support (`scripts/build-exe.mjs`, entry point `scripts/sea-main.cjs`). It needs Node 20.12 or newer and fetches the `postject` build tool through npx on first run. Set `PORT` to change the port and `P5X_NO_BROWSER=1` to skip opening the browser.

## Kotone Shiomi (playable, experimental)

Open the **Kotone** tab and click **Use Kotone in party slot 2 & open Builds**, or select her in Team. Set awareness, weapon, enhancement and stat basis in Builds, then enter your actual stats (the defaults are illustrative). In battle, pick **Select / reselect Arcana Link** at her normal-turn opening, then **Go for Broke**.

She uses an ordinary Global tooltip snapshot: no Mindscape Core, A3/A5 skill-level increases are not applied, Ame-no-Nuboko +1 to +6 are disabled, and the A2 copy ratio is an editable 37.5% hypothesis. Recorded archive profiles reject her. Details: [docs/KOTONE-IMPLEMENTATION.md](docs/KOTONE-IMPLEMENTATION.md). Extra commands: `npm run verify:characters` and `npm run example:kotone`.

## Persona and Revelation data

The app ships with a normalized snapshot generated from the public English [Lufelnet character](https://lufel.net/en/character/) and [Persona](https://lufel.net/en/persona/) pages. The included catalog contains the 20 newest characters visible with **Show Spoilers** off, 57 featured Personas, 458 transferable Persona skills, 337 native/unique Persona skill records, 18 main Revelations, and 32 Revelation sub-sets.

- Open **Builds** to customize each character.
- Ichigo (BERRY) defaults to the user's September 5 character-detail screenshots: ATK 4,927, DEF 1,494, HP 8,634, SP 100, Speed 96, Crit Rate 54.2%, Crit Multiplier 235.5%, Pierce 7.5%, Damage Mult. + 55.9%, and Ailment Accuracy 3.1%. SP Recovery, Technical Precision, Down Points, Ailment Resistance, and Damage Down are all zero. These equipped totals include equipment bonuses; matching Revelation bonuses are not added twice. Older saved Ichigo builds receive this preset once, later edits persist, and Reset Build restores these values. Ailment chance rules remain unmodeled. Provenance and all 15 values are stored in `src/default-presets.js`.
- ANGE and MIKU are classified as navigators, selected from the independent Navigator slot rather than from the three teammate slots. Their sourced support actions resolve without consuming the current party action.
- Wonder has no Revelation slot. He can equip three Personas. Each Persona keeps its own unique skill and Thief Tactics, then has six slots for skills from the imported transferable catalog. Reference-only passive or unmodeled skills can be recorded in a loadout without being treated as executable battle actions.
- Each of Wonder’s teammates can choose a compatible main Revelation and sub-set.
- Team Preview lets you replace any of the three teammates and move all four party members left or right to set the battle turn order.
- The 20 recent imported characters use their English Lufelnet names, A6 Level 80 stats, Level 13 skill coefficients, Revelation recommendations, skill priority, passives, skills, Highlights, costs, targets, and source descriptions. Supported numerical effects execute directly; more complex bespoke mechanics remain visible in the full source description.
- Structured bonuses such as ATK, HP, damage, critical rate, elemental damage, and starting Highlight are applied by the battle engine.
- Mechanics that have not been converted safely remain visible as reference text and do not alter formulas.

To regenerate the catalog from a Lufelnet checkout:

```bash
npm run sync:lufel -- --source path/to/lufelnet
```

To refresh both the live non-spoiler character snapshot and the Persona skill catalog directly from Lufelnet:

```bash
npm run sync:lufel-live
```

The normalized JSON is written to `data/lufel-catalog.json`, and the browser module to `src/generated/lufel-catalog.js`.

## Battle workflow

1. Pick a guild boss and deterministic seed on Team Preview.
2. Enter the battle room.
3. Respond to one contextual action request for the current actor.
4. Select a target only when a move needs one.
5. The engine resolves the action, animates the state change, logs events, and advances the queue.
6. The `Actions` fraction is the current character's action budget. Wonder and other party members begin at `0/1`, and effects can increase that limit.
7. Wonder selects a Persona freely, then chooses a skill. Persona selection does not consume an Action.
8. Navigator actions and ready Highlights are interrupt actions. They resolve immediately without consuming the current Action.
9. Boss encounters can include individually targetable summons, Down-point gauges, weakness/critical Down rules, Gun ammo, and sourced buffs or debuffs.
10. AI Assist highlights a legal recommendation; Full Auto submits those actions through the same engine interface.
11. Results include score, contribution, Attack Turn history, rematch, and a step-by-step replay.

## Evidence profiles and recorded benchmarks

New battles and optimizer runs default to the `live-2026-09-04` mechanics profile. The `recorded-2026-08-29` profile is available only when it is selected explicitly for archive reproduction. This separation matters because corrected live timing and state rules can change a rotation and its score.

The Data view includes a benchmark from a 16:52 Slaughter Drive Nightmare recording captured on 2026-08-29. The final result proves this score formula:

```text
(base damage points + weakened damage points + boss attack points) x difficulty bonus
```

For the recorded run, `(827,135 + 909,555,392 + 250,000) x 4 = 3,642,530,108`. The archive regression preserves this result under `recorded-2026-08-29`. It does not prove that the corrected live profile reproduces the recording.

The same recording confirms that Fighter Salve grants 25% damage for 1 turn and that Catch a Wave is a free automatic Resonance follow up after an ally turn while Surf is active and SP is sufficient. Navigator cooldowns now advance by counted ally actions. Paddle Out enters or leaves Surf and does not deal the Catch a Wave damage itself.

MIKU's Feel the Beat and Clear Sound begin at cooldown 4 and share their post-use cooldown. Her normal songs cycle through Heaven, Spring Storm, and Play-With-Fire, granting Break, Critical, and Expert Tracks. Showstopper spends all three Tracks and inserts two complete Virtual Concert party turns. Those turns deal and record real damage without advancing the normal Action number, boss turn, Weakened turns, or support cooldowns. At A6, Neverending Song then deals fixed Almighty damage to each living target equal to that target's recorded Concert damage.

Vishnu is available as a video timing model. Crossing its configured HP gates expands the field from 1 to 3 to 5 Vishnus. New copies join the queue immediately before the threshold-crossing actor's next slot and are excluded from the attack that spawned them. Every Vishnu resolves an independent action, and an enemy status loses duration only after that specific enemy completes a real action. Weakened skips preserve enemy status durations and Down state. The recording confirms the sequence but not the exact HP gates, so the provisional 75% and 50% values are editable in Team Preview.

Slaughter Drive is available in Team Preview as an Electric weak, Level 78, 8 Attack Turn recorded benchmark with 209,244 HP. Its four Level 78 Scarlet Turrets each have 154,474 HP. Soul Link keeps all five targets at the same proportional HP percentage when any linked target takes damage.

In Nexus of Dreams, Life Sustainment is forced on and stops every linked target at 1 HP. Credited pre-break damage stops at that floor, then a free `BREAK HP LOCK` action appears at each Attack Turn boundary. The player chooses when to break, Surf remains available, and the break grants exactly 2 complete Weakened Attack Turns even when triggered late. The result screen uses the recorded Base, Weakened, Boss Attack, and Difficulty buckets. The Nexus benchmark multiplier is calibrated to the recording and is not presented as a hidden game constant.

In Devourer of Dreams, Life Sustainment is a free player-turn toggle that is disabled during Full Auto. While on, every linked target stops at 1 HP. With it off, linked HP can reach 0 and all five enemies remain targetable as infinite-HP Weakened targets. Damage earns 3x points for exactly 2 boss turns, including the complete window after a late trigger.

Multidimensional Dreamscape is an evidence-bounded damage preview against Level 82 Hachiman. It runs six configured party rounds and includes the observed `Attack Turns Left 0` round before ending with `preview_complete`. Its result reports simulated damage only. The live observation separately establishes `(258,098,432 Foe Defense Points + 125,000 Turns Survived Bonus) x 8 = 2,065,787,456` with 6 turns survived. The simulator does not calculate hypothetical Foe Defense Points or a hypothetical game score because their accumulation rules, survival-bonus derivation, and actual end trigger remain unknown.

With Hachiman selected on Team Preview, `LOAD HACHIMAN RECORDED TEAM` installs the recorded Multidimensional Dreamscape party (J&C, Wonder, Beachflower Marian, borrowed Berry, MIKU) with the observed maximum HP totals, sourced-cap lower bounds, Revelation set effects and tooltip-bridged Persona skills from `src/hachiman-recorded-team.js`. `REPLAY RECORDED ROUTE` then plays the 64 recorded T1 to T8 actions and opens a results screen that derives the projected score per normal turn. The same module drives `node scripts/compare-hachiman-opening.mjs all --seed=8`; see [HACHIMAN-STAT-EVIDENCE-2026-09-06.md](docs/HACHIMAN-STAT-EVIDENCE-2026-09-06.md) for the evidence and the remaining gaps.

Run the Miyu regression benchmark with:

```bash
node scripts/benchmark-slaughter.mjs
```

The seeded archive regression, including MIKU's Virtual Concert and A6 echo, scores exactly 3,642,530,108 when run with `recorded-2026-08-29`. Catch a Wave fires 8 times across the five linked enemies for 8,636,830 simulated damage in that archive run, and disabling it lowers the archive score to 3,433,259,816. Jellyfish Splash restores SP using Miyu's SP Recovery, can bank SP above her normal maximum up to twice normal maximum SP, and keeps the recorded Surf chain active.

The browser's `LOAD RECORDED TEAM` preset uses A6 Miyu in Surf, A6 MIKU with the recorded song sequence, and the J&C Mischief plus Service mask pair. Full Auto breaks on turn 7 and runs Virtual Concert inside the 2-turn Weakened window.

The prior 28,743-candidate optimization is preserved in [OPTIMIZED-ROTATION-A6-AUDIT-2026-08-29.md](docs/OPTIMIZED-ROTATION-A6-AUDIT-2026-08-29.md). The September 4 search is also retained as historical output in `data/optimizer-slaughter-2026-09-04-archive.json`. Neither artifact is a current live-profile optimum.

J&C selects exactly two masks before battle and the pair stays locked for the fight. The selected masks become active S1 and S2. Both are available for the first choice, then each mask requires the opposite slot next. Two Masks as One is automatic at A1 when both Facades are ready. The live profile tracks an independent Highlight clock for each selected mask. MIKU's A1 resets those clocks. Its same-owner-turn cooldown grace remains provisional. At A6, J&C starts with one True Desire stack, gains 20 Desire Level, and gains another stack every 8 J&C turns. The Alt stores the enhancement irreversibly for the next eligible Two Masks as One rather than acting as a reversible ON/OFF switch. Exact stack consumption and automatic hit distribution remain under review.

Beachflower Marian's Gentle Sea Breeze follows the observed owner-turn cadence: cast, cooldown 2 on Marian's next turn, cooldown 1 on the following turn, then ready on the fourth Marian turn. Virtual Concert Marian turns count for this clock. At A6 it grants two Midsummer Prescription uses, and Flower Basket Pharmacy permits one free medicine use on each Marian turn. The current live profile uses the sourced one-turn medicine bases of 30% Attack, 45% Defense, 25% damage, and 10% continuous damage; A0 extends applied duration to two turns, A6 extends it to three, and A1 increases magnitude by 20%. The source of an observed 1.58 magnitude multiplier is still unknown and is not added to the formulas.

BERRY has dedicated tests for direct skills, Chains of Love, Lovesick stacks, S1 and S3 conditional damage, DOUBLE BERRY thresholds and repeats, the one-time free Alt, Highlight triggers, fatal survival, Auto legality, and replay determinism. The default imported source does not provide the Lovesick continuous-damage coefficient or duration, so the engine records that limitation and adds no invented DoT damage. An explicit external DoT definition can be supplied for isolated testing.

[PROJECT-COMPLETION-STATUS-2026-09-05.md](docs/PROJECT-COMPLETION-STATUS-2026-09-05.md) lists runtime coverage and remaining stateful systems for every imported character. BERRY, Miyu, Marian, MIKU, and J&C have substantial dedicated state-machine coverage, but none is claimed as full-kit complete. The other 15 imported kits remain partial generic implementations. Assist and Theurgy actions are disabled because their insertion timing, gauge rules, and clocks are not implemented.

The live and replay battle logs are reverse chronological: the latest event is at the top and the first event remains at the bottom.

## Optimizer status

The September 4, 2026 result of **37,425,059,184** is historical and stored in `data/optimizer-slaughter-2026-09-04-archive.json`. It predates the current live mechanics and must not be cited as the current best score.

The current `live-2026-09-04` search evaluated 29,119 candidates and found a best searched score of **20,757,143,632** at battle seed 808. The current Full Auto baseline is **4,699,599,848**. Baseline and optimized fast/full replays match in the saved artifact. This is a best searched result, not a guaranteed global optimum or a verified live-game score. The final suite passed 98 tests, browser QA passed, and the main project was synchronized with verified hashes. See [VALIDATION-2026-09-05.md](docs/VALIDATION-2026-09-05.md).

- [Historical September 4 result and rotation](docs/OPTIMIZER-RESULT-2026-09-04.md)
- [Historical September 4 search artifact](data/optimizer-slaughter-2026-09-04-archive.json)
- [Current September 5 result and limitations](docs/OPTIMIZER-RESULT-2026-09-05.md)
- [Current reproducible search artifact](data/optimizer-slaughter-latest.json)
- [Handoff verification and evidence gaps](docs/HANDOFF-VERIFICATION-2026-09-04.md)

```bash
node scripts/optimize-slaughter.mjs --generations 45 --population 700 --elite 45 --refine-passes 3 --search-seed 20260829 --battle-seed 808 --mechanics-profile live-2026-09-04 --output data/optimizer-slaughter-latest.json
node scripts/optimize-slaughter.mjs --replay data/optimizer-slaughter-latest.json
```

The search resets its random-number generator on each call. The current artifact records `live-2026-09-04`, the search limits and seeds, the complete executed rotation, and matching fast and full replay scores.

## Architecture

- `src/engine.js`: deterministic state transition engine and agent interface
- `src/data.js`: structured roster, fallback Personas, navigator, and bosses
- `src/generated/lufel-catalog.js`: generated Persona skill and Revelation catalog
- `src/app.js`: setup, build workshop, battle room, contextual controls, optimizer, import, results, and replay views
- `src/styles.css`: responsive Showdown-style field/log/action-room presentation
- `tests/`: determinism, action progression, Persona switching, navigator timing, imported data, Revelation application, validation, and turn-limit coverage

The Data view also accepts a normalized `simulator-dataset.json`. Natural-language imported descriptions are kept separate from executable formulas until validated.

This is a simulation environment and does not control or automate the live P5X client.
