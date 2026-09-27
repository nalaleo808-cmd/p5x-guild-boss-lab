# Hachiman score variance diagnosis

The existing recorded checkpoints locate the divergence. T1 is within 5% of the live score, but the shortfall expands as buffs, Highlights and Concert effects accumulate. This is evidence against correcting the whole battle with one multiplier. The two Concert rounds generate 77.41% of the final missing points; T6 alone generates 70.06%.

This is a read-only analysis of `outputs/hachiman-turn-weighted-final-2026-09-06.json`, `HACHIMAN-ROTATION-CHECK-2026-09-05.md`, and `data/ichigo-live-t3-snapshot-2026-09-05.json`. No new battle simulation or mechanic change was made during this diagnosis. Fractions below are retained from the weighted accumulator; the final result rounds cumulative points once.

## Matched score checkpoints

| Checkpoint | Actual cumulative points | Simulated weighted points | Missing points |
| --- | ---: | ---: | ---: |
| T1 | 278,933 | 265,334.5 | 13,598.5 |
| T2 | 5,844,450 | 2,740,264.5 | 3,104,185.5 |
| T3 | 20,455,968 | 6,797,041.5 | 13,658,926.5 |
| T4 | 46,411,896 | 13,982,619.5 | 32,429,276.5 |
| T5 | 107,082,856 | 37,232,079.5 | 69,850,776.5 |
| T6 | 663,128,512 | 236,245,699.5 | 426,882,812.5 |
| T7 | 726,403,712 | 241,460,063.5 | 484,943,648.5 |
| T8 result base points | 762,576,512 | 252,998,911.5 | 509,577,600.5 |

## Concrete state mismatches before T3 Berry S3

| Field or effect | Captured in game | Simulator |
| --- | ---: | ---: |
| Berry Attack / attack scaling input | 11,444 | 15,596.71412 |
| Berry critical rate before cap | 106.3% | 76.4% |
| Berry critical multiplier | 500.8% | 290.8333% |
| Berry Pierce | 27.6% | 18.5% |
| J&C Two Masks damage buff | 71.1% | 32.704% |
| Marian Summer Garden damage buff | 45.4% | 18.7% |
| Marian Sea Breeze critical-damage buff | 48.8% | 16.6667% |
| Marian Highlight critical-damage buff | 24.4% | 8.3333% |
| Medicine critical-damage buff | 24.4% | 8.3333% |
| J&C Mischief Attack buff | 54.5% | 29.056% |

These are matched battle-state comparisons, not replacements for equipped base stats. The simulator overestimates Attack while underestimating the critical and support-buff values. Increasing all damage by the final ratio would worsen the already excessive Attack input. The mode's critical conversion gives a factor of about 2.458 from the simulated T3 stats versus 5.008 from the captured stats, holding other inputs fixed. This quantifies the importance of the critical mismatch without claiming it explains the entire score difference.

### Confirmed overwrite bug

Marian S3 is correctly imported with an 18.2% critical-rate buff. Dionysus Revolution is imported with a 7.2% base critical-rate buff. Both use `crit_rate_up`. `applyStatus` matches by ID and replaces the earlier effect, so T2 Revolution overwrites Marian's stronger effect. The T3 trace retains only 7.2%, whereas the recorded status view still shows Marian's 18.2%. Source identity and refresh behavior need correction. Revolution's additional user-critical-rate scaling is also absent from the imported executable effect.

### Missing continuous damage

The engine attempts to trigger continuous damage plus two extra Lovesick activations on Berry Highlights, but omits Lovesick damage because its coefficient is missing. The missing damage also cannot enter Concert's recording or subsequent echo. This is a concrete missing contribution affecting exactly the largest-divergence intervals; the available captures do not isolate its numerical share.

### Understrength support effects and an omitted observed mode effect

J&C and Marian use incomplete equipped inputs, giving the weaker buff values shown above. The T8 Intel observation also records Hachiman's +20% final damage taken effect as active, while the current role check leaves it inactive for this team. Its activation condition is unresolved and must not be justified by relabeling Marian as a Medic.

## Largest T6 intervals

| Matched interval | Actual points gained | Simulator points gained | Missing points |
| --- | ---: | ---: | ---: |
| J&C S1 | 991,664 | 20,878 | 970,786 |
| Berry ordinary Highlight and triggers | 56,883,576 | 6,180,790 | 50,702,786 |
| Marian S1 | 651,616 | 9,422 | 642,194 |
| Berry Alt Highlight and triggers | 59,979,760 | 24,475,406 | 35,504,354 |
| Berry Alt S3 through Concert finish | 437,539,040 | 168,327,124 | 269,211,916 |

The last interval alone contributes 52.83% of the final gap. Its live capture combines attacks, triggered effects and the finish animation; it cannot be attributed entirely to one hit or the beam. The simulator does include MIKU's echo: 55,565,770 raw damage. It also includes the preceding S3/repeat packets, 28,597,792 raw, giving 84,163,562 raw or 168,327,124 weighted for the interval.

The simulator's first T6 Highlight is noncritical despite 98.4% nominal critical rate because ordinary critical rolls cap at 95%; its next Alt Highlight crits. Whether Highlights should use Dreamscape's Skill/Resonance conversion requires source clarification. The live individual critical result was not captured, so this remains a possible contributor rather than a proven live mismatch.

## Correction order

1. Fix the source-ID collision and missing sourced buff scaling, then reconcile against the captured T3 values.
2. Restore the observed active mode modifier for the recorded setup with explicit evidence, without inventing its universal trigger.
3. Complete Lovesick damage and its Highlight/Concert interactions from coefficient evidence.
4. Recompare the two Highlights and the Alt S3/Concert finish separately. Do not fit an overall constant to the final score.

The scoring schedule and x8 multiplier are now included. The remaining discrepancy is concentrated in damage state and missing effects. The screenshots identify several causes and where their effects accumulate, but do not uniquely allocate every missing point.
