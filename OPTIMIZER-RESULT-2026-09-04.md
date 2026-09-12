# Slaughter Drive optimizer result, 2026-09-04

The saved optimizer result searched 29,587 candidates and executed to a score of **37,425,059,184**. The fixed team was Wonder, MARIAN Beachflower, PUPPET Wavecatcher, and J&C, with MIKU as navigator. The battle seed was 808 and the search seed was 20260829. Search settings were 45 generations, population 700, elite count 45, and 3 coordinate-refinement passes.

This is the best searched result under the current simulator engine. It is not a proof of a global optimum and is not a guaranteed live-game score. The saved replay reports parity for both the baseline and optimized result.

## Readout

| Result | Score |
|---|---:|
| Recorded benchmark | 3,642,530,108 |
| Current deterministic baseline | 8,734,831,636 |
| Optimized result | 37,425,059,184 |
| Gain over baseline | 28,690,227,548, or 328.4577% |

Optimized score buckets are base damage points 827,135, weakened damage points 9,355,187,661, and boss attack points 250,000, multiplied by the difficulty bonus of 4. The optimized replay recorded 2,549,336,924 total raw damage, including 2,548,509,789 during Weakened, and 35 Catch a Wave damage events for 107,164,798 damage.

The benchmark policy calls MIKU on Attack Turns 2, 3, 4, and 7. The executed optimized trace calls MIKU on turns 4, 5, 6, 7, and 8. Showstopper remains on turn 7, but the earlier calls shift to the later setup and post-burst cadence.

## Executed rotation

The table below contains the executed party actions. Free medicine and True Desire choices are marked `[free]`. Navigator and Highlight interrupts are listed separately below to preserve their timing. The Concert rows are inserted during Attack Turn 7 before its normal party actions.

| Turn/context | Wonder | Marian | Miyu | J&C |
|---|---|---|---|---|
| 1 | Guard | Guard | Jellyfish Splash | Mask of Service & Admonition |
| 2 | Guard | Summer Garden | Jellyfish Splash | Mask of Mischief & Innocence |
| 3 | Maziodyne | Guard | Jellyfish Splash | Mask of Service & Admonition |
| 4 | Guard | Gentle Sea Breeze | Paddle Out | Mask of Mischief & Innocence |
| 5 | Maziodyne | DOT-Up on Marian `[free]`; Summer Garden | Paddle Out | Mask of Service & Admonition |
| 6 | Revolution | Attack Tablet on Miyu `[free]`; Gentle Sea Breeze | Guard | Attack |
| 7, Concert 1 | Attack | Fighter Salve on Miyu `[free]`; Beach Basket | Jellyfish Splash | True Desire On `[free]`; Mask of Mischief & Innocence |
| 7, Concert 2 | One-Fathom Fang | Fighter Salve on Miyu `[free]`; Summer Garden | Jellyfish Splash | Attack |
| 7, post-Concert | One-Fathom Fang | Attack | Aerial Tide | True Desire On `[free]`; Attack |
| 8 | One-Fathom Fang | Attack | Aerial Tide | Attack |

All Gentle Sea Breeze uses target Miyu. Marian's Highlight targets herself. The independent interrupt sequence is:

| Timing | Free interrupts in execution order |
| --- | --- |
| Turn 4, before Wonder | MIKU Feel the Beat |
| Turn 5, before Wonder | MIKU Feel the Beat |
| Turn 6, before Wonder | MIKU Clear Sound, then J&C Mischief Highlight |
| Turn 7, before Concert 1 party actions | Break HP Lock, MIKU Showstopper, Marian Highlight, Miyu Highlight, J&C Mischief Highlight |
| Turn 7, Concert 2, after Miyu's skill | Miyu Highlight |
| Turn 7, after Concert, before Wonder | J&C Mischief Highlight |
| Turn 8, before Wonder | MIKU Feel the Beat, then Wonder Highlight |

The trace is intentionally based on actions that executed. Candidate genes can contain unreachable requests, such as an early Showstopper before MIKU has the required cooldown and Tracks. Those proposals are excluded from this table. The saved replay also contains the actual fallback Guard and Attack actions.

## Provisional engine limits

J&C Mischief Highlight executes at turn 6, Concert 1, and post-Concert turn 7 even though live cooldown behavior is not fully enforced by the current engine. Attack Tablet remains an engine assumption of 30% Attack for two turns. The current model also has incomplete parity for several character-specific systems, so the score should be used as a local optimizer comparison.

The supplied YouTube recording was not accessible for direct review. The local source identifies a 16:52 recording captured on 2026-08-29, but the local turn anchors are simulator policy anchors rather than independently re-observed video timestamps. Fighter Salve is the locally recording-confirmed medicine effect. Attack Tablet and Defender Tonic remain assumptions. The archived rotation is not video proof for this new search.

## Reproduction

Run the search with:

```text
node scripts/optimize-slaughter.mjs --generations 45 --population 700 --elite 45 --refine-passes 3 --search-seed 20260829 --battle-seed 808 --output data/optimizer-slaughter-latest.json
```

Replay the saved candidate with:

```text
node scripts/optimize-slaughter.mjs --replay data/optimizer-slaughter-latest.json
```

Source artifacts: [data/optimizer-slaughter-latest.json](data/optimizer-slaughter-latest.json) and [HANDOFF-VERIFICATION-2026-09-04.md](HANDOFF-VERIFICATION-2026-09-04.md).
