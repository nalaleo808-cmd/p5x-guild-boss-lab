# Handoff verification, September 4, 2026

The existing handoff was checked against the local source, tests, benchmark, and browser. No combat coefficients or score calibration were changed in this continuation.

## Verified baselines

| Check | Observed result |
| --- | --- |
| Existing tests before changes | 58 passed |
| Recorded Nexus score | 3,642,530,108 |
| Recorded score buckets | (827,135 + 909,555,392 + 250,000) x 4 |
| Recorded Weakened simulated damage | 247,778,121 |
| Catch a Wave damage events | 40 across five linked targets |
| Catch a Wave simulated damage | 8,636,830 |
| Recorded score with Catch a Wave disabled | 3,433,259,816 |
| Full Auto baseline at battle seed 808 | 8,734,831,636, including a live browser run |

The original 58-test suite also verifies Nexus and Devourer HP-lock behavior, late battle-limit Weakened windows, True Desire, Marian's resources and skill cooldown, MIKU's Concert, and replay determinism.

## Optimizer changes

The optimizer now resets its search random-number generator for each call, separates battle and search seeds, starts from the current Full Auto policy, searches medicine choices and targets by Attack Turn, searches J&C's opening mask and True Desire use timing, and preserves the selected Highlight skill through both execution paths.

Saved artifacts include the search limits, candidates, action trace, Concert context, free actions, and exact fast/full score replay checks. Five dedicated regressions cover repeated-search determinism, the current baseline, replay context and score parity, delayed True Desire, and opening-mask/medicine plans. A custom battle-seed replay also preserves its seed when replayed again.

The Optimizer screen displays the saved rotation search separately from an optional comparison of the same local policy at different seeds. It identifies the fixed search team and seed, shows the searched rotation, and offers a JSON download. Attack Tablet and Defender Tonic have visible assumption labels.

## Source evidence and open mechanics

| Mechanic | What is established | What remains unresolved |
| --- | --- | --- |
| J&C selected-mask Highlights | The raw snapshot at `data/lufel-live-recent.json` contains a cooldown value of 4 and says the selected Highlights have independent cooldowns. The importer preserves that value. | The cooldown clock and behavior during Virtual Concert are not specified. The engine currently does not enforce those cooldowns. Search scores are conditional on that limitation. |
| Marian Attack Tablet | The engine currently applies 30% Attack for two turns. | The number and duration remain simulator assumptions. |
| Marian Defender Tonic | The engine currently applies 45% Defense for two turns. | The number and duration remain simulator assumptions. |
| Marian Fighter Salve | The user handoff and existing recording notes identify 25% damage for one turn as recording-confirmed. | No new direct video verification was completed in this audit. |
| Nexus break timing | The engine currently permits the free break at the start of a party round, after the HP floor is reached. It preserves two full Weakened rounds after a late battle-limit break. | A break during a partially completed party round is not supported. Existing late-trigger tests concern the last Attack Turn, not a late actor in a round. Clarify that distinction before changing the timing. |
| Slaughter Drive/turret immunities | The user supplied screenshots establish instant-kill and spiritual/control immunity in game. | Enemy ailment filtering and an instant-kill resolution system are not implemented. Miyu's Surf immunity is a separate implemented mechanic. |

The highest-value live check is to use one J&C mask's Highlight and observe both counters after each ally action, each J&C turn, each boss turn, and through Virtual Concert. Marian's two unconfirmed medicine tooltips are the next evidence target.

## Recording comparison limits

The supplied video is https://www.youtube.com/watch?v=g_HzxBksa3M. Direct retrieval did not succeed in this continuation. No claim of newly watching it or locating frame timestamps is made.

The local source identifies a 16:52 Steam recording captured on August 29, 2026. `scripts/benchmark-slaughter.mjs` contains the currently replayed recording policy, including navigator calls on Attack Turns 2, 3, 4, and 7. Those are simulator policy anchors, not independently re-observed video timestamps. The older optimized-rotation document is an archive and is not recording proof for the new search.

## Browser checks

The original battle interface was verified at http://127.0.0.1:4173/:

- Five linked enemies with the supplied HP values, A6 Surf at battle start, and MIKU's opening CD 4.
- Separate STATS and FX controls, all eight stat fields, and the stats bottom sheet at 390px width.
- Marian at 0/2 EMPTY, two stored prescription charges after S3, next-turn CD 1, all eight medicines, and 1/2 USED with the medicine selector hidden after one use.
- Both opening J&C masks enabled; True Desire changed `aria-pressed` from false to true while Action remained 0/1.
- Full Auto result 8,734,831,636 and access to battle replay. Battle log entries remain newest first.

Remaining systems and the character-by-character audit stay tracked in `MECHANICS-AUDIT-2026-08-29.md`. The full search result and reproduction commands are documented separately in `OPTIMIZER-RESULT-2026-09-04.md`.

## Superseding status, September 5, 2026

Everything above this heading is preserved as a historical September 4 verification record. Several statements describe the engine and optimizer as they existed during that check and are superseded by the current status below.

### Mechanics profiles

- `live-2026-09-04` is the default for new battles and optimizer runs.
- `recorded-2026-08-29` is an explicit archive profile for reproducing the recorded Slaughter Drive regression. The dedicated recording benchmark constructs that archive profile intentionally.
- The exact 3,642,530,108 Nexus result remains protected by the archive regression. That result is evidence for the recorded score composition and archive profile, not proof that corrected live mechanics reproduce the recording.

### Corrected live mechanics

- J&C now has independent selected-mask Highlight clocks. MIKU A1 resets them. The stored True Desire Alt is irreversible after selection and enhances the next eligible automatic Two Masks as One. Same-owner-turn cooldown grace is still provisional, and the exact enhanced stack consumption and hit sequence remain unresolved.
- Marian's Gentle Sea Breeze uses the observed owner-turn cadence: cast, next Marian turn at cooldown 2, following Marian turn at cooldown 1, then ready on the fourth Marian turn. Virtual Concert Marian turns advance this clock. A6 grants two medicines, with one free use per Marian turn. The live formulas use sourced bases of 30% Attack, 45% Defense, 25% damage, and 10% continuous damage for one turn, plus sourced A1 magnitude and A0 or A6 duration extensions. The source of the observed 1.58 medicine multiplier remains unknown and is not assumed.
- BERRY direct skills, Chains of Love, Lovesick stack interactions, DOUBLE BERRY, the one-time Alt, Highlight reactions, and survival behavior are implemented with focused tests. The default Lovesick DoT coefficient and duration are absent from the imported evidence, so default continuous damage is reported as unmodeled and contributes zero rather than using an invented value.
- Assist and Theurgy actions are disabled. Their action insertion, gauge, eligibility, and clock rules are not implemented. The other 15 imported kits remain partial generic implementations.

### Multidimensional Dreamscape boundary

The Hachiman encounter is a `damage_preview_only` simulation. It runs six configured party rounds, includes the observed `Attack Turns Left 0` round, and then ends as `preview_complete`. The result reports simulated damage, with `foeDefensePoints` and `turnsSurvivedBonus` left null.

The observed live result is stored separately: `(258,098,432 Foe Defense Points + 125,000 Turns Survived Bonus) x 8 = 2,065,787,456`, with 6 turns survived. This verifies that one observed result's buckets compose correctly. It does not establish Foe Defense Points accumulation, survival-bonus derivation, or the actual game-end trigger.

### Optimizer status

The September 4 result of 37,425,059,184 and baseline of 8,734,831,636 are historical outputs. The JSON is archived at `data/optimizer-slaughter-2026-09-04-archive.json` and must not be presented as a current live-profile result.

The current `live-2026-09-04` full search completed 29,119 candidates across 45 generations with population 700, elite 45, 3 refinement passes, search seed 20260829, and battle seed 808. It found a best searched score of 20,757,143,632 against a current Full Auto baseline of 4,699,599,848. The saved artifact reports matching fast and full replay scores for both the baseline and optimized candidate. This is a best searched result, not a global-optimum or live-game claim. The final suite passed 98 tests, browser QA passed, and the main project was synchronized with verified hashes. See VALIDATION-2026-09-05.md.
