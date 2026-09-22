# How the live-vs-simulator damage discrepancy was found

A method write-up for handoff. The findings themselves are logged in date order in `HACHIMAN-STAT-EVIDENCE-2026-09-06.md`; this document is about *how* they were found, so the next person can keep going the same way.

## 1. The starting position, and the trap in it

The inherited simulator projected about 6.47B against a recorded Multidimensional Dreamscape score of 6,101,612,096. That is 1.06x: close enough to look nearly solved, and close enough to tempt a single fudge factor.

The rule that made the rest of the work possible was set at the start and never broken: **never adjust a constant to close the gap**. A constant only changes when an observation forces it, and the score is not allowed to be the reason. Everything below follows from taking that seriously.

## 2. The core move: decompose, because an aggregate can hide its own errors

A single total cannot tell you where a model is wrong. 1.06x could be six percent too high everywhere, or it could be two large errors of opposite sign that happen to cancel.

So the first real step was to stop comparing totals and start comparing **intervals**. The recorded run has a Total Score visible on the HUD between actions, so the run can be cut into per-turn checkpoints and each interval compared independently.

That immediately falsified the "six percent everywhere" reading:

| Turn | Ratio at the 1.06x stage |
| --- | ---: |
| T1 | 1.33 |
| T2 | 1.31 |
| T3 | 1.09 |
| T4 | 0.92 |
| T5 | 1.01 |
| T6 | 1.13 |
| T8 | 1.06 |

Early turns were a third too high and T4 was too low. At an earlier stage T7 sat at 0.48x, less than half. The pleasant headline number was two substantial, opposite, unrelated defects partly cancelling.

**This is the most transferable lesson in the project. Never accept an aggregate match as evidence of a correct model.**

## 3. Instrumentation, in the order it became necessary

Each level was built only when the previous one stopped being able to answer the question.

1. **Whole-run replay** (`scripts/compare-hachiman-opening.mjs`, `scripts/run-hachiman-dod.mjs`). Reproduces a recorded route deterministically from a seed. Answers "are we close overall".
2. **Per-turn checkpoints**. Answers "which turn is wrong".
3. **Per-action point deltas** (`scripts/replay-hachiman-dod-live.mjs`). Answers "which action in that turn is wrong".
4. **Per-hit damage factor dumps**. Every bonus id and value, the defense multiplier, the crit multiplier, the source multiplier, for a single hit. Answers "which term inside that action is wrong". This is what made it possible to say a hit carried 21 damage-bonus terms summing to +682% and then check that list against a screenshot line by line.

Levels 3 and 4 are where every real discovery happened. Level 1 alone would have produced a plausible, wrong model.

## 4. Evidence hierarchy

Sources were ranked and the ranking was enforced when they disagreed.

1. **Result screens.** Exact, authoritative totals and the score formula.
2. **In-battle Total Score read between actions.** Gives exact per-action damage by subtraction.
3. **Status and buff lists screenshotted mid-battle.** Authoritative for what is active and at what value.
4. **Character panels.** Stats, including in-battle panels that already include set effects.
5. **Skill tooltips.** Coefficients and durations.
6. **Community data (Lufelnet) and video of other players' runs.** Reference only, lowest weight.

The breakthroughs came from 2 and 3. Result screens confirm, they do not diagnose.

## 5. The findings, and the technique that caught each

The technique matters more than the answer, because the techniques are reusable.

**Concert buffs were double counted.** *Technique: enumerate model state, diff against a screenshot of game state, one line at a time.* The model's buff list on Berry during Virtual Concert was printed and compared against a mid-Concert status screenshot. The game showed one Feel the Beat attack entry; the model had two, a regular song copy plus a Concert copy, and the same for Clear Sound, the song conditionals and the Setlist entries.

**MIKU's Labor 4-set multiplies the stat, it is not another additive buff.** *Technique: find a place where the mechanic shows up in an observable that is not damage.* Labor grants +8% HP, ATK and DEF. HP and DEF are visible on the in-battle panel, so the form of the buff could be settled by arithmetic with no damage reasoning at all: observed HP 11,334 and DEF 1,984 against (panel + navigator share) x 1.08 = 11,277 and 1,960. One buff names all three stats, so ATK takes the same form. This reversed a loadout recommendation that had been made on the wrong reading.

**Guard fills the shared Highlight gauge.** *Technique: watch a resource the model was silently getting wrong.* During the live run the gauge went 0, 17, 34, 51 across four consecutive guards. The model granted nothing for Guard, which is why replays had needed an artificial gauge top-up to stay legal.

**True Desire recharges on eight of J&C's own counted actions.** *Technique: constraint satisfaction across several observations rather than fitting one.* The button was pressed at T1, reappeared at the start of T10 and not before, was pressed again at T18, and was absent at B3 and B4. Two earlier hypotheses each fitted some of those and failed others. Only the J&C-action clock fits all of them.

**The boss has 405,499 HP and the lock floors it at one percent.** *Technique: exact repeated values are a fingerprint.* Two independent runs, different players, both froze at exactly 401,445 while locked and both reported base damage 405,499. 405,499 minus 401,445 is 4,054, which is one percent of max. The previous reading, 410,000 with a 1 HP floor, was a rounding that no longer survived two exact coincidences.

**The action that opens the break earns no Weakened credit.** *Technique: checkpoint arithmetic on an exact boundary.* B1 began at exactly 405,499, the base figure, so the skill that finished the HP bar contributed nothing beyond it, despite landing several hits and a tick.

**Boss status durations only count down when the boss acts.** *Technique: a user observation that contradicted model state, then tracing every place the model ticked.* The observation was that a Rakunda cast at T17 was still active at B4. The model had expired it before B3, because it was ticking boss statuses at the end of every Concert round and every Weakened turn, both of which are turns the boss never acts on.

**Marian's medicine basket is unlimited.** Also a user correction: A6 Summer Marian does not consume medicine, so a count read off her panel was not a remaining-use count.

The last two are worth noting for a successor: **two of the findings came from the player, not from the instrumentation.** The model was confidently wrong in both cases and nothing in the data would have flagged it. Ask the player to sanity-check model state, not just model output.

## 6. Validation discipline

Every change was re-validated against **all** recordings, never only the one that motivated it. The question asked of each change was: does this move every route toward its recording, or just the one I was looking at?

- The boss-tick fix improved all three simultaneously. That is strong evidence of a real mechanic rather than a fit.
- The Concert de-duplication made the Dreamscape headline **worse**, 1.06x down to 0.88x, while being plainly correct on the screenshot evidence. It was kept. This is the discipline working: correctness is not the same as score matching.

## 7. Why the headline number went backwards, and why that is progress

| Route | At takeover | Now | Recorded |
| --- | ---: | ---: | ---: |
| Dreamscape | ~6.47B (1.06x) | 5,471,888,024 (0.90x) | 6,101,612,096 |
| Sleepy's DOD route | n/a | 1,231,298,623 pts (1.03x) | 1,195,731,395 pts |
| Joker's live DOD route | n/a | 1,120,444,516 pts (1.10x) | 1,017,120,067 pts |

Dreamscape is further from its recording than when the project was inherited. That is expected and is not a regression. The old 1.06x was compensating errors; several have been removed, and what remains is now mostly same-signed, so it no longer cancels. The model is more correct and less flattering. Judge it on the per-interval table, not the total.

The Devourer of Dreams model, which was built and validated after the decomposition discipline was in place, sits at 1.03x and 1.10x on two independent runs, with the pre-break phase exact to the point.

## 8. What is still open

- **J&C's hits run 1.3x to 2.7x over in every mode.** The single largest remaining error. Mask hits and the enhanced Two Masks.
- **Berry inside Virtual Concert is about 13% over** in Devourer of Dreams.
- **Dreamscape post-Concert turns are under.**
- **Turn one is inflated**, badly enough that with the HP lock handled as a player handles it the model kills the boss on turn one. See the caveat below.
- Boss shield refills to 7 after some boss actions in the game; the model does not. No score effect.
- Victory and Power 4-set effects unmodelled. Marian's Blossoms by the Beach reads +57% ATK in a captured status list against 12% in the model.

## 9. Two caveats a successor must know before trusting a rotation

**The pre-break turns were never validated, and cannot be.** Once Life Sustainment is on, every turn from T2 to T17 scores exactly zero, in the model and in the live game alike, both sitting flat at 401,445. The rotation search therefore only ever measured the setup at T16 to T18, which scores nothing directly but carries buffs into the break, and the four break rounds where all the score is. The earlier turns exist to build Lovesick stacks, Chains and cooldowns and are unverified by score because there is no score to verify against.

**The HP lock is pre-set in the model, not toggled.** `createHachimanDodConfig` sets Life Sustainment on before turn one, so the route's own "HP Lock ON" step at T2 is an idempotent no-op that has never executed. This is a deliberate workaround for the turn-one overshoot: with the lock toggled the way a player does it, the model deals the boss's entire 405,499 HP on turn one and the run collapses at T2. The lock mechanic itself is correct and was verified directly (floors at 4,054, blocks the break, toggles both ways). Fixing the turn-one overshoot and then making the T2 toggle a real action is the natural next task, and the two must be done in that order.

**The recommended rotation has never been run in the game.** One live run was driven end to end, but it was a variant with forced substitutions, and that variant is what `scripts/replay-hachiman-dod-live.mjs` reproduces at 1.10x.

## 10. The loop to continue

1. Pick the largest per-interval error, currently J&C's hits.
2. Capture game state for exactly that action: the full status list on both the actor and the boss immediately before it, and the Total Score immediately before and after.
3. Dump the model's factor breakdown for the same action.
4. Diff the two lists term by term. Look for a term the game does not show, a term it shows that the model lacks, or a value that differs.
5. Change the model only where the capture forces it. Write the evidence and the reasoning into `HACHIMAN-STAT-EVIDENCE-2026-09-06.md` in the same entry.
6. Re-run every replay and the full suite. Keep the change only if it moves all routes toward their recordings, or if it is forced by evidence even when it does not.
