# Hachiman variance fixes and combined comparison

The complete recorded T1 through T8 route resolves legally after the combined changes. The new projected result is **4,601,722,648**, compared with **6,101,612,096** recorded in game. The previous result was **2,024,991,296**. This closes 63.21% of the previous gap; the simulation remains 24.58% below the recording.

This is an evidence-based correction pass, not a calibration to the final score. Seed 8, the existing guarded rotation, the confirmed turn weights, and the x8 difficulty multiplier were retained. Adding damage packets changes subsequent seeded random draws, so the total improvement cannot be attributed to individual fixes from this one comparison.

## Implemented corrections

- Generic live skill buffs retain their originating skill ID. Marian S3 and Dionysus Revolution no longer overwrite one another; recasting the same skill refreshes its own effect. Revolution now applies its sourced critical-rate scaling. The T3 state retains Marian's 18.2% and Revolution's 8.4% as separate effects.
- Lovesick now uses 18% Attack per stack at level 70+, a four-turn duration and the A6 fifteen-stack cap. Its noncritical damage factors are stored at application and refreshed by S3, while eligible ticks use current critical stats. Each tick passes once through score and Concert recording. Source confidence and unresolved details are documented in [the Lovesick evidence note](LOVESICK-FORMULA-EVIDENCE-2026-09-06.md).
- The recorded comparison explicitly enables the captured Hachiman +20% final damage taken / -60% final damage dealt effect. This is a scenario observation override. Its general activation trigger remains unknown, and no character role was changed. The ordinary app setup does not automatically enable this override for every Hachiman party.
- Hachiman Dreamscape now uses sourced level-80 Attack, HP and Defense defaults where equipped totals are missing. Imported reduced defaults belonged to the older damage scale. Explicit entered stats, including Berry's equipped totals and the requested SP values, remain authoritative. Other encounter defaults retain their existing damage scale.
- Marian's live S3, Highlight and medicine critical-damage scaling now include active critical-damage buffs at use. Summer Garden uses continuous HP scaling, consistent with its 13,632 HP cap giving 45.452% damage, displayed as 45.4% in the recording. Archived formulas are retained.
- Snapshot calculations are excluded from the runner's damage trace. The saved comparison was cleaned of twelve snapshot-calculation entries without changing any battle state, packet damage or score.

Marian's scaling descriptions are in `data/lufel-catalog.json` under Summer Garden, Gentle Sea Breeze and her Highlight. Revolution's description is in `data/lufel-live-persona-skills.json`. These changes do not replace missing equipped totals with buffed screenshot values.

## Combined comparison

Source: `outputs/hachiman-variance-fixes-2026-09-06.json`. Every checkpoint reports complete. Points below are cumulative weighted damage points before survival bonus and difficulty conversion; half-points are retained until the final cumulative rounding.

| Checkpoint | Actual points | Previous simulation | Updated simulation |
| --- | ---: | ---: | ---: |
| T1 | 278,933 | 265,334.5 | 381,587.5 |
| T2 | 5,844,450 | 2,740,264.5 | 5,208,166.5 |
| T3 | 20,455,968 | 6,797,041.5 | 13,804,623 |
| T4 | 46,411,896 | 13,982,619.5 | 27,148,473 |
| T5 | 107,082,856 | 37,232,079.5 | 63,028,787 |
| T6 | 663,128,512 | 236,245,699.5 | 534,802,305 |
| T7 | 726,403,712 | 241,460,063.5 | 553,716,407 |
| T8 | 762,576,512 | 252,998,911.5 | 575,090,331 |

Final arithmetic: `(575,090,331 + 125,000) x 8 = 4,601,722,648`. The 125,000 survival bonus is the observed result for this recorded route, not a newly inferred universal curve.

The opening is now higher than the recording, although the final gap shrank. A single overall multiplier would conceal the timing and state differences.

| Matched T6 interval | Actual point gain | Updated simulated point gain |
| --- | ---: | ---: |
| J&C S1 | 991,664 | 119,036 |
| Berry ordinary Highlight and triggers | 56,883,576 | 58,008,940 |
| Marian S1 | 651,616 | 52,440 |
| Berry Alt Highlight and triggers | 59,979,760 | 62,321,912 |
| Berry Alt S3 through Concert finish | 437,539,040 | 351,271,190 |

The Highlight intervals are approximately 1.98% and 3.90% above the recording. The final S3/Concert interval remains 19.72% below it. MIKU's echo is present at 126,913,458 raw damage. The saved trace contains seventeen Lovesick damage activations totaling 52,463,505 calculated damage, before any finite-HP clamp. This is not an isolated estimate of Lovesick's contribution to the final improvement.

## Remaining mismatches

At the matched T3 Berry S3 checkpoint:

| Field | Captured in game | Updated simulation |
| --- | ---: | ---: |
| Effective Attack | 11,444 | 15,596.71412 |
| Critical rate before cap | 106.3% | 95.8% |
| Critical multiplier | 500.8% | 298.1667% |
| Pierce | 27.6% | 18.5% |
| J&C Two Masks damage buff | 71.1% | 32.704% |
| J&C Mischief Attack buff | 54.5% | 29.056% |
| Marian Summer Garden damage | 45.4% | 20.9785% |
| Marian Sea Breeze critical damage | 48.8% | 16.6667% |
| Marian Highlight critical damage | 24.4% | 12% |
| Medicine critical damage | 24.4% | 12% |

The underlying missing equipped/support inputs remain material. Marian's first S3 still uses her unsupplied default critical multiplier; including active buffs cannot replace absent equipment stats. Berry's effective Attack is already too high, so the next pass should reconcile exact equipped support stats and each active buff, then isolate Berry Alt S3 and the Concert recording total. Hachiman Defense, Highlight critical rules, Lovesick transfer/cap details, and some Wonder Persona/weapon passive triggers remain unresolved. Do not force these values from the final score.

## Validation performed

One combined guarded full-route replay completed. Syntax checks and the static app build passed. Read-only integration review confirmed snapshot capture does not advance RNG or mutate battle state, DOT accounting records once, and echo accounting is separate. All seventeen saved Lovesick packets have finite snapshots whose cohort counts match their active stack count.

No optimizer, full test suite, archived benchmark rerun or visual browser QA was performed in this pass. The archived Nexus branch was preserved by code scope review; this is not a fresh numerical benchmark verification.
