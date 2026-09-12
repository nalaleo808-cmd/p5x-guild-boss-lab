# Hachiman comparison, September 5, 2026

## September 6: final rerun with turn-weighted scoring

Fresh full replay: `outputs/hachiman-turn-weighted-final-2026-09-06.json`, exit 0, all actions through T8 complete. The simulator's final score estimate is **2,024,991,296**, calculated as **(252,998,912 weighted Foe Defense Points + 125,000 recorded survival bonus) x 8**. Raw eligible boss damage remains 128,811,052.

Each eligible damage event now uses the user-confirmed normal-turn multiplier: 0.5 / 1 / 1.5 / 2 from T4 onward. Concert damage and its finish echo retain normal turn 5's x2 multiplier in this route. Daisoujou damage is excluded. Fractional weighted points total 252,998,911.5 and are rounded once to 252,998,912; the game's rounding boundary remains unverified. Actual recorded final score: 6,101,612,096.

The turn-weighted accumulator is scoped to live Hachiman Dreamscape. Raw damage remains separately available. The existing Highlight rule remains active pending the earlier clarification; its opt-in candidate is unchanged. Damage and missing loadout limitations remain, so the estimate does not claim live-score parity. Static build passed; no regression suite or optimizer was run.

## September 6: include the confirmed x8 difficulty multiplier

The user reconfirmed Hachiman's x8 score multiplier. The previous 128,811,052 result was unmultiplied boss damage. Applying x8 gives **1,030,488,416**. Including the recorded 125,000 survival bonus before multiplication gives **(128,811,052 + 125,000) x 8 = 1,031,488,416**.

The latter is a conditional score projection: it assumes simulated boss damage maps one-to-one to Foe Defense Points. That accumulation rule is still unverified. The actual recorded final score is 6,101,612,096. The checkpoint runner now reports the damage, confirmed multiplier, multiplied damage, and conditional final projection separately. No battle replay was needed for this arithmetic update.

## Latest damage correction and Highlight candidate

The live Hachiman formula now uses the [original damage research](https://forum.gamer.com.tw/G2.php?bsn=71034&sn=112): a 1400-based defense factor, separate base/total defense inputs, independent defense reduction and penetration contributions, and one additive damage/element/exposure category. The artificial 100x normalization is removed. Other profiles retain their prior calculation. Enemy HP, the recorded score, and equipment inputs were not adjusted to fit the outcome. Formula factors are now exported directly from the engine for each checkpoint, replacing the runner's approximate reconstruction.

The complete revised replay succeeds through T8, including all four opening minion kills: `outputs/hachiman-formula-correction-2026-09-05.json`, exit 0. Boss-only damage is **128,811,052**, versus **409,432,504,679** under the previous assumptions. This is still damage, not Foe Defense Points or the final game score. The source-based structure fixes major inflation, while encounter defense, missing loadouts, some modifier categories, and Dreamscape point accumulation remain unresolved. Full scoring parity is not established.

The separately tested Highlight candidate also completes T8 with the same damage: `outputs/hachiman-highlight-candidate-2026-09-05.json`, exit 0. It grants 17 base charge, doubled to 34 during Concert, plus 4 once per eligible weak cast. Automatic Two Masks and Double Berry repeats receive only the weakness supplement; the previously confirmed Berry kill resets retain full charge. Bonus hits within one cast do not multiply charge.

| Checkpoint | Recorded gauge | Current default | Opt-in candidate |
| --- | ---: | ---: | ---: |
| T5 J&C S2 and enhanced automatic S3 | 38% | 34% | 38% |
| End T5 | 38% | 42% | 38% |
| End T6 | 76% | 76% | 76% |
| End T7 | 42% | 38% | 42% |

The candidate also preserves the matching opening and T1-T4 endpoints. It is **not yet the app default**: the user clarification is pending because the earlier blanket Concert doubling statement had been interpreted as 42% for one weak cast. Use `--highlight-rule=base_double_weak_cast_bonus` with the comparison runner to reproduce the candidate; omit it for the existing rule. Candidate provenance: `data/hachiman-highlight-candidate-2026-09-05.json`. Damage provenance: `data/hachiman-damage-formula-research-2026-09-05.json`.

Verification: two complete requested comparisons, one for the active formula and one explicitly labeled Highlight hypothesis. Static syntax checks and app build passed. No regression suite, optimizer, or archived Nexus benchmark was rerun; archive preservation was checked by code review, not claimed as freshly simulated.

## Latest continuation with natural turn-start SP recovery

The user confirmed SP recovery at the start of each character's turn. The live engine now restores the guide-sourced baseline of 10 SP at the owner-turn entry, including extra Concert turns. It does not recover on free commands or repeated damage hits. Showstopper's separate 35 SP restoration remains unchanged, and Marian and Berry retain the requested 180 maximum SP. Existing overcap is preserved; natural recovery stops at ordinary maximum SP.

The SP Recovery percentage fields have inconsistent conventions, so this baseline does not yet apply those modifiers. The Lufel Tempest Riko guide documents upward rounding; local live checkpoints often indicate 11 rather than 10 recovery. Exact equipped and battle modifier attribution remains unresolved. Evidence and source URL: `data/turn-start-sp-recovery-evidence-2026-09-05.json`.

Result: `outputs/hachiman-continuation-turn-start-sp-2026-09-05.json`, exit 0. All scripted actions from opening through T8 complete without resource overrides beyond the two user-requested starting presets. Final J&C/Wonder/Marian/Berry SP: 40/101/126/113. The final boss-only damage preview is 409,432,504,679. This is not a calibrated game score or a verified game ending trigger. The actual recorded final score remains 6,101,612,096.

T5 and T7 gauge mismatches remain: T5 ends at 42% versus recorded 38%, and T7 ends at 38% versus recorded 42%. Completing the route establishes action legality under the current setup, not full mechanical or scoring parity. No regression suite or optimizer was run; engine syntax and static build passed.

## Latest rerun with Marian and Berry at 180 SP

The user requested 180 starting and maximum SP for Berry and another full rotation attempt. Her original screenshot stats retain their provenance; a separate SP preset applies the requested override to saved/default loadouts and the replay. Opening confirms both Marian and Berry at 180 SP.

Result: `outputs/hachiman-continuation-both180-2026-09-05.json`, exit 2 for a guarded resource block. T1-T7 complete. Berry's T7 Alt S1 succeeds and leaves 65 SP. T8 MIKU Fire support executes, then J&C S1 is blocked: J&C has 15 SP against its 20 SP cost. No J&C resource override was applied. The final recorded action and final score remain unreached.

T7 ends at 38% Highlight versus the recorded 42%. The boss-only damage preview is 401,436,633,515 and remains uncalibrated damage, not a final game-score prediction. No regression suite or optimizer was run.

## Latest rerun with Marian at 180 SP

The user requested another full rotation attempt after setting Marian's starting and maximum SP to 180. The runner was still replacing her preset `baseStats` with an empty object; that override was removed and the replay rerun. The fresh opening confirms Marian starts at 180 SP.

Result: `outputs/hachiman-continuation-marian180-2026-09-05.json`, exit 2 for a guarded resource block. T1-T6 complete. Marian now legally casts T7 S3, leaving her with 56 SP and raising shared Highlight to 17%. The next action, Berry's T7 Alt S1, is unavailable because Berry has 5 SP and needs 20. T8 and the final result are not reached. No other character's resources were overridden.

The cumulative boss-only damage preview at the stop is 397,040,665,026. This remains uncalibrated damage and must not be compared as a final game score. The underlying missing SP recovery still affects Berry and J&C. This run changes Marian's preset capacity, not the recovery system. No regression suite or optimizer was run.

## Continuation after the T2 shield correction

The T2 discrepancy was traced directly: Berry S3's main Curse hit reduced shields from three to two, then its ten-Lovesick bonus hit incorrectly reduced them to one. The live bonus retains its damage but is excluded from Down-point reduction. Distinct Double Berry casts retain their own main-hit allowance. Evidence: `data/berry-s3-shield-evidence-2026-09-05.json`.

Following the recorded sequence also exposed two T5 implementation contradictions. Showstopper activation must preserve the shared gauge (the live recording shows zero before and after), while still resetting Highlight cooldowns. Enhanced J&C Two Masks must be able to Down Hachiman through its elemental weakness hit. These live branches were corrected from the recorded checkpoints; archived behavior remains separate. Evidence: `data/hachiman-t5-continuation-evidence-2026-09-05.json`.

The runner now encodes all observed T1-T8 actions, including both Concert rounds, free medicines, ordinary counted items, Persona switches, Highlights, and Alt actions. It stops at the earliest illegal action without substituting commands or forcing resources.

Latest output: `outputs/hachiman-continuation-2026-09-05.json`. The replay completes T6, then reaches Marian's T7 S3 and stops because she has 1 SP against its 25 SP cost. T7 MIKU support now executes: finishing Concert clears the normal-turn navigator-use lock while retaining actual cooldowns, matching the observed ready support action after Concert.

Static SP tracing places the first explicit discrepancy earlier: Berry has 91 SP before T2 S3 in the recording versus 80 in the replay; J&C ends T2 at 91 versus 80. Marian has 75 before T3 S1 versus 53. `beginActorTurn` currently performs no ordinary SP restoration. Marian S2's catalog description contains damage buffs, Blessing, and debuff removal, with no stated SP restoration. The recovery amount, rounding, modifiers, and additional effects still need grounding before implementation: T5 Marian S2 changes her recorded SP from 87 to 93 despite a 22-SP cost, implying an additional 28 SP whose source is not isolated. No arbitrary per-turn refill was added. Evidence: `data/hachiman-t7-resource-evidence-2026-09-05.json`.

| Completed checkpoint | Recorded Highlight | Simulator Highlight | Recorded boss shield | Simulator boss shield |
| --- | ---: | ---: | --- | --- |
| T1 | 100% | 100% | 4 | 4 |
| T2 | 72% | 72% | 2 | 2 |
| T3 | 38% | 38% | 1 | 1 |
| T4 | 100% | 100% | 0 | 0 |
| T5, first Concert round | 38% | 42% | DOWN | DOWN |
| T6, second Concert round | 76% | 76% | DOWN | DOWN |

Matching endpoint gauges do not establish matching intermediate charge events. The recorded first enhanced J&C Concert action and T5 Berry action show 38%, while the confirmed doubled weakness rule currently produces 42%. This remains unresolved. The latest boss-only damage preview after T6 is 397,036,953,780; it is uncalibrated damage, not a prediction of the game's displayed score. The actual final game score remains 6,101,612,096, and the replay has not completed T8.

This continuation uses the user's latest verification preference: code review and syntax checks during edits, the requested sequence comparison continued to each legality block, and no focused regression suite or benchmark run. Engine and runner syntax checks passed, and the static app build succeeded. Historical results below describe earlier code and are retained for traceability.

## Historical replay with confirmed Daisoujou damage-taken stacks

The user confirmed +10% Hachiman damage taken per defeated-minion stack, capped at four stacks. The live engine applies one aggregate 10/20/30/40% debuff as each Daisoujou dies, before Berry's following cast. No additional wave-clear multiplier is applied. Duration is unknown and has no modeled expiry; the FX display labels that uncertainty.

Fresh result: `outputs/hachiman-comparison-2026-09-05-defeat-stacks.json`, exit 0. T1 ends with four stacks, 100% Highlight, and boss-only damage preview 250,856,875. T2 completes at 72% Highlight and preview 1,657,339,080. The scripted T3 prefix completes at 89% Highlight and preview 1,659,729,269. These previews still do not reproduce the game's damage scale. The previously identified T2 S3 shield mismatch remains unresolved.

Two focused defeat-stack tests passed, covering incremental amplification, the cap, exclusion of minion damage from this bonus, unknown-duration retention, and Berry kill-chain ordering. The recorded Nexus benchmark rerun remains exactly 3,642,530,108. Earlier comparison results below are retained for traceability.

## Historical replay after Berry S1 reset correction

The user identified Berry's kill-triggered S1 recasts as the missing Highlight source. The engine now charges each eligible cast using the existing normal/weakness rate, with one SP payment and one counted action for the entire chain. The same seed and route were replayed without changing any damage coefficients or forcing resources.

| Checkpoint | Recorded Highlight | Simulator Highlight | Recorded shield | Simulator shield |
| --- | ---: | ---: | ---: | ---: |
| End T1 | 100% | 100% | 4 | 4 |
| End T2 | 72% | 72% | 2 | 1 |
| T3 after J&C S2 and automatic S3 | 89% | 89% | 2 | 1 |

Berry's T2 Highlight now executes legally. The next shield divergence occurs on T2 Berry S3: the game goes from 3 to 2, while the simulator goes from 3 to 1. The scripted T3 prefix completes, but the remainder of T3 and T4-T8 is not yet encoded.

Boss-only damage previews remain uncalibrated: T1 179,237,061; T2 1,183,867,206; T3 prefix 1,185,574,484. Recorded displayed scores at those same checkpoints are 278,933; 5,844,450; and 6,540,544. This gauge fix does not resolve the damage formula mismatch.

Fresh output: `outputs/hachiman-comparison-2026-09-05-berry-reset.json`. Runner exit 0. The five new reset tests and seven shared-Highlight tests passed. The recorded Nexus benchmark rerun remains exactly 3,642,530,108 with 40 Catch a Wave hits and 8,636,830 follow-up damage. The prior eight full-suite failures below were not fixed or rerun in this focused pass.

## Previous comparison before the reset correction

Fresh replay requested by the user after confirming ordinary Highlight 17/21 and Virtual Concert doubling, damage amplification, and cooldown reset. Mode: Multidimensional Dreamscape. Seed: 8, retained from the recorded critical-Gun setup, not selected for score agreement.

## Result

The simulator completes T1, but cannot legally perform Berry's T2 Highlight. Its shared gauge is 97% versus the recorded 100%. The first three manual charge changes match. No gauge override or substituted action was used to continue beyond the mismatch.

| Checkpoint | Recorded gauge | Simulator gauge | Recorded displayed score | Simulator boss damage preview | Boss shield, live / sim |
| --- | ---: | ---: | ---: | ---: | --- |
| Before first manual action | 25% | 25% | 0 | 128,732 | 6 / 6 |
| J&C Gun | 42% | 42% | 13,198 | 187,524 | 5 / 5 |
| Vasuki Rakunda | 59% | 59% | 13,198 | 187,524 | 5 / 5 |
| Marian S3 on Berry | 76% | 76% | 13,198 | 187,524 | 5 / 5 |
| Berry S1 chain and settled T1 | 100% | 97% | 278,933 | 179,237,061 | 4 / 4 |
| Settled T2 | 72% | Not reached | 5,844,450 | Not reached | 2 / Not reached |
| Settled T3 | 38% | Not reached | 20,455,968 | Not reached | 1 / Not reached |

The damage preview is not a verified game-score prediction. It excludes Daisoujou damage but has no verified Dreamscape damage-to-score conversion. The engine's all-target total at T1 is 179,957,061, including 720,000 damage to the four idols. The runner now exports both quantities and excluded damage explicitly. Both runs removed all four idols; the simulator tracks four Daisoujou defeat stacks. Marian S3 consumed her action and granted two prescription charges.

## Where the sequence diverges

The known charge arithmetic is 25 + 17 + 17 + 17 + 21 = 97. The actual settled endpoint is capped at 100, so the missing contribution is at least three percentage points, not a confirmed three-point rule. Berry's chain contains four minion defeats, a boss hit, automatic repeats, and the subsequent enemy/round transition. The recording did not isolate their individual charge events. Additional repeat/follow-up eligibility remains unresolved.

MIKU's T2 Heaven support action executes without filling the missing gauge. Berry Highlight then fails the legal-action check. The requested T3 runner reports the dependent block. Consequently this replay does not reach Virtual Concert, later cooldown checkpoints, or a final score. The current script additionally encodes only opening, T1, T2, and partial T3; the complete observed T3-T8 route still needs to be encoded.

## Damage diagnosis

Damage already differs at the opening. The seeded automatic J&C S3 hits Hachiman for 128,732 in this replay; the actual opening score was zero and the automatic skill's target was not captured conclusively. The Gun itself adds 58,792, compared with the live displayed-score increment of 13,198.

Berry's final boss repeat contributes 179,049,537, or 99.90% of the simulator's T1 boss damage. Inspection identifies an unconditional 100x engine normalization, approximately 9.45x combined status multipliers, and approximately 2.33x Dreamscape critical-stat conversion on that hit. These explain the simulator's magnitude; they do not validate the live formula. No constant was tuned to the observed score.

Berry uses the saved equipped totals, including 4,927 Attack, 54.2% Critical Rate, and 235.5% Critical Damage. J&C, Marian, and Wonder still have incomplete equipped-stat inputs in this runner. Wonder's Cursed Ties is selected, but Evil Eye automatic procs remain omitted pending trigger evidence. Daisoujou's per-stack damage-taken value and duration are also unknown. These omissions prevent a trustworthy final score comparison.

## Validation and evidence

- Command: `node scripts/compare-hachiman-opening.mjs T3 --compact`.
- Fresh machine-readable result: `outputs/hachiman-comparison-2026-09-05-current.json`. Exit 2 denotes the recorded legality block, not a runner crash.
- Full suite: 170 tests, 162 passed, 8 failed. Output: `outputs/validation-2026-09-05-current.txt`. Failures must be triaged; this is not a clean validation pass.
- The suite's recorded Nexus benchmark assertion passed at 3,642,530,108. No recalibration was performed.
- Actual live checkpoint source: `HACHIMAN-ROTATION-CHECK-2026-09-05.md`, observed game checkpoints. Historical simulator numbers in that file are superseded by this fresh report.
- Actual completed game score remains 6,101,612,096. The supplied 6,663,043,136 rotation score is a guide, not a current simulator result.

Read-only failure triage points to seven outdated test setups or expectations involving personal versus shared Highlight, Marian's new preset migration, the removed unsupported minion-break bonus, and Dreamscape's continuous-damage bonus. One likely engine regression needs a focused fix: ordinary loadouts now add `baseStats.damageBonus` alongside Revelation damage, while the existing contract expects that displayed stat only for equipped totals. This does not explain Berry's current magnitude because her preset explicitly uses equipped mode. These findings have not yet been fixed or rerun.

## Historical next-work assessment before the corrections above

Resolve the T1 charge event that makes Berry's T2 Highlight legal, using an isolated recording of the S1 chain and following boss action. Complete equipped-stat inputs and audit the damage normalization and stacking against an isolated live hit. Then encode the remaining observed route and replay it without forced resources, comparing the two Concert rounds and the final result separately.
