# Hachiman evidence and model state, 2026-09-06

This is the consolidated record of the 2026-09-06 work on the recorded Multidimensional Dreamscape Hachiman run (J&C, Wonder, Beachflower Marian, Ichigo Berry, MIKU). It replaces the earlier running log. Every number below comes from Joker's screenshots and readings, sourced skill text, or the simulator; no constant was fitted to the recorded 6,101,612,096.

Current state (end of day): `(806,142,313 + 125,000) x 8 = 6,450,138,504` projected against 6,101,612,096 recorded (1.057x), with the Concert turn reproduced (T5 1.01, T6 1.13) after the Skill Amplification and Lovesick snapshot corrections described in the later sections. Early turns run 1.27x because of Lovesick tick size at T1 and T2. Source: `outputs/hachiman-mataru-2026-09-06.json`. The sections below are in the order the evidence arrived; the results table in "Results against the recording" is the mid-day state and is superseded by the later sections.

## Where things live

- Party, observed stats, adapters and the 64-action recorded route: `src/hachiman-recorded-team.js`. Used by both `scripts/compare-hachiman-opening.mjs` and the browser (Team screen with Hachiman selected: LOAD HACHIMAN RECORDED TEAM, then REPLAY RECORDED ROUTE, whose results screen shows the score derivation per normal turn).
- Raw evidence: `data/berry-talent-text-2026-09-06.json`, `data/hachiman-panels-2026-09-06.json`, `data/hachiman-t2-start-status-2026-09-06.json`, `data/ichigo-live-t3-snapshot-2026-09-05.json`, `HACHIMAN-ROTATION-CHECK-2026-09-05.md`.
- Run it: `node scripts/compare-hachiman-opening.mjs all --seed=8`. What-if flags: `--hachiman-base-def=364`, `--lovesick-tick=flat_buffed_attack_defense`.

## Inputs, all supplied

| Input | Value | Source |
| --- | --- | --- |
| Berry | ATK 4,927, DEF 1,494, HP 8,634, SP 100, Speed 96, crit 54.2%, crit mult 235.5%, Pierce 7.5%, Damage Mult 55.9% | Character Details panel; matches the saved preset |
| MIKU party share | HP 1,808, ATK 1,130, DEF 321, Damage Mult 8.5%, crit 5.7%, crit mult 15.2%, Pierce 2.4% | MIKU "Pt Effect" panel; navigators share 20% of their stats |
| Wonder | ATK 3,000, DEF 2,373, HP 10,718, SP 100, Speed 109, crit 39.8%, crit mult 190% | Character Details with Dionysus, Janosik, Vasuki |
| J&C (in battle after T1) | ATK 7,035, DEF 2,803, HP 12,682, crit 48.6%, crit mult 310.3%, Pierce 18.1% | In-battle Character Details; already includes share and set effects |
| Marian (in battle after T1) | ATK 4,866, DEF 2,220, HP 19,595, crit 11.9%, crit mult 318.9%, Pierce 20.5% | In-battle Character Details; already includes share and set effects |
| Hachiman Defense | base 821, boss coefficient 258.4% | Lufelnet Defense Reduction Calc, Hachiman row |
| Idol Defense | placeholder 240 | Unknown; idols do not score |
| Observed maximum HP | Wonder 13,455, Berry 11,334 | T3 full-heal totals and the T2 "8,993 of 11,334" display |
| Berry and Marian SP | 180 | User request on 2026-09-05 so the route resolves; the panels show 100 |

Berry's in-battle totals reconcile with these inputs: (8,634 + 1,808) x 1.08 = 11,277 HP against 11,334 seen, (1,494 + 321) x 1.08 = 1,960 Defense against 1,984 seen, and crit rate 54.2 + 5.7 + 15 (Chain 2) + 18.2 (Sea Breeze) + 12.0 (Revolution at Wonder's 45.5% crit) = 105.1% against 106.3% captured. The earlier "borrowed Berry has different gear" theory was wrong; the missing piece was the navigator share. The in-battle Attack panel excludes temporary skill buffs (it rose only 166 between T2 and T3 while +84.5% of Attack buffs were added), so it cannot be compared with the simulator's fully buffed scaling value.

## Sourced mechanics confirmed this pass

- **Mine Alone** (in-game text): Chain 1 "for each Lovesick stack inflicted, increase target's damage taken by 4%"; Chain 2 "increase critical rate by 15%. Also, all of Ichigo's skill damage is counted as continuous damage"; Chain 3 "increase continuous damage by 25%". The engine's Chain 2 conversion is therefore correct for skills.
- **Stage effects**: allies' continuous damage +30%; party Curse damage +20%; skill and Resonance damage does not use standard critical calculation but gains final damage equal to crit rate x (crit damage minus 100%), crit rate capped at 100%. All three were already modeled.
- **Vorpal Butterfly's +200% above 70% HP is active on the infinite-HP Hachiman.**
- **Damage to the Daisoujou idols does not score.** Already modeled.
- **Hachiman at T2 start**: Lovesick x15 ("take set amount of dmg every turn"), Damage Taken Up x4 at 10% each, the composition Special Effect (+20% final damage taken, -60% final damage dealt), Berserk x2. No Defense-down row was visible; whether the list scrolled is open.
- **Berry at T2 start**, effects the model never had: Scythe of Obsession +41.5% dmg (weapon), Legendary Diva +34.3% crit dmg, Creation & Reconciliation +12% dmg, Perseverance & Sorrow +16% continuous dmg, One-Winged Butterfly x2 (+25% dmg, +25% crit dmg, 1 turn), Sorrow +20% dmg (2 turns), Sparkling Flower Basket +19% Atk (1 turn), Two Masks at 71.1%, and Matarukaja IV still showing after Wonder's T1 Persona switch. The four permanent ones are applied (`OBSERVED_T2_STATUS_EFFECTS`); the timed ones have unknown triggers and are not modeled. Joker later confirmed Auto-Mataru IV lasts only while Dionysus is out, so the engine removes it on a Persona change and the T2 capture is recorded as an unexplained exception.
- **MIKU Labor 4-set** (party HP/ATK/DEF +8%) and **J&C Reconciliation 4-set** (in-combat HP/ATK/DEF +15%) are applied as adapters for the members whose panels do not already include them (Berry and Wonder).
- **Reference-only catalog skills bridged from tooltips**: Rakunda 42.7% Defense down for 3 turns, Venomous Spiral +17.6% damage taken for 3 turns, Tarukaja 17.1% plus 1.4% per 500 Wonder Attack. Vasuki is selectable in the browser again.

## Model changes made this pass, Hachiman path only

Authorized by Joker ("go ahead if it makes sense; apply the change that most aligns with the recording's damage"). Each was checked against every isolated recorded interval, not the final score.

1. **Vorpal Butterfly's "+200% skill damage" adds into the damage bucket** rather than tripling the skill power. A pure single-bucket form (continuous-damage bonuses added too) fit T1 but dropped T3 Berry S3 to 0.60x; keeping the continuous-damage multiplier separate fits both.
2. **Chain 2 conversion applies to skills and their repeats, not the Highlight.** The text says "skill damage"; excluding the Highlight lands the T2 Highlight at 0.99x.
3. **Lovesick ticks were made flat, then retracted.** The T1 remainder after Joker's Two Masks (83,000), Gun (26,396) and Berry hit (431,626) is 16,840, and 15 stacks x 18% x 6,057 unbuffed Attack = 16,354 fit it. A later T6 capture of a single 2,043,037 Lovesick activation showed the flat form is wrong beyond T1; the Lufel per-stack snapshot is the default again (`per_stack_snapshot`), the flat forms remain what-if options, and the early tick size is the open item.
4. **Hachiman Defense uses base 821 x 258.4%**, model `1400 / (1400 + base x (coefficient - reduction sum) x (1 - pierce))`, reductions subtracting from the coefficient as the calculator shows.
5. **Two Masks (Luck + Service) foe Defense-down has its own id** and stacks with Rakunda. It previously shared Rakunda's id and overwrote it at T5, dropping Rakunda a turn early.

Rakunda itself is correct: 42.7% for 3 turns, counting down after each Hachiman action and each Concert round, so the T1 cast covers Berry's T1 to T3 actions and the T4 cast covers T4 and T5.

## Results against the recording

Checkpoints are cumulative weighted points (T1 x0.5, T2 x1, T3 x1.5, T4+ x2), Concert damage keeping the weight of the normal turn it interrupts.

| Checkpoint | Recorded | Simulator | Ratio |
| --- | ---: | ---: | ---: |
| T1 | 278,933 | 272,822 | 0.98 |
| T2 | 5,844,450 | 4,845,036 | 0.83 |
| T3 | 20,455,968 | 15,935,199 | 0.78 |
| T4 | 46,411,896 | 30,923,281 | 0.67 |
| T5 | 107,082,856 | 89,857,311 | 0.84 |
| T6 | 663,128,512 | 493,992,085 | 0.74 |
| T7 | 726,403,712 | 504,210,529 | 0.69 |
| T8 | 762,576,512 | 523,835,915 | 0.69 |

Isolated intervals, raw damage (score deltas divided by the turn weight):

| Interval | Recorded | Simulator | Ratio |
| --- | ---: | ---: | ---: |
| Opening Two Masks as One | 83,000 | 77,747 | 0.94 |
| T1 J&C Gun | 26,396 | 24,780 | 0.94 |
| T1 Berry Vorpal Butterfly on Hachiman | 431,626 | 439,449 | 1.02 |
| T1 Lovesick tick | 16,840 | 16,435 | 0.98 |
| T2 Berry Highlight plus triggers | 1,095,454 | 1,082,984 | 0.99 |
| T2 Berry S3 | 3,183,626 | 3,302,460 | 1.04 |
| T3 Berry S3 | 7,430,993 | 6,615,631 | 0.89 |
| T3 Marian Beach Basket | 90,386 | 67,421 | 0.75 |
| T2 J&C S1 (two resisted hits) | 55,357 | 186,770 | 3.37 |
| T3 J&C S2 plus Two Masks | 464,063 | 710,390 | 1.53 |
| T4 (Berry S3 dominated) | 12,977,964 | 7,542,000 | 0.67 |

T6 intervals, weighted points:

| Interval | Recorded | Simulator | Ratio |
| --- | ---: | ---: | ---: |
| Berry ordinary Highlight and triggers | 56,883,576 | 21,465,814 | 0.38 |
| Berry free Highlight and triggers | 59,979,760 | 25,837,924 | 0.43 |
| Berry Alt S3 through Concert finish | 437,539,040 | 354,279,388 | 0.81 |
| J&C S1 | 991,664 | 2,023,254 | 2.04 |
| Marian Beach Basket | 651,616 | 248,960 | 0.38 |

Defense 364, which Joker asked to see, raises the projection to 4,916,444,928 but inflates the exactly known early hits (T1 boss hit 1.38x, T2 Highlight 1.27x, T2 S3 1.37x) that 821 reproduces within 4%. Under either value the T6 Highlights stay at a third to a half of the recording. The default is 821 pending Joker's call.

## What the results say

- Inputs and the T1 to T2 structure are validated: five different hits from Joker's readings land within 6% with nothing tuned.
- The shortfall builds from T3 and peaks in Concert. The game's Berry Highlight grows 27x from T2 to T6 while the simulator's grows about 9x. That is a missing Concert-time state or effect, or a buff the model expires too early, not a constant and not Defense.
- J&C's Mask hits run 1.5x to 3.4x high on every turn. They are under 2% of the score and are parked.
- Marian's Beach Basket runs 0.4x to 0.75x; small share.

## Unresolved

- One-Winged Butterfly, Sorrow and Sparkling Flower Basket triggers; Two Masks 71.1% displayed against 61.3% from Desire Level 120; MIKU Feel the Beat values at 1.15x their level-13 caps; Berry's displayed +270.2% crit conversion at T2 start against 217.7% computed.
- Whether Hachiman's T2-start status list scrolled (Rakunda row).
- Idol Defense (does not score).
- Both Berry and Marian at 180 SP.

## Evidence that would close T6

1. Berry's status list at the moment of her first T6 Highlight, captured the same way as T2.
2. The displayed damage of both T6 Highlights.
3. Any Lovesick activation number shown during those Highlights.
4. If available, Berry's status list before her T4 S3.

## T6 evidence: Skill Amplification and Lovesick snapshots (later on 2026-09-06)

Joker captured Berry's full status list during a later Hachiman Concert turn (a different run from the recording; `data/hachiman-t6-status-2026-09-06.json`) plus three hit numbers: a single Lovesick activation of 2,043,037 (critical, weak), a Highlight of 3,883,836 (critical), and a later 20,713,792 critical. He also reported the Neverending Song beam at about 171M, equal to the Concert window's total damage, which is how the engine's echo already works.

Two model corrections followed:

1. **Skill Amplification scales buff values.** Every buff cast while "Two Masks As One: +17% Skill Amplification" was active shows 1.17x its base: Universal Theoria 33 to 38.6 Atk and 22 to 25.7 dmg, Summer Garden 45.5 to 53.2, Marian Highlight and medicine crit dmg 24.4 to 28.6, Tarukaja 28.5 to 33.3, Two Masks crit dmg 27.2 to 31.6. Gentle Sea Breeze, cast before the amplification, stayed at 48.8. MIKU's values are 1.34x, which is 1.17 times the 1.15 residual seen at T3. The engine now scales skill, Highlight, medicine and navigator buff values by the caster's amplification at cast time (Hachiman path; `amplifiedSkillStatus`). Navigator scope uses the highest party amplification, an assumption. After the change the simulator's T6 values match the capture exactly where the cast order is the same: Theoria 38.6 / 25.7, Summer Garden 53.2, Marian Highlight 33.2 / 28.5, Tarukaja 33.1.
2. **Lovesick activations carry the buffed snapshot, not a flat amount.** A 2,043,037 critical activation is 120x the flat T1 form, so the flat model fit T1 by coincidence and is retracted; the Lufel-sourced per-stack snapshot is the default again (`per_stack_snapshot`; the flat forms and a no-bucket form remain what-if options). In the captured run the activation was 0.53x the Highlight; the simulator's T6 ratio is 0.84x, the no-bucket form would be 0.10x, so the full snapshot is the closer of the three.

Also confirmed by the capture: the Highlight showed the CRITICAL banner (normal criticals for Highlights), the displayed "+535.4% final dmg" equals the 635.4% crit multiplier minus 100% at a crit rate above 100%, Blossoms by the Beach reads 57% with three Potent Medicine types (already modeled), and Scythe of Obsession had grown from 41.5% to 64% (its scaling is unknown; the 41.5% is used).

Result: `outputs/hachiman-amplification-2026-09-06.json`, projected `(806,428,435 + 125,000) x 8 = 6,452,427,480` against 6,101,612,096 (1.058). This is the first run where the Concert turn is reproduced: T5 1.01, T6 1.13, T8 1.06, and the two T6 Highlights 1.13 and 1.12, the Concert S3 finish 1.16.

| Checkpoint | Recorded | Simulator | Ratio |
| --- | ---: | ---: | ---: |
| T1 | 278,933 | 370,297 | 1.33 |
| T2 | 5,844,450 | 7,672,368 | 1.31 |
| T3 | 20,455,968 | 22,200,839 | 1.09 |
| T4 | 46,411,896 | 42,612,699 | 0.92 |
| T5 | 107,082,856 | 108,025,377 | 1.01 |
| T6 | 663,128,512 | 750,109,391 | 1.13 |
| T7 | 726,403,712 | 778,197,935 | 1.07 |
| T8 | 762,576,512 | 806,428,435 | 1.06 |

The early turns are now high because the restored snapshot ticks are large at T1 and T2: the T1 Berry hit plus tick reads 1.45x and the T2 Highlight plus its three triggered activations 2.38x, while the recorded T2 interval leaves under 100,000 for those activations. Lovesick's early amount is the open question: the snapshot form fits T6 and the flat form fit T1, and no single form yet fits both. J&C's Mask hits (1.5x to 3.4x) and Marian's Basket (0.75x) are unchanged and small.

## Variant route (Joker's later run)

Joker's later run swapped J&C's T1 Gun and T2 S1, moved Marian's Highlight to T2 and Berry's to T3, with Berry's fired during Marian's turn right after DOT-Up and before Beach Basket. It is scripted as `HACHIMAN_VARIANT_ROUTE` in `src/hachiman-recorded-team.js` and runs with `node scripts/compare-hachiman-opening.mjs all --seed=8 --route=variant` (`outputs/hachiman-variant-route-2026-09-06.json`). It resolves legally through T8.

| Checkpoint | Recorded route (sim) | Variant route (sim) |
| --- | ---: | ---: |
| T1 | 370,297 | 488,247 |
| T2 | 7,672,368 | 3,751,526 |
| T3 | 22,200,839 | 23,967,389 |
| T4 | 42,612,699 | 45,607,455 |
| T5 | 108,025,377 | 110,523,579 |
| T6 | 750,109,391 | 752,111,039 |
| T8 | 806,428,435 | 808,430,083 |
| Projected score | 6,452,427,480 | 6,468,440,664 |

In the simulator the two routes are a wash: the variant gains on T1 (J&C S1 is worth about three Guns) and T3 (Berry's Highlight with DOT-Up and Marian's Highlight buffs already on her) and loses the same amount on T2, then both enter Concert in the same state. No game score for the variant run has been supplied yet, so it is not a calibration point.

## Rotation search on the current model

`scripts/optimize-hachiman.mjs` takes the recorded route as the baseline and varies seventeen decision points (J&C's T1/T2 opener order and T4/T8 opener, early Highlight ownership and timing, Wonder's skill on T2/T6/T7/T8, Marian's medicine on T3/T4/T5/T6/T8 from Attacker Tablet, Fighter Salve, DOT-Up and HL-Up, Marian's skill on T2/T6/T7, Berry's T7 action), plays every candidate through the same engine, discards illegal ones, and runs a single-change sensitivity table plus coordinate descent with restarts. Report: `outputs/hachiman-optimizer-2026-09-06.json`. One candidate takes about 20 ms.

Result on seed 8: best 6,635,600,104 against the recorded route's 6,452,427,480 (+2.84%), with four changes:

1. Marian's Highlight on Berry at T2, Berry's Highlight at T3 during Marian's turn after DOT-Up (Joker's swap). Alone: +38.3M points (+0.6%).
2. Wonder casts Universal Theoria on Berry at T2 instead of Revolution. Alone: +6.8M.
3. Marian uses Beach Basket at T2 instead of Summer Garden. Alone it is -102.7M, but with the Highlight swap it is worth about +120M: Bewitching Blossoms lands before the T2 S3 and the T3 Highlight, and Beach Basket at T3 refreshes it.
4. Berry casts a plain S3 at T7 instead of the Alt S1. Alone: +7.5M.

Everything else recorded is already the best option among the alternatives tried: every medicine substitution loses 10M to 536M (the recorded DOT-Up, Fighter Salve, Attacker Tablet, DOT-Up sequence also maximizes Blossoms by the Beach's per-medicine-type Attack), Tarukaja at T6 and Theoria at T7 beat the alternatives, Venomous Spiral at T8 beats another buff, and swapping J&C's Gun and S1 order costs 6.6M. Marian S2 at T7 and J&C Gun at T4 make later actions illegal (no prescriptions for the T8 medicine; the mask alternation).

Caveats: the model reproduces the recorded run at 1.058x overall with T1 and T2 at 1.3x, so differences under about 3% are inside its error; the search covers only the listed decision points (Showstopper timing, Berry's Alt S3 placement and MIKU's songs are fixed as recorded); seed 8 only, and Highlights use ordinary critical rolls.

## Rotation search, seed-averaged correction

Joker questioned the Beach Basket at T2 recommendation, since Summer Garden gives a large damage bonus for T2 to T4. He was right: Summer Garden at T2 is worth 3.3M more points over T2 to T4, and the 19M swing the search saw in Concert came from Lovesick critical rolls landing differently on seed 8, not from mechanics. Re-evaluated over 40 seeds (seed-to-seed spread about 2.5%):

| Change | Mean vs recorded route |
| --- | ---: |
| Marian Highlight T2, Berry Highlight T3 after DOT-Up | +3.66% |
| Same plus Theoria on Berry at T2 | +3.85% |
| Same plus plain S3 at T7 | +3.97% |
| Same plus Beach Basket at T2 | +4.02% |
| Same plus J&C S1 first | +3.76% |
| Theoria at T2 alone | +0.09% |
| Plain S3 at T7 alone | +0.12% |
| J&C S1 first alone | -0.09% |
| Beach Basket at T2 alone | -0.18% |

The Highlight swap is the only robust improvement. Theoria at T2, plain S3 at T7 and Beach Basket at T2 are all inside the noise, so Summer Garden stays at T2. `scripts/optimize-hachiman.mjs` now averages over seeds by default (`--seeds=N`, 24 by default; `--seed=8` for a single seed) and only adopts a change that beats the current route by more than 0.25% of the baseline.

## T7 and the Alt S1 (Joker's question, later on 2026-09-06)

Joker asked whether Berry's T7 Alt S1 was chosen to keep the once-per-battle Alt S3 for Concert, and whether a plain S3 at T7 would be better. Itemizing T7 exposed two things.

- **Bug fixed:** Vorpal Butterfly's "+200% above 70% HP" check read Hachiman's tracked HP, which the engine decrements even for the infinite-HP score target, so after about 30M cumulative damage the bonus silently stopped applying. Both T7 Alt S1 hits were missing it. The check now treats an infinite-HP target as full HP, as Joker confirmed in game. T7 moved from 28.1M to 30.6M points; projected `6,470,161,224` (`outputs/hachiman-highhp-fix-2026-09-06.json`).
- **T7 is the weakest turn in the model:** recorded 63.3M points against 30.6M simulated (0.48x), while T8 is 0.78x and every other turn is within 0.9 to 1.3. T7 is J&C S2, Theoria, J&C Highlight, Marian S3 and Berry's Alt S1 (two Vorpal Butterfly hits at about 2.9M each in the model) plus a Lovesick tick. If the game's two Alt S1 hits are each several times the model's, the "+200% skill damage" clause is larger than the bucket term the T1 fit produced. That would reconcile with T1 only if the T1 boss hit (a kill-reset reactivation) did not receive the clause, which is unverified. The displayed damage of the two T7 Vorpal Butterfly hits would settle it.

On the rotation question itself: in the current model a plain S3 at T7 is +0.12% over the Alt S1, inside the noise, so the model cannot separate them; the recorded T7 says the game's Alt S1 is much stronger than the model's, which favors keeping it.

## Auto-Mataru IV correction (Joker, later on 2026-09-06)

Auto-Mataru IV stays active only while Dionysus is the active Persona. The removal-on-switch rule is restored; the T2-start capture that still showed Matarukaja IV after the T1 switch is an unexplained exception. Recorded route: `(806,142,313 + 125,000) x 8 = 6,450,138,504` (1.057), checkpoints T1 1.27, T2 1.26, T3 1.07, T4 0.91, T5 1.01, T6 1.13, T8 1.06 (`outputs/hachiman-mataru-2026-09-06.json`). The rotation search result is unchanged: best 6,633,345,464 (+2.84%) with the same four changes; swapping J&C's Gun and S1 order remains -6.5M because Callous Kindness (A2, +30% Attack for 2 turns on gaining the Mischief Facade) then expires before Berry's T3 S3. Whether A2 also triggers on the Service Facade is unverified; if it does, that swap turns slightly positive.

## Devourer of Dreams (DOD) Hachiman, 2026-09-09

Joker supplied Sleepy's all-A6 DOD rotation (recorded 9,565,851,160) and the DOD rules: HP capped at 410,000 before the break, HP Lock only prevents HP going under 1, the break opens when HP reaches 0 with the lock off, break damage scores 3x, shields work normally, turn limit 120. Berry's panel for that account: 5,127 ATK, 52.4% crit, 242.9% crit mult, 9.7% Pierce, 45.7% Damage Mult. Twins run Mischief (F/I) and Absurdity (P/N, per Lufel's J&C page); Twins Harmony + Victory, Marian Trust + Power, MIKU Integrity + Labor.

Implementation: `isHachimanLive()` now gates the Hachiman kit and damage rules for both modes while Dreamscape keeps its turn-weighted scoring; DOD Hachiman gets a 410,000 finite HP with a boss-only lock floor, a break that starts when HP reaches 0 with the lock off, infinite HP and 3x points for two boss turns not counting the break-opening turn's boss action, a 120-turn limit, DOT-Up and HL-Up as ordinary items, and a points-only score model. The route lives in `src/hachiman-dod-route.js`; run `node scripts/run-hachiman-dod.mjs --seed=8` (`outputs/hachiman-dod-sleepy-2026-09-09.json`).

Sleepy's result screen (supplied 2026-09-09) fixes the score model: Base Damage Points 405,499 + Weakened Damage Points 1,195,200,896 + Boss Attack Points 125,000, x8 = 9,565,851,160, so DOD uses the same x8 and 125,000 as Dreamscape, and the break dealt 398,400,299 raw. Result on seed 8: the route resolves through B4 and the battle ends on the second Weakened boss turn. Pre-break damage 410,000 (the cap; Sleepy 405,499), break damage 279,374,974 scored 3x, 838,534,922 points, **projected (838,534,922 + 125,000) x 8 = 6,709,279,376** against 9,565,851,160 (0.70x). The whole gap is the break: the simulator's break damage is 0.70x of Sleepy's. The shield track matches Sleepy's notes turn for turn (5 after T1, 3 after T2, 2 at T5, 0 at T6, the T9 down, 5 at T11, 4 at T12, 2 at T15, 1 at T17, 0 and the break at T18).

| Break round | Points |
| --- | ---: |
| T18 (break opens on Berry's S3) | 17,956,438 |
| B1 (Showstopper, Theoria, Marian Highlight, S3) | 76,013,811 |
| B2 (J&C Highlight, Matarukaja, Berry Highlight, free Highlight, Alt S3) | 679,119,081 |
| B3 | 27,953,298 |
| B4 | 37,082,295 |

Assumptions and gaps (all listed in `SLEEPY_ASSUMPTIONS`):
- J&C, Marian, Wonder and MIKU stats are Joker's panels, not Sleepy's; Berry's HP, Defense and Speed are Joker's.
- The Dreamscape stage effects and the composition +20% final damage taken are assumed to apply in DOD.
- The lock is on from T1 in the script because the model's T1 Berry hit is inflated by the known early Lovesick overshoot and would break the boss on turn 1; in the game the lock is off at T1 and Berry's hit is about 300,000. The 410,000 cap makes the pre-break points identical.
- Sleepy's "Item + skill" pairs are read as Marian's free Potent Medicine; only the second B2 item (HL-Up) is an ordinary item. "Takemedic" is read as DOT-Up on Berry.
- "Guard or Heal" rounds use Guard for everyone.
- The engine's Highlight gauge was 24 points short for J&C's B2 Highlight; the runner topped it up once and reports it.
- J&C's B3 "A6 button" press is skipped: the engine's True Desire recharge (8 Wonder normal-turn actions) has not restored a stack since the T18 spend.
- Victory set4 (25% chance extra hit) and Power set4 (+10% Attack per 6 turns, up to 3 stacks) are not modeled; the latter is worth up to +30% Attack on Marian by the break.

Joker confirmed the other members should run on his own panels (already the case), so the break gap is a model or route-reading question, not a stats one. The break's largest simulated packets, for comparison against Sleepy's recording:

| Round | Packet | Damage |
| --- | --- | ---: |
| T18 | Berry S3 bonus hit after the break opened (the main hit's overflow past 0 HP is discarded) | 4,613,524 |
| B1 | Berry S3 main (critical) | 18,089,462 |
| B2 | Berry Highlight (critical) and its three Lovesick activations | 10,111,005 + 1.6M + 7.4M + 7.8M |
| B2 | Berry free Highlight (critical) and its activations | 9,969,414 + 1.5M + 7.7M + 7.7M |
| B2 | Berry Alt S3, both casts | 15,055,438 + 4,045,982 + 15,935,126 + 4,275,513 |
| B2 | Neverending Song beam (equals the Concert total) | 125,855,482 |
| B3 | Berry S3 main | 6,480,815 |
| B4 | Berry S3 main | 6,521,706 |

Open modeling question: the S3 that opens the break at T18 only "deals" the boss's remaining 1 HP in the model and its overflow is discarded, so only the bonus hit and tick (17.96M points) score that turn. If the game credits the breaking hit's overflow at 3x, that turn is worth about 45M more points.

### Sleepy's video, per-round readings (2026-09-09)

Read from the in-battle Total Score (points before the x8) in Sleepy's guide video (youtube.com/watch?v=B4WY-IU7Nnc; the full Hachiman run starts about 10:20, after an overview segment). The beam banner reads 171M, matching Joker's note.

| Checkpoint | Game points | Simulator points | Ratio |
| --- | ---: | ---: | ---: |
| Before the break (79 actions) | 401,445 | 409,999 | 1.02 |
| After the break-opening turn (T18, 82 actions) | 9,050,941 | 18,366,437 | 2.03 |
| After B2 including the beam (83 actions) | 1,029,184,763 | 773,499,329 | 0.75 |
| After B3 | 1,130,563,835 | 801,452,627 | 0.71 |
| Final points (result screen) | 1,195,731,395 | 838,534,922 | 0.70 |

Per round: game T18 8.65M, B1 + B2 (with beam) 1,020.1M, B3 101.4M, B4 65.2M; simulator 17.96M, 755.1M, 28.0M, 37.1M. The beam equals the Concert damage, so the Concert rounds dealt 171M raw in the game against 125.9M simulated (0.74x); B3 is 0.28x and B4 0.57x.

Readings:
- The post-Concert rounds are the worst, the same pattern as the Dreamscape T7 miss (0.48x). B3 in the game includes J&C's "A6 button + S1", an enhanced Two Masks (+71.1% party damage, +17% Skill Amplification, the eight-hit nuke) that the simulator skipped because its True Desire recharge (8 Wonder normal-turn actions, Concert turns excluded) had not restored a stack since the T18 spend. Sleepy pressing it at B3 means the recharge rule as modeled is too slow.
- The break-opening turn is over-credited 2x: the game gained 2.88M raw at 3x after the S3 that opened the break, the simulator 5.99M (the S3's 10-stack bonus hit plus a Lovesick tick). Either the bonus hit does not score at 3x on the opening turn or the Weakened multiplier starts later than modeled.
- Concert itself is 0.74x, in line with the Dreamscape Concert being modeled to within 13% on Joker's own run but with Sleepy's other members on Joker's stats.

Under the same model the Dreamscape recorded route still projects 6,470,161,224 and the Nexus benchmark still reproduces 3,642,530,108.

### Two rules from Joker and one bug fix (later on 2026-09-09)

Rules applied, both scoped to live Hachiman (Dreamscape and DOD):
- True Desire (A6) recharge: every counted party action advances the clock, Concert turns included, on an 8-action period (Joker confirmed from Sleepy pressing the button at T1, T18 and B3). Other encounters keep the Wonder-only clock their benchmarks were built on. Highlights and switches still do not count.
- DOD break-opening turn: the boss debuffs do not count down at the end of the turn that opens the break, so Rakunda and the Two Masks Defense-down last one round longer into the break.

Bug fixed: J&C's automatic Two Masks as One never fired at B1 in DOD because its target check treated the Weakened boss (tracked HP 0, infinite effective HP) as dead. A Weakened boss is now eligible, so the T18 prime is consumed at B1 and the B3 A6 button press becomes legal.

Seed 8 result: 1,534,904,486 points, projected (points + 125,000) x 8 = 12,280,235,888 vs Sleepy's 9,565,851,160 (1.284x). The model has moved from 0.70x under to 1.28x over, and the excess sits in the Concert rounds.

| Checkpoint | Game points | Simulator points | Ratio |
| --- | ---: | ---: | ---: |
| Before the break | 401,445 | 409,999 | 1.02 |
| After T18 | 9,050,941 | 14,250,572 | 1.57 |
| After B2 including the beam | 1,029,184,763 | 1,404,375,920 | 1.36 |
| After B3 | 1,130,563,835 | 1,476,931,508 | 1.31 |
| Final | 1,195,731,395 | 1,534,904,486 | 1.28 |

Per round (points): game T18 8.65M, B1 + B2 1,020.1M, B3 101.4M, B4 65.2M; simulator 13.84M, 1,390.1M, 72.6M, 58.0M. Concert raw is now 231.7M against the 171M beam (1.35x, was 0.74x). B3 is 0.72x (was 0.28x) with the A6 nuke and enhanced Two Masks in place; B4 0.89x.

Attribution of the Concert change (same seed, freeze on vs off): the debuff freeze alone adds 61M raw at B2 (417M vs 356M) and 168M points overall; the rest of the swing is the auto Two Masks firing at B1 (Down, +10% damage taken, and the Facade effects) and the B1 A6 nuke. So the debuff freeze plus the Two Masks Defense-down and Rakunda staying up through B2 overshoot the beam by a third. Candidates, none tested: the Two Masks Defense-down and Rakunda may not stack as modeled, the freeze may apply to Rakunda only, or Sleepy's J&C and Marian on Joker's panels overstate the Concert contributions. The T18 over-credit (1.57x) is unchanged in kind: the break-opening turn scores the S3 bonus hit and tick at 3x in the model.

Dreamscape recorded route unchanged at 6,470,161,224; Nexus benchmark unchanged; suite 183 of 183; build passes. Two True Desire tests were rewritten to the party-action rule.

### Buff count at B2 and the Concert double count (later on 2026-09-09)

Joker asked for every buff on the B2 Alt S3 hit to be counted and the hit recalculated. The simulator carried 21 damage-bonus terms (sum 6.82), 21 attack terms (+623.8% with the passives), a defense reduction of 152.6% (Lovesick 45%, Two Masks Defense-down 64.9%, Rakunda 42.7%) against the 258.4% coefficient, pierce 35.6%, and a critical multiplier of 5.48 from ten crit-damage terms.

Checked against Joker's mid-Concert T6 status list (the only direct capture of a Concert stack), the MIKU song effects were double counted: the game shows one Feel the Beat ATK, one Clear Sound DMG, one Play-With-Fire crit damage and one Spring Storm weakness entry, while the simulator stacked the regular song copy and a Concert copy of each (attack +30.5%, damage +18.3%, crit damage +22%, weakness +5.9%, and the Setlist attack entries twice over). Fix: a Concert copy now refreshes an active regular copy instead of adding to it (`regularId` on the Concert buffs), scoped to live Hachiman so the archived Nexus benchmark stays as recorded.

Effect on the same seed:

| Route | Before | After | Game |
| --- | ---: | ---: | ---: |
| DOD points | 1,534,904,486 | 1,284,384,386 | 1,195,731,395 (1.07x) |
| DOD B1 + B2 points | 1,390.1M | 1,139.6M | 1,020.1M (1.12x) |
| DOD Concert raw vs beam | 231.7M | 189.9M | 171M (1.11x) |
| Dreamscape projected | 6,470,161,224 | 5,352,862,680 | 6,101,612,096 (0.88x) |
| Dreamscape cumulative after the Concert turn | 750.1M | 640.8M | 663.1M (0.97x) |

The Concert itself is now within 3% on Joker's run and 11% over on Sleepy's. The remaining gap has moved to the post-Concert turns: Dreamscape T7 + T8 score 99.4M in the game against 28.2M simulated, and DOD B3 is 0.72x, B4 0.89x. The earlier 1.06x Dreamscape agreement was the Concert over-count masking that shortfall.

Other items from the count, unresolved: Marian's Blossoms by the Beach reads +57% ATK in Joker's list but +12% in the simulator; the three persona ATK-ups (Tarukaja, Matarukaja, Universal Theoria) coexist as separate buffs, which the T6 list supports for Tarukaja plus Theoria but does not test for Tarukaja plus Matarukaja; the Dreamscape stage effects (+30% continuous, +20% Curse, crit conversion, +20% final damage taken with a Guardian or Medic) are assumed in DOD and not yet read from Sleepy's video.

### DOD rotation search and the two set questions (later on 2026-09-09)

Joker confirmed the DOD stage effects are the Dreamscape ones. New search `scripts/optimize-hachiman-dod.mjs` (28 decision points from T16 on: Wonder's Persona skill each round, Marian's skill and medicine each round, Berry S3 versus Alt S3, Showstopper round, J&C Creation & Reconcilation versus Harmony & Victory, MIKU Integrity & Labor versus Hope & Ruin; 12 seeds, 0.25% margin, 481 candidates). Report `outputs/hachiman-dod-optimizer-joker-2026-09-09.json` (Joker's Berry) and the Sleepy-panel twin.

Joker's Berry, Joker's sets, Sleepy's route: 10,094,701,918 mean (min 9.74B, max 10.34B). Best found 10,257,085,686 (+1.6%): Hope & Ruin on MIKU (+1.0%), Rakunda instead of Universal Theoria at B3 (+0.2%) and Rakunda or Theoria instead of Venomous Spiral at B4 (+0.5%). Everything else Sleepy did is either optimal or within noise. Largest losses if changed: Rakunda at T17 (-9 to -10%), Attacker Tablet at T18 (-7 to -8%), Fighter Salve plus Summer Garden at B1 (-6 to -11%), Tarukaja at T18 (-3 to -4%), DOT-Up at B2 (-3.5 to -4.8%), plain S3 instead of Alt S3 at B2 (-15.5%).

Set questions. Creation & Reconcilation on J&C beats Harmony & Victory by 1.6% under the model (party +12% damage as displayed on Berry's list, plus J&C's own +15% Attack; Victory's set2 is wind only and its set4 extra hit is unmodeled). Hope & Ruin on MIKU is +1.0% when Ruin's +12% own Attack is shared at 20% (about 136 base Attack to each member) and Labor's +8% Attack sits in the additive Attack-buff pool where it is diluted by the +600% of other Attack buffs; if Labor instead multiplied the panel Attack the way its HP term reconciles (11,277 = (8,634 + 1,808) x 1.08), Labor would be worth about 8% and would win. That interpretation is the open point. Ruin set4 does not renew on a navigator.

Not tested: moving the Showstopper to B2 or B3 (the builder keeps Marian's Highlight at B1, which needs the Concert reset), Marian S3 at T16, T17 or B1 (cooldown), a medicine at B3 (none left), and Alt S3 outside B2 (Chains condition).

### Labor's +8% is a stat multiplier, and it reverses the MIKU set answer (2026-09-10)

The open item from the DOD search was how MIKU's Integrity & Labor 4-set applies its "+8% HP, ATK and DEF to all allies". The model had it as an entry in the additive Attack-buff pool, where the +600% of other Attack buffs diluted it to about 1% and made Hope & Ruin look better by 1.0%.

Joker's own in-battle capture settles it. Berry's observed HP and Defense are 11,334 and 1,984 against (panel + navigator share) x 1.08 = 11,277 and 1,960, both within 1%. Defense is a plain stat, so the buff multiplies the stat rather than joining a pool, and the one buff names HP, ATK and DEF together. Attack now takes the same form for units whose panel does not already include it, which is Berry and Wonder; J&C and Marian are read from in-battle panels that already carry their sets. The earlier reading is kept as `hachimanLaborAsBuffPool` for comparison.

The correction was made on the HP and Defense evidence alone, and the recorded routes moved toward the recordings on their own:

| Route | Before | After | Recorded |
| --- | ---: | ---: | ---: |
| Dreamscape recorded route | 5,352,862,680 (0.88x) | 5,681,536,264 (0.93x) | 6,101,612,096 |
| DOD Sleepy route | 1,284,384,386 points (1.07x) | 1,366,367,492 points (1.14x) | 1,195,731,395 |

Both set answers are now settled against the earlier pass. Keeping MIKU on Integrity & Labor beats Hope & Ruin by 5.07%, reversing the +1.0% reported on 2026-09-09; that recommendation is withdrawn. Creation & Reconcilation on J&C still beats Harmony & Victory, by 1.60%.

Re-run of the DOD search on the corrected model (Joker's Berry, 12 seeds, `outputs/hachiman-dod-optimizer-joker-2026-09-10.json`): Sleepy's route scores 10,738,716,986 mean and the best found is 10,804,487,876, only +0.61%. The single change that clears the 0.25% noise margin is a Rakunda refresh in the back half of the break, either Rakunda at B4 (+0.52%) or Rakunda at B3 with Universal Theoria at B4 (+0.61% together). Everything else Sleepy played is optimal or within noise.

## Live DOD run driven through computer use (2026-09-10)

Joker's own Devourer of Dreams attempt was played by the assistant through the game window (screenshots and clicks), following the searched rotation with a few forced substitutions. Result screen: 8,136,960,536 = (405,499 base + 1,016,589,568 weakened + 125,000) x 8. Per-action scores, tooltips, the medicine basket and Joker's Persona slots are in `data/hachiman-dod-live-run-2026-09-10.json`.

Substitutions forced by the live state: Berry was dropping to under 2,500 HP by T6 and T11, so Wonder cast Media instead of guarding at T7, T11 and T13, MIKU used Clear Sound on Heaven at T11, Marian used Defender Tonic at T8 and Takemedic-All V at T13 and T15 instead of DOT-Up. None of these can change the score, because the boss sits at the lock floor from T2 to T18. In the break, Joker's Janosik has no Matarukaja (Tarukaja from Dionysus at B2), Marian had one prescription left at B2 (HL-Up, no DOT-Up), no second Fighter Salve exists, and the A6 button was not available at B3.

Mechanics settled by the run, all now in the engine:
- Guard grants the shared Highlight gauge (+17) like any counted action. The engine gave Guard nothing; this is why the Sleepy replay needed a +24 top-up at B2.
- True Desire recharge is eight of J&C's own counted actions, Concert turns included. Pressed at T1, the button returned at the start of T10 and not before; pressed at T18, it was absent at B3 and B4. The 2026-09-09 party-action rule (which predicts T3 and B3) is withdrawn; Sleepy's B3 press cannot have been a fresh stack under this rule.
- Pre-break points stop at exactly 401,445 with the lock on, in Sleepy's run and Joker's alike, and Base Damage Points read 405,499 in both. So the boss has 405,499 HP and Life Sustainment holds it at 1% (4,054), not at 1 HP; the 410,000 figure was a rounding. The engine now reproduces 401,445 and 405,499 exactly.
- The action that opens the break earns no Weakened credit: the score at the start of B1 was exactly the base. The model's earlier 13.8M at T18 is gone.
- Weakened Turns Left stayed at 2 through both Concert rounds; B3 and B4 were the weakened turns, as modeled.
- Joker's Persona slots: Dionysus Revolution, Universal Theoria, Tarukaja; Vasuki Venomous Spiral, Media, Rakunda; Janosik Tatra Shot, Rakunda, Tarukaja. The DOD config now has a `personaOwner: 'joker'` option and the search uses it for Joker's Berry.
- Marian's Midsummer Prescriptions are finite: 7 in Joker's run (`marianPrescriptions`, default 7 for Joker and 8 for Sleepy's route).
- HL-Up is a Highlight damage buff (+2.5%, +10% more when Marian uses it), not gauge. DOT-Up is +2.5% (+10%) continuous damage for 1 turn. Attacker Tablet +30% ATK, Fighter Salve +25% damage, Defender Tonic +45% DEF, all 1 turn.

Model against the live run, Joker's route replayed with Joker's Berry and slots (`scripts/replay-hachiman-dod-live.mjs`, 12 seeds):

| Round | Live points | Model points | Ratio |
| --- | ---: | ---: | ---: |
| Pre-break (locked) | 401,445 | 401,445 | 1.00 |
| T18 break-opening action | 4,054 | 4,054 | 1.00 |
| B1 | 103,517,104 | 114,480,467 | 1.11 |
| B2 (Concert, with echo) | 807,939,856 | 983,865,739 | 1.22 |
| B3 | 60,756,096 | 48,762,351 | 0.80 |
| B4 | 44,501,512 | 37,693,301 | 0.85 |
| Total points | 1,017,120,067 | 1,185,207,357 | 1.17 |

Per action: Berry S3 at B1 1.06, Berry Highlight 1.15, free Highlight 1.16, Alt S3 with the echo 1.24, Berry S3 at B3 0.78 and at B4 0.83. J&C's hits run 1.25x to 2.66x over (S1 with the enhanced Two Masks 14.0M against 8.5M live, S2 4.4M against 1.6M), the same excess seen in the Dreamscape Mask hits. The pattern is now clean: Berry inside the Concert is 15 to 25% over, Berry after the Concert is 15 to 20% under, J&C is well over everywhere, and everything outside the break is exact.

Search re-run on the corrected model with Joker's Berry and Persona slots (12 seeds, `outputs/hachiman-dod-optimizer-joker-live-2026-09-10.json`): Sleepy's route 10,022,986,604 mean; best 10,179,891,794 (+1.6%) via Venomous Spiral at B2 in place of the Tarukaja fallback, Rakunda at B4 and Beach Basket at B4. The live attempt scored 8,136,960,536 against the model's 9.48B for the route as played (1.17x), so the gap to the search figure is model error, not rotation.

### Medicine correction (2026-09-11)

Joker: A6 Summer Marian does not consume medicine, so the basket is unlimited and the only limit is one use per Marian turn. The 7-prescription reading from the live run is withdrawn (the x2 on her panel is not a remaining-use count) and the earlier 10-use cap is gone; `marianPrescriptions` remains as an optional what-if budget. With the basket unlimited the B4 Fighter Salve is back in the plan. The re-run search (`outputs/hachiman-dod-optimizer-joker-2026-09-11.json`) gives the same answer as before: Sleepy's route 10,022,986,604 mean, best 10,179,891,794 (+1.6%) via Venomous Spiral at B2, Rakunda at B4 and Beach Basket at B4.

### Boss status durations hold while the boss does not act (2026-09-11)

Joker: Rakunda cast at T17 had not fallen off by B4, so re-casting it at B4 is a refresh with no value. The model had expired it before B3, because it ticked the boss's statuses at the end of every Concert round and every Weakened turn, where the boss takes no action. Live Hachiman now holds the boss's durations (and skips the owner-action continuous-damage trigger) whenever the boss does not act: during Virtual Concert rounds and while Weakened. Party statuses are unchanged. This is an evidence rule, not a tuning, and it moved every replay toward its recording:

| Route | Before | After | Recorded |
| --- | ---: | ---: | ---: |
| Joker's live DOD route (model points) | 1,185,207,357 (1.17x) | 1,120,444,516 (1.10x) | 1,017,120,067 |
| per round B1 / B2 / B3 / B4 | 1.11 / 1.22 / 0.80 / 0.85 | 1.04 / 1.13 / 0.94 / 1.02 | |
| Sleepy's DOD route (points) | 1,328,562,679 (1.11x) | 1,231,298,623 (1.03x) | 1,195,731,395 |
| Dreamscape recorded route | 5,681,536,264 (0.93x) | 5,471,888,024 (0.90x) | 6,101,612,096 |

Dreamscape's Concert turn was already slightly under; it drops a little further and the post-Concert shortfall there stands. In DOD the Concert is now 13% over, B3 and B4 are within 6%, and the whole break is within 10%. The B4 Rakunda gain the earlier search reported was an artifact of the early expiry and is withdrawn.

## Validation

Full suite 183 of 183; static build passes; archived Nexus benchmark reproduces 3,642,530,108 exactly with Catch a Wave and 3,433,259,816 without. The browser preset replays the same engine path as the comparison script.
