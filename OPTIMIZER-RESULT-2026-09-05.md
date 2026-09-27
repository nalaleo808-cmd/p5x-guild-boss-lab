# Slaughter Drive optimizer result, September 5, 2026

## Result

The current `live-2026-09-04` search evaluated 29,119 candidates and found a best searched Nexus of Dreams score of **20,757,143,632** at battle seed 808. The current Full Auto baseline is **4,699,599,848**, for a simulated gain of 16,057,543,784 or about 341.68%.

| Field | Value |
| --- | --- |
| Mechanics profile | `live-2026-09-04` |
| Boss and mode | Slaughter Drive, Nexus of Dreams |
| Fixed party | Wonder, MARIAN Beachflower, PUPPET Wavecatcher, J&C |
| Navigator | MIKU |
| Search seed | 20260829 |
| Battle seed | 808 |
| Generations | 45 |
| Population | 700 |
| Elite | 45 |
| Refinement passes | 3 |
| Candidates evaluated | 29,119 |
| Full Auto baseline | 4,699,599,848 |
| Best searched score | 20,757,143,632 |
| Baseline fast/full replay parity | Match |
| Optimized fast/full replay parity | Match |

The optimized score buckets are `(827,135 Base Damage Points + 5,188,208,773 Weakened Damage Points + 250,000 Boss Attack Points) x 4 = 20,757,143,632`. The underlying simulated damage is 1,414,182,091, including 1,413,354,956 during Weakened.

The complete candidate, action trace, score buckets, and parity flags are stored in `data/optimizer-slaughter-latest.json`. The selected plan uses the Mischief and Service masks, opens with Service, breaks Life Sustainment on Attack Turn 7, and schedules MIKU Showstopper on Attack Turns 3 and 7.

## Reproduce

Run the same deterministic search:

```bash
node scripts/optimize-slaughter.mjs --generations 45 --population 700 --elite 45 --refine-passes 3 --search-seed 20260829 --battle-seed 808 --mechanics-profile live-2026-09-04 --output data/optimizer-slaughter-latest.json
```

Replay the saved candidate:

```bash
node scripts/optimize-slaughter.mjs --replay data/optimizer-slaughter-latest.json
```

## Evidence and limits

This is the best candidate found by the configured seeded search. It is not proof of a global optimum or a verified live-game score.

The historical 37,425,059,184 result belongs to the earlier September 4 behavior and remains in `data/optimizer-slaughter-2026-09-04-archive.json`. The recorded Nexus score of 3,642,530,108 is protected separately by `recorded-2026-08-29`; archive reproduction does not prove that current live mechanics reproduce the recording.

The current result depends on partial kit modeling. J&C's same-owner-turn Highlight cooldown grace remains provisional. Marian's medicine bases, cadence, A1 magnitude, and A0 or A6 duration extensions are sourced, but the source of the observed 1.58 magnitude multiplier is unknown and excluded. BERRY's missing default Lovesick DoT coefficient and duration are not invented. Assist and Theurgy are disabled, and the other 15 imported kits remain partial generic implementations.

The saved artifact records baseline and optimized fast/full parity. Post-review replay matched the same score, all 98 tests passed, browser QA passed, and the main source copy was verified. See VALIDATION-2026-09-05.md for the final validation record.
