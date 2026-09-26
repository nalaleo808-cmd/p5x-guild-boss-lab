# Hachiman live rotation checkpoint check - 2026-09-05

## Purpose and boundary

The subsequent delegated damage, Highlight, and loadout review is recorded in `HACHIMAN-NEXT-PASS-2026-09-05.md`. It omits the unsupported live Hachiman 40% minion-break bonus, hardens replay actor checks, and labels the damage trace as approximate. No new battle simulation was run; damage values below remain historical.

### Marian Revelation correction, 2026-09-05

The user confirmed Summer Marian wears Trust + Prosperity and identified its omission as the cause of the Highlight discrepancy. The saved default loadout now migrates once to that pair, preserving subsequent user edits. The app passes both card names to the engine. The checkpoint runner equips the same pair and derives opening Highlight from Prosperity instead of hardcoding 25%.

Local source `vendor/lufelnet-data-source/data/en/revelations/revelations.js` gives Prosperity's four-piece effect as 25% opening Highlight (non-stacking), and Trust + Prosperity as 8% party damage for two rounds after using skills on allies. The latter effect is now implemented in the live profile; its precise live expiry boundary remains unverified and currently uses the existing shared round-end buff clock. The build screen displays the pair effect.

The old runner already supplied 25% opening Highlight manually. Equipping Prosperity therefore replaces that input rather than adding another 25%. The source does not yet establish an extra charge effect explaining the old 93% versus observed 100% checkpoint. The user's causal explanation is recorded pending reconciliation with live card text or charge events; no 7% charge patch was invented.

All simulation values below are historical checkpoints from before this correction. No replay, score comparison, or optimizer was run for this update. A fresh combined validation pass is still needed.

This is a side-by-side checkpoint check for the current Multidimensional Dreamscape Hachiman run. The observed game state and the simulator preview are recorded separately. Simulator damage is a raw deterministic preview. It is not a prediction of the game score.

The supplied score references are approximate guideposts only:

- T1: about 269,142
- T2: about 5,636,643

No simulator value was calibrated to either reference.

## Checkpoint runner

The runner is `scripts/compare-hachiman-opening.mjs`.

```powershell
node scripts/compare-hachiman-opening.mjs opening --compact
node scripts/compare-hachiman-opening.mjs T1 --compact
node scripts/compare-hachiman-opening.mjs T2 --compact
node scripts/compare-hachiman-opening.mjs T3 --compact
```

`opening` stops before the first manual command. `T1` runs the supplied T1 line from a fresh deterministic battle. `T2` replays opening and T1, then attempts the supplied T2 line. `T3` additionally requires T2 to finish and then attempts the observed MIKU song change, Fire S1, and J&C S2. Every named action has a legality guard. A missing actor, skill, target, song, resource, or Highlight stops the requested checkpoint and prints the legal actions at the stop.

The full JSON trace is the default. `--compact` retains the action order, free or counted status, raw damage deltas, key resources, shields, and follow-up events with less repeated state.

## Configuration used

- Mechanics profile: `live-2026-09-04`
- Seed: 8
- Boss and mode: Hachiman, Multidimensional Dreamscape
- Party order: J&C, Wonder, Beachflower Marian, Ichigo Berry
- Awareness: A6 for the four party members and MIKU
- J&C masks: Mischief and Service
- Navigator: MIKU
- Shared Highlight replay inputs: 25% at the observed opening and +17% for each normal counted party action. These are replay observations, not a general charge formula.
- Opening Persona: Dionysus
- T1 Wonder deviation: free switch from Dionysus to Vasuki, then Vasuki Rakunda on Hachiman
- Marian S3 target: Berry, an explicit assumption because the supplied line did not name the ally
- Berry S1 target: the first living add, which is Left Idol A in the local encounter order

The initial Dionysus plan named Rakunda, but the live game showed Revolution at 22 SP, Universal Theoria at 24 SP, and Tarukaja at 22 SP. Rakunda was absent. The live run therefore switched to Vasuki, whose visible skills were Venomous Spiral at 24 SP, Media at 23 SP, and Rakunda at 22 SP. The runner mirrors this corrected route. T2 includes a free switch back to Dionysus before Revolution.

The local catalog marks Vasuki Rakunda as reference-only even though its tooltip supplies 42.7% Defense reduction for 3 turns. The runner locally maps that stated value and the observed 22 SP cost into an executable skill. It does not change the shared engine or catalog.

Dionysus Auto-Mataru IV is also reference-only in the local catalog. The runner applies its stated 9.8% party Attack for 2 turns before opening passives and removes it when Wonder switches away from Dionysus. This is a runner-only adapter.

Seed 8 was selected because it was the first positive seed found in a narrow 1-100 check that makes the simulator J&C Gun roll critical after the opening random-target draw. This conditions the runner for the supplied Gun shield-break requirement. It was not selected by score, total damage, Berry outcomes, or agreement with the live score. The live Gun reduced shield even though its Crit banner did not appear, so this seed condition aligns the checkpoint result but does not explain the live rule.

## Stats and equipment assumptions

Ichigo uses the saved equipped-stat preset from `src/default-presets.js`:

| Stat | Value |
| --- | ---: |
| Attack | 4,927 |
| Defense | 1,494 |
| Max HP | 8,634 |
| Max SP | 100 |
| Speed | 96 |
| Critical Rate | 54.2% |
| Critical Multiplier | 235.5% |
| SP Recovery | 0 |
| Technical Precision | 0 |
| Pierce Rate | 7.5% |
| Down Points | 0 |
| Ailment Accuracy | 3.1% |
| Ailment Resistance | 0 |
| Damage Bonus | 55.9% |
| Damage Reduction | 0 |

No equipped stat screenshots were supplied for J&C, Wonder, or Marian. Their simulator values are local catalog or built-in defaults:

| Unit | Attack | Defense | Max HP | Max SP | Speed | Crit Rate | Crit Multiplier |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| J&C | 241 | 161 | 886 | 100 | 104 | 5% | 150% |
| Wonder | 225 | unavailable in built-in record | 920 | 180 | unavailable in built-in record | 14% | unavailable in built-in record |
| Beachflower Marian | 217 | 146 | 990 | 100 | 104 | 5% | 150% |
| Ichigo Berry | 4,927 | 1,494 | 8,634 | 100 | 96 | 54.2% | 235.5% |

The game showed Berry at 11,334 HP before S1. This closely matches the 8,634 saved value after the opening Service max-HP effect. The simulator records the max-HP percentage as a buff but keeps the displayed `maxHp` snapshot at 8,634, so HP displays are structurally different even though the opening effect is present.

The exact weapons, Revelation cards, Wonder equipped stats, Persona rank details, and food effects are not available to the runner. The all-A6 setting does not make those unknown inputs exact.

## Observed game checkpoints

| Checkpoint | Game state observed |
| --- | --- |
| Before first command | Hachiman infinity target, boss shield 6, four idols, Attack Turns Left 5, Survival Bonus x0.5, Action 06, score 0. J&C SP 100 and shared Highlight 25%. Automatic Two Masks as One resolved before any manual action. |
| After J&C Gun | Next actor Wonder, Action 07, score 13,198, boss shield 5, Attack Turns Left 5, Survival Bonus x0.5, shared Highlight 42%. The Crit banner did not appear. J&C HP changed from 12,682 to 11,682 for an unverified reason. J&C SP stayed 100. No manual S3, Alt, or mask command was used. |
| After Vasuki Rakunda | Next actor Marian, Action 08, score 13,198, boss shield 5, shared Highlight 59%. Rakunda showed 42.7% Defense reduction for 3 turns. Marian SP was 100 before her command. |
| After Marian Gentle Sea Breeze on Berry | Next actor Berry, Action 09, score 13,198, boss shield 5, shared Highlight 76%. Marian showed two flower or prescription resources. No medicine was used. Berry showed 11,334 HP and 100 SP before S1. |
| After Berry S1 on Left Idol A and the next boss Makouha | Next command J&C, Action 11, score 278,933, boss shield 4, Attack Turns Left 4, Survival Bonus x1, shared Highlight 100%. All four idols were gone. J&C SP was 100, Marian retained two flower or prescription resources, Berry had 2 Chains of Love, and Hachiman had 15 Lovesick. One manual S1 input removed all four idols and reduced boss shield from 5 to 4. The user confirmed that live hit priority kills the minions first and then hits the boss. The opening Vorpal Butterfly banner was captured, but the intermediate repeat frames were missed, so the exact order among the four idols and their per-hit damage are unknown. |
| After T2 MIKU Heaven Feel the Beat | Action 11, score 278,933, boss shield 4, support cooldown 4, shared Highlight 100%. Berry's ordinary Highlight on Hachiman was the next planned action. |
| After T2 Berry ordinary Highlight on Hachiman | Action 11 remained unchanged, score 1,374,387, boss shield 3, MIKU support cooldown 4, shared Highlight 0%, and Berry had 3 Chains of Love. Berry showed HP 8,993 of 11,334 and SP 80, confirming T1 S1 cost 20 SP while the Highlight was free. Her active display showed Attack 11,278, Defense 1,984, Speed 98, and SP Recovery 5%. These are battle-state values with buffs and borrowed effects, not replacement base stats. |
| After T2 J&C S1 on Hachiman | Next actor Wonder, Action 12, score 1,429,744, boss shield 3, MIKU support cooldown 3, and shared Highlight 17%. |
| After the free Vasuki to Jano to Dionysus cycle and Revolution | Revolution was cast from Dionysus. Harmony and Matarukaja IV became visible. The intermediate Jano cycle and those visible activations are not represented by the runner's direct Vasuki to Dionysus switch. |
| After T2 Marian S2 | Next actor Berry, Action 14, score 1,429,744, shared Highlight 51%, MIKU support cooldown 1, Marian HP 18,882 with 2 flower resources, and Berry HP 8,993, SP 91, and 3 Chains of Love. |
| Immediately after T2 Berry My Beloved Prince on Hachiman | Action 15, score 4,613,370, boss shield 2, Attack Turns Left 3, and Survival Bonus x1.5. The tooltip showed 22 SP, 296.6% Attack plus 13.6% per Lovesick, a 138.2% Attack bonus at 10 or more stacks, and a Lovesick duration reset. |
| Settled T2 endpoint | Next command J&C at Action 16 and the start of Attack Turn 3, score 5,844,450, boss shield 2, no idols, Hachiman Lovesick 15, shared Highlight 72%, and MIKU ready on Spring Storm. HP was Wonder 7,933, Marian 15,510, J&C 7,096 with 91 SP, and Berry 5,754. MIKU automatically changed from Heaven to Spring Storm at the round boundary. |
| After T3 MIKU song selection and Fire Feel the Beat | MIKU changed from Spring Storm to Play-With-Fire as a free action at Action 16, then used Feel the Beat. Score stayed 5,844,450, shared Highlight stayed 72%, and support cooldown became 4. The selected Fire effect added Expert Track and party Critical Damage. |
| After T3 J&C S2 Service and Admonition on Hachiman | One manual S2 input cost 20 SP and showed its skill banner. The automatic Two Masks as One followed during the same Action 16; no manual S3 or stored True Desire Alt was used. A purple Almighty sphere animation was observed, but its banner was missed. An intermediate frame showed score 6,078,972 at Action 16. The settled next command was Wonder at Action 17, score 6,540,544, shared Highlight 89%, boss shield 2, no idols, and MIKU support cooldown 3. The full party was healed to Wonder 13,455, Marian 19,595, J&C 11,682, and Berry 11,334. |
| After T3 Wonder Vasuki Venomous Spiral on Hachiman | The 24 SP cast advanced to Marian at Action 18. The score remained 6,540,544, boss shield remained 2, shared Highlight reached 100%, MIKU support cooldown showed 2, Wonder had 75 SP, and Marian still had 2 flower resources. |
| After Marian ordinary Highlight on Berry | Marian's Highlight was free and left Action 18 unchanged. It drained shared Highlight from 100% to 0%, granted Berry 28.4% damage and a two-turn critical-damage effect described as 16.66% of Marian's Critical Multiplier over 100, capped at 246.4% Critical Multiplier, and set Marian's next Medicine effect to +11.4%. |
| After DOT-Up on Berry | The medicine was free. Marian's flower resources changed from 2 to 1 while Marian remained the current actor at Action 18 with 75 SP and shared Highlight remained 0%. |
| After Marian Beach Basket S1, before Berry S3 | Berry became current at Action 19 with score 6,676,123, shared Highlight 17%, MIKU support cooldown 1, boss shield 2, and no idols. Berry showed 11,334 HP, 80 SP, and 3 Chains of Love. The complete direct GUI stat capture is recorded below and in `data/ichigo-live-t3-snapshot-2026-09-05.json`. |
| After ordinary Berry S3 and the following boss action | The game showed Action 20, score 17,822,612. Individual S3 hits and their values were missed, so no hit sequence or damage breakdown is inferred. |
| Settled T3 endpoint, start of Attack Turn 4 | Next command J&C at Action 21, score 20,455,968, boss shield 1, no idols, Attack Turns Left 2, Survival Bonus x2, shared Highlight 38%, and MIKU ready on Heaven. HP was Wonder 11,048, Marian 18,202, J&C 10,126 with 82 SP, and Berry 8,334. |
| T4 MIKU song cycle and Clear Sound S2 | MIKU changed from Heaven to Spring Storm as a free action at Action 21, then cast the party-wide Clear Sound S2. Action, score 20,455,968, and shared Highlight 38% were unchanged; support cooldown became 4. The directly read base S2 tooltip says it grants party damage at 0.34% per 100 MIKU Attack, capped at 5,368 MIKU Attack and 18.3%, for 3 turns. When Spring Storm does not hold Critical Track, it also grants weakness damage at 0.11% per 100 MIKU Attack, capped at 5,368 MIKU Attack and 5.9%, for 3 turns, then gains Critical Track. |
| After T4 J&C S1 Fire and Ice on Hachiman | The 20 SP boss cast advanced to Wonder at Action 22 with score 20,706,692, shared Highlight 55%, MIKU support cooldown 3, and boss shield 1. |
| After free Vasuki to Jano switch and Rakunda on Hachiman | The Jano Rakunda cost 22 SP and displayed -42.7% Defense for 3 turns. It advanced to Marian at Action 23 with the same score 20,706,692, shared Highlight 72%, MIKU support cooldown 2, Marian at 66 SP, and one flower resource. |
| After Marian Fighter Salve on Berry | The directly read base tooltip confirms 25% damage for 1 turn. The medicine was free: Marian remained at Action 23 with score 20,706,692, shared Highlight 72%, and 66 SP; flower resources changed from 1 to 0; the medicine button disappeared; and Berry HP changed from 8,334 to 9,945. |
| After Marian S3 on Berry | Marian S3 was ready in T4 after its displayed cooldown was 2 in T2 and 1 in T3. Its 25 SP cast settled with Berry current at Action 24, score 20,706,692, shared Highlight 89%, MIKU support cooldown 1, Marian flowers restored from 0 to 2, and Berry at 9,945 HP and 69 SP. This confirms the tooltip's 25 SP cost and that S3 counted as a turn. |
| After ordinary Berry S3 on Hachiman | One 22 SP input advanced to a boss Action 25, score 45,382,832, Attack Turns Left 1, and Survival Bonus x2. Individual S3 damage frames were missed, so no hit or damage breakdown is inferred. |
| T4 transition after Berry S3 | During the transition, the game showed Action 26 and score 46,411,896 before the next command. The next settled capture remains pending. |
| Settled start of T5 | J&C became current at Action 26 with score 46,411,896, no boss shield badge, Attack Turns Left 1, Survival Bonus x2, and shared Highlight 100%. HP was Wonder 7,668, Marian 14,165, J&C 6,768 with 73 SP, and Berry 5,776. MIKU was ready on Play-With-Fire; Marian Highlight cooldown showed 3 and Berry Highlight cooldown showed 1. |
| After J&C Fire and Ice Highlight | The party effect showed Attack +28.4% and Damage +39.8% for 2 turns. The Highlight was free: Action 26, score 46,411,896, shared Highlight 0%, and J&C SP 73 were unchanged. |
| After MIKU Showstopper activation | The directly read full tooltip says Showstopper consumes three different Tracks, applies Ghost Rule, stops foe turns, and grants two extra party turns that are not counted in total Actions while buff, debuff, and continuous-damage countdowns still tick. On activation, MIKU skill, weapon, and Talent buff durations increase by 2; all previous Track effects reactivate for 2 turns; party Critical Damage becomes 0.34% per 100 MIKU Attack, capped at 5,368 MIKU Attack and 18.3%, for 2 turns; and the party restores 35 SP. Support skills are unusable and support cooldowns do not decrease during Concert. The observed activation left Action 26, score 46,411,896, shared Highlight 0%, Attack Turns Left 1, and Survival Bonus x2 unchanged; Ghost Rule and a queue of two extra rounds appeared; J&C rose to 100 SP; and HP became Wonder 11,245, Marian 19,595, J&C 10,667, and Berry 9,083. |
| J&C Alt during Concert | Power to Resist Ruin settled with Action 26, score 46,411,896, shared Highlight 0%, and J&C SP 100 unchanged. The Alt button disappeared after activation. This confirms availability changed in the observed UI, but does not establish a reversible toggle, stack consumption, or restoration-clock rule. |
| First manual Concert action: J&C S2 Electric and Wind on Hachiman | One 20 SP S2 input was selected on the boss. An automatic S3 sphere with element icons was captured without an S3 input. An intermediate frame showed Action 26 and score 47,425,096. |
| T5 enhanced automatic J&C S3 confirmation | The automatic S3 after the T5 Power to Resist Ruin activation and manual S2 was confirmed as the True Desire-enhanced S3. It had settled by the Action 26, score 52,311,376, Hachiman DOWN checkpoint below. Its exact per-hit values were missed. |
| Settled first Concert action | Wonder became current while Action remained 26, score reached 52,311,376, shared Highlight was 38%, Attack Turns Left 1, Survival Bonus x2, Ghost Rule remained active, and no idols remained. Hachiman showed the DOWN stars and hunched pose. Party HP was Wonder 13,455, Marian 19,595, J&C 11,682, and Berry 11,334; Wonder had 89 SP. Concert's paused Action behavior is confirmed. The source of the 38% Highlight after this first Concert action is unresolved. Exact individual hits and their damage values were missed. |
| T5 Wonder Persona cycle and Universal Theoria on Berry | Wonder cycled Jano to Dionysus as a free switch, then cast Universal Theoria on Berry for 24 SP. The directly read tooltip showed party Attack +33% for 2 turns and selected-ally damage +22% for 2 turns. Marian became current without advancing Action 26, score 52,311,376, or shared Highlight 72%; Marian showed 87 SP and two flower resources. |
| After Marian Attacker Tablet on Berry | The medicine was free: Marian remained at Action 26 with score 52,311,376, shared Highlight 72%, and 87 SP, while flower resources changed from 2 to 1. Marian S3 showed cooldown 2. |
| After Marian S2 Summer Garden | The 22 SP cast advanced to Berry's first Concert turn without advancing Action 26. Score stayed 52,311,376, shared Highlight reached 100%, Marian showed 93 SP, and the party was at full HP: Wonder 13,455, Marian 19,595, J&C 11,682, and Berry 11,334. All four portraits showed ACTION for ordinary Highlight availability. Marian had shown Highlight cooldown 3 at the normal T5 start; this observation does not establish a reset rule. |
| Marian ordinary Highlight on Berry, first Concert turn | Marian's ordinary Highlight was free and left Action 26 and score 52,311,376 unchanged while draining shared Highlight from 100% to 0%. |
| After Berry ordinary S3 My Beloved Prince | The 22 SP boss cast advanced to the second Concert round with J&C current while Action remained 26, score 107,082,856, shared Highlight 38%, Attack Turns Left 1, Survival Bonus x2, Hachiman still DOWN, and no idols. J&C showed 91 SP and 12,682 HP at that round start. J&C later showed 11,682 HP after the following action; the intervening cause was not captured. |
| After T6 J&C S1 Fire and Ice | The 20 SP boss cast advanced to Wonder while Action remained 26, score 108,074,520, shared Highlight 72%, and Wonder had 76 SP. The party displayed full HP: Wonder 13,455, Marian 19,595, J&C 11,682, and Berry 11,334. |
| Wonder Persona cycle and Tarukaja on Berry | Wonder cycled Dionysus to Vasuki to Jano as free switches, then selected the 22 SP Tarukaja on Berry. The directly read tooltip says it increases one ally's Attack by 17.1% plus 1.4% per 500 user Attack, up to 11.4%, for 3 turns. The cast was still resolving at this checkpoint; no base-stat or formula inference is made beyond the tooltip. |
| Resolved T6 Tarukaja on Berry | Marian became current without advancing Action 26, score 108,074,520, or shared Highlight 100%. Wonder had 76 SP, Marian had one flower resource, and Marian's ordinary Highlight cooldown showed 4. |
| After DOT-Up on Berry | The medicine was free. It consumed Marian's last flower resource, leaving 0, while Action 26, score 108,074,520, shared Highlight 100%, and Wonder SP 76 were unchanged. |
| Berry ordinary Highlight interrupt during Marian turn | A Berry ordinary Highlight was used during Marian's turn. The settled state was score 164,958,096, shared Highlight 0%, Action 26 unchanged, Wonder SP 76, and Berry Chains of Love 4. An intermediate damage display was ambiguous and is not recorded as an individual hit. Marian S3 showed cooldown 1. |
| After Marian Beach Basket S1 | The 20 SP cast advanced to Berry while Action remained 26, score 165,609,712, shared Highlight 34%, Berry had 82 SP and 4 Chains of Love, and the party showed full HP. |
| BERRY Double Highlight menu and Alt Highlight | The opened menu showed four entries: S1, S2, S3, and Highlight. The selected Alt Highlight tooltip matched the observed 532% effect, critical Lovesick for 3 turns, all-party continuous damage for 1 turn, and two extra Lovesick stacks. Its boss cast settled on the same Berry turn with Action 26, score 225,589,472, shared Highlight 34%, Berry SP 82, and Chains of Love 5. The Chain counter increased from 4 to 5. The direct T8 Intel reading confirms Chains are unlock thresholds, not a spent currency. |
| BERRY Double Highlight menu after Alt Highlight | On reopening the menu, Highlight was greyed out and unavailable while S1, S2, and S3 remained enabled. |
| BERRY Alt S3 My Beloved Prince on Hachiman | The usual 22 SP tooltip was confirmed and one boss cast was selected. An animation intermediate showed score 289,904,512. Individual repeat and beam damage frames were not fully captured. |
| Concert ended after the second full round | A subsequent captured frame already showed MIKU's Concert finish animation at Action 27 and score 663,128,512. The next settled state had J&C current at the same score, shared Highlight 76%, Attack Turns Left 1, Survival Bonus x2, Hachiman DOWN, no idols, and MIKU Heaven support ready. J&C had 82 SP and 12,682 HP; Wonder 13,455 HP; Marian 19,595 HP; and Berry 11,334 HP with 5 Chains of Love. The two Concert rounds ended with the normal Action transition from 26 to 27. The score change from 225,589,472 to 663,128,512 is not attributed to one hit or beam. |
| T7 MIKU song cycle and S1 | MIKU changed from Heaven to Spring Storm as a free action, then used the party S1. J&C remained current at Action 27 with score 663,128,512, shared Highlight 76%, and support cooldown 4. |
| After T7 J&C S2 Electric and Wind | One 20 SP command was selected. A later animation showed a 563K counter and score 665,160,384. The settled state had Wonder current at Action 28 with the same score, shared Highlight 93%, support cooldown 3, Wonder at 65 SP and 13,455 HP, Marian 19,595 HP, J&C 11,682 HP, and Berry 11,334 HP. No separately legible S3 title or individual hit is confirmed for this T7 command. |
| Free Jano to Dionysus and Universal Theoria on Berry | The free Persona switch and 24 SP Universal Theoria cast advanced to Marian at Action 29 with score 665,160,384, shared Highlight 100%, support cooldown 2, Marian at 67 SP, and no prescriptions. Marian ordinary Highlight cooldown showed 3, Berry ordinary Highlight cooldown showed 3, and J&C Highlight was ready. |
| J&C Fire and Ice Highlight | The party Highlight was free and left Action 29 and score 665,160,384 unchanged while draining shared Highlight from 100% to 0%. |
| After Marian S3 on Berry | Marian S3 was ready and cost 25 SP. It advanced to Berry at Action 30 with score 665,160,384, shared Highlight 17%, support cooldown 1, two prescriptions, Berry 71 SP, and 5 Chains of Love. |
| Settled checkpoint after T7 BERRY Alt S1 | The game was at the T8 J&C turn, Action 32, score 726,403,712, Attack Turns Left 0, Survival Bonus x2, boss shield reset to 6, no idols visible, no DOWN marker, shared Highlight 42%, and MIKU Play-With-Fire ready. HP was Wonder 11,997, Marian 17,856, J&C 9,583 with 73 SP, and Berry 7,723; Marian had two flower resources. A direct T8 Intel view showed Berry at 51 SP, confirming the Alt S1 cost was 20 SP once from the pre-cast 71 SP. Individual Alt S1 repeat frames and the boss response were missed, so this is a combined settled checkpoint with no hit or score attribution. |
| T8 MIKU Play-With-Fire S1 | The support action was free and left Action 32, score 726,403,712, and shared Highlight 42% unchanged; support cooldown became 4. |
| After T8 J&C S1 Fire and Ice | The 20 SP cast advanced to Wonder at Action 33 with score 726,889,024, shared Highlight 59%, support cooldown 3, Wonder 52 SP and 11,997 HP, and other party HP unchanged. |
| After Vasuki Venomous Spiral on Hachiman | The 24 SP cast advanced to Marian at Action 34 with score 726,889,024, shared Highlight 76%, support cooldown 2, Marian 53 SP, and two flower resources. |
| After Marian Fighter Salve on Berry | The medicine was free and left Action 34, score 726,889,024, shared Highlight 76%, and Marian 53 SP unchanged. Flowers changed from 2 to 1; Berry HP rose from 7,723 to 9,334. |
| T8 Item panel before ordinary item | The bottom-right Tab opened the alternate panel with ITEM and GUARD. It showed Item Menu Left 10/10 and visible inventory counts Attack 1, Defense 1, Fighter 1, DOT 11, and Reso 49. Fighter remained at 1 after the free Fighter Salve basket, confirming that basket did not spend item inventory. |
| After ordinary Attacker Tablet on Berry | The ordinary Item menu tooltip showed Attacker Tablet, 30% Attack for 1 turn, on Berry. The cast advanced to Berry at Action 35 with score 726,889,024, shared Highlight 93%, support cooldown 1, Berry 10,945 HP and 62 SP; Marian's flower resource remained 1. The two medicines each healed Berry for 1,611 HP, from 7,723 to 9,334 and then to 10,945. This confirms the rotation can use one free basket medicine and one counted ordinary Item action: the free basket left Highlight unchanged, while the ordinary item increased it by 17%. No SP use was observed for the ordinary item: Marian showed 53 SP before it, but her post-action SP was not visible. The ordinary-item inventory remainder was not read. |
| T8 BERRY S3 and result screen | Berry Persona S1 was greyed out with cooldown 1 after the earlier Alt S1, while S3 was ready at 22 SP. One ordinary S3 command was used on Hachiman. The next capture was already the result screen, so individual S3 damage and end DOT frames were missed. The last pre-S3 score was 726,889,024 and the result's Foe Defense Points were 762,576,512, a combined end-sequence difference of 35,687,488 that is not assigned wholly to S3. |
| Completed live result | Hachiman Challenge, Difficulty NIGHTMARE, ended at 6,101,612,096. The result screen showed Foe Defense Points +762,576,512, Turns Survived 6, Turns Survived Bonus +125,000, and Difficulty Bonus 8. Its displayed arithmetic is `(762,576,512 + 125,000) * 8 = 6,101,612,096`. The supplied T1 through T8 line completed. T5 and T6 Concert comprise six normal rounds plus two extra Concert rounds. The supplied reference 6,663,043,136 is not used as a calibration target. |

The game's Action number includes enemy actions. It must not be compared to the simulator's literal internal counter.

### T3 Action 19 BERRY magnifying-glass snapshot

This is a direct GUI capture from 5 September, with the magnifying-glass view scrolled to the bottom. It is the buffed, borrowed BERRY battle state after Marian's Highlight, DOT-Up, and Beach Basket S1, immediately before BERRY S3. It does not alter or establish a base preset, equipment, Revelation, weapon, or formula value. The machine-readable record is `data/ichigo-live-t3-snapshot-2026-09-05.json`.

| Battle state | Observed value |
| --- | ---: |
| Score | 6,676,123 |
| Shared Highlight | 17% |
| MIKU support cooldown | 1 |
| Boss shield | 2 |
| Idols remaining | 0 |
| Chains of Love | 3 |

| Displayed total | Observed value |
| --- | ---: |
| Attack | 11,444 |
| Defense | 1,984 |
| Max HP / current HP | 11,334 / 11,334 |
| Max SP / current SP | 100 / 80 |
| Speed | 98.8 (compact HUD truncates to 98) |
| Critical Rate | 106.3% |
| Critical Multiplier | 500.8% |
| SP Recovery | 5% |
| Technical Precision / Down Points | 0 / 0 |
| Pierce / Ailment Accuracy / Ailment Resistance | 27.6% / 8.1% / 0% |
| Damage Multiplier / Damage Down | +409.6% / 0% |
| Weakness Multiplier / Weak Attack Down | +0% / 0% |
| Resistance Pierce / Strong Attack Down | 0% / 0% |
| HP Recovery / HP Recovery Taken | 2.7% / 0% |
| Medicine Effect / Medicine Effect Received | 0% / 0% |
| Shield / Shield Received | 0% / 0% |

| Element multiplier bonus | Observed value |
| --- | ---: |
| Physical / Gun / Fire | +5% / +10% / +6% |
| Ice / Electric / Wind | +4.8% / +5.8% / +5.8% |
| Psychic / Nuclear / Bless | +5% / +4.8% / +9.8% |
| Curse / Almighty | +29.8% / +6% |

| Weapon row | Observed value |
| --- | ---: |
| Melee multiplier | 80% |
| Gun multiplier / rounds / accuracy | 36.2% / 3 / 86% |
| Gun critical rate | 18.6% (a separate Gun-row value, not the 106.3% total Critical Rate) |

The same status view showed DOT-Up continuous damage +17.4% for 3 turns; Feel the Beat Attack +35.1% and Critical Damage +25.3% for 3 turns, plus Pierce +12.6% for 2 turns; Summertime Refresh final damage +15% for 1 turn; permanent Special Effect Curse damage +20% and continuous damage +30%; and Lovesick can critical hit for 2 turns.

Additional displayed statuses were Callous Kindness Attack +30% for 1 turn and damage taken -20% for 2 turns; Mask of Mischief Attack +54.5% for 2 turns; Mask of Service damage taken -25% for 3 turns; Two Masks as One damage +71.1% for 2 turns; Summer Garden damage +45.4% for 2 turns; Gentle Sea Breeze Critical Rate +18.2%, Critical Damage +48.8%, and Critical Damage +24.4%, each for 1 turn; and Marian Highlight damage +28.4% and Critical Damage +24.4%, each for 3 turns. The earlier snapshot saw part of A World of Our Own; the full direct T8 Intel reading is recorded below.

The direct Beachflower Minami text remains a 10% DOT-Up base value. This screen showed the applied +17.4% effect, but the source of the extra 7.4% and the sources of other borrowed or stacked totals remain unknown. This snapshot is evidence only and does not predict damage or define a combat formula.

The shared Highlight gauge was 17% before BERRY S3 and settled at 38% at the T3 endpoint. The known raw counted-action increment is +17%, which would yield 34%; the remaining +4% is consistent with a round interval but its source is unverified. The individual S3 hits were missed, so this does not establish an S3-specific gauge rule.

The user directly read J&C's Strict Tolerance A1 tooltip. At battle start J&C gains the two selected Facades. At J&C turn start, or at the end of an action when two Facades are held, Two Masks as One activates once on a random target and prioritizes the previous skill attack target. The actual opening target was not captured. A right-inner idol appeared at low HP with a black-heart marker before the first manual command, which makes an idol opening target plausible but does not confirm it or establish the damage formula. The score still displayed 0 before the first command.

The directly read J&C A6 text adds 20% Desire Level and grants True Desire at battle start. After a spent True Desire, it is regained every 8 actions. At the start of J&C's turn, one True Desire can be spent to enhance the next Two Masks as One. The enhanced action activates every Facade effect and adds eight primary-target hits, one each of Fire, Ice, Electric, Wind, Psychic, Nuclear, Bless, and Curse. Each hit starts at 40% Attack and gains 1% for every point of Desire Level. The current simulator uses an 8-owner-turn clock and does not require the previous stack to have been spent before restoring one. That is an explicit implementation gap because the exact live 8-action clock boundary has not yet been verified.

The user also directly read Berry's A1 Pounding Heartbeat and Talent effects. Pounding Heartbeat reduces Defense by 3% per Lovesick stack and applies one Lovesick whenever Berry uses a skill. Overflowing Love grants 15% Attack per Chain of Love. Melting Ichi-Go Butter increases party continuous damage by 15%.

### Direct T8 BERRY Intel reading

The following text was read directly by scrolling BERRY's live Intel at T8. It is tooltip evidence, not a reconstructed damage formula. Mine Alone has a base Chain cap of 3: the first S1 grants +1 Chain and every Highlight grants +1 Chain. At Chain 1, its target takes +4% damage per Lovesick stack; at Chain 2, all skills gain +15% Critical Rate and continuous damage; at Chain 3, continuous damage gains +25%.

Pounding Heartbeat reduces Defense by 3% per Lovesick stack and adds one extra Lovesick whenever BERRY uses a skill. Power of Love starts with 1 Chain and has a maximum of 5. At 4 Chains it grants +36% Critical Damage. At 5 Chains, the first fatal damage leaves BERRY at 1 HP in a special near-death state and grants 4 Power of Love; at the end of each ally turn, one Power of Love is spent, and BERRY is KO'd when all are spent. Maiden's True Strength gives BERRY permanent +6% Attack for each Highlight, capped at 5.

A World of Our Own A6 raises the Lovesick cap to 15. At 1 Chain it repeats S1 once, at 2 it repeats S2 once, and at 3 it repeats S3 once. At 4 Chains, BERRY may use her own-turn Highlight once without spending the gauge and is not affected by Highlight cooldown. Each of these effects is once per battle. If the original target is defeated, or the skill is nullified, reflected, or absorbed, the effect selects a different target. The text does not describe spending Chains.

The fatal-survival state and A6 retarget exceptions did not trigger in this live pass.

### Direct T8 Battle Intel reading

The top Pause Battle Intel was opened at T8 to read mode-specific text. Challenge Goal states that the goal is to deal higher damage within 6 turns. The subsequent user photo corrects the earlier stack transcription: defeating Daisoujou increases Hachiman's damage taken, stacking up to four times total. It does not grant four stacks per defeat. Damage dealt to Daisoujou is not added to score. The party has +20% Curse damage.

The Intel also says Skill and Resonance damage do not use the normal Critical Damage calculation even when a critical occurs. It presents increased final damage as Critical Rate multiplied by (Critical Damage minus 100%), with Critical Rate capped at 100%. Guardian and Medic party composition means all foes have -60% final damage dealt and +20% final damage taken. When Guardian and Medic are absent, all foes have +60% final damage dealt.

The live panel showed the +20% final-damage-taken and -60% final-damage-dealt effects active, but their trigger is unresolved. The imported role for Beachflower MARIAN is Strategist, consistent with the [Lufel schedule entry](https://lufel.net/en/schedule/) read today. The observed team is Wonder, Strategist MARIAN, Assassin BERRY, and Virtuoso J&C, with no explicit Guardian or Medic. This must not be attributed to MARIAN as a Medic. A selected J&C Mask or Wonder Persona could be relevant, but that is unverified while the requested live text is pending. The current literal role-conditional engine cannot claim live-party parity for this modifier.

The fully scrolled lower Intel lists Make Ready, ranged attack damage +10%; Load, a full reload 2 turns after ammunition is empty; Aim, ranged Gun damage +10%; Fire at Will, additional Gun damage +10%; and Light 'em Up, a reload 1 turn after ammunition is empty. It showed Painting Effect Active with 3 entries and Statue Effect Active with 1 entry, without a displayed formula. Allies have +30% continuous damage. At the end of each turn, foes gain 1 Berserk stack, up to 3; the increased-damage amount was not shown. A second scroll did not change the view, confirming the bottom was reached. These are observed current-battle modifiers, not universal or all-mode rules.

These are direct mode-specific observations, not claims of a universal combat formula.

The full MIKU Feel the Beat tooltip was read during T3. It grants party Attack equal to 0.57% per 100 MIKU Attack, capped at 30.5%, for 3 turns. If the current song's Track is not held, it adds the following song effect and Track for 3 turns: Heaven grants Pierce at 0.2% per 100 MIKU Attack, capped at 11%, plus Break; Spring Storm grants party damage at 0.34% per 100, capped at 18.3%, plus Critical; Play-With-Fire grants Critical Damage at 0.41% per 100, capped at 22%, plus Expert. MIKU's exact live Attack was not captured, so the capped values cannot be assumed.

J&C Service and Admonition S2 showed a 20 SP cost and two primary-target components: 86.7% Electric and 86.7% Wind, each multiplied by Desire Level. It also reduces party damage taken by 11.4% plus another 11.4% per 100 Desire Level for 3 turns. The exact live Desire Level shown at this checkpoint was not captured.

Beach Basket S1 was observed at 20 SP: it heals the party for 75% of Marian's maximum HP and applies Bless as an AOE. Bewitching Blossoms lasts 3 turns and increases incoming Attack damage by 11.4% plus 4% per 1,200 Marian maximum HP, capped at 13,632 maximum HP. Its next observed state is recorded in the post-Basket checkpoint above. Gentle Sea Breeze showed cooldown 2 on T2 and cooldown 1 on T3 after its T1 cast.

The direct Medicine Basket text lists Attacker Tablet as 30% Attack for 1 turn, Defender Tonic as 45% Defense for 1 turn, and DOT-Up as 2.5% for 1 turn or 10% when Minami or Beachflower Minami is present. This does not revise the simulator's existing `getMedicineActions()` behavior, which still presents base one-turn items and the A6 three-turn duration.

At the post-Basket checkpoint, Berry's active DOT-Up status displayed +17.4% continuous damage for 3 turns. That is an applied battle-state value after Marian's Highlight and medicine, not a replacement for the direct 10% Beachflower Minami base text. The source of the extra 7.4% remains unresolved. The same status view showed Feel the Beat Attack +35.1% for 3 turns, Critical Damage +25.3% for 3 turns, Pierce +12.6% for 2 turns, Summertime Refresh +15% final damage for 1 turn, permanent Curse damage +20%, permanent continuous damage +30%, and Lovesick can crit for 2 turns.

## Simulator opening checkpoint

The opening and T1 simulator values below are historical, pre-mode-patch values. They are not the current baseline after the focused live Hachiman Dreamscape patch work.

The targeted opening run completed on the corrected engine behavior.

- Automatic Two Masks as One fired before the first manual action.
- It did not consume J&C SP, the current action, or the stored True Desire stack.
- J&C remained the current actor with internal action number 1.
- Hachiman remained at shield 6 of 6.
- The seeded simulator chose Hachiman as its random opening target.
- The opening raw damage preview was 150,710.
- Shared Highlight was 25%, using the observed opening value.

The opening automatic follow-up did not charge the shared gauge. Only the observed +17% normal counted-action increment is configured for this replay.

## Simulator T1 checkpoint

The targeted T1 run completed with this action order:

| Step | Actor and action | Counted? | Raw damage delta | Resulting actor or state |
| ---: | --- | --- | ---: | --- |
| 1 | J&C Gun on Hachiman | Yes | 70,550 | Wonder, Dionysus active; seed-conditioned critical reduced shield 6 to 5 |
| 2 | Wonder switches Dionysus to Vasuki | No | 0 | Wonder remains current; Auto-Mataru IV removed |
| 3 | Vasuki Rakunda on Hachiman | Yes | 0 | Wonder SP 180 to 158; 42.7% Defense reduction applied |
| 4 | Marian Gentle Sea Breeze on Berry | Yes | 0 | Marian SP 100 to 75; prescriptions 0 to 2 |
| 5 | Berry Vorpal Butterfly on Left Idol A | Yes | 79,726,569 | Attack Turn 2 began after automatic repeats and Hachiman's response |

T1 ended with a cumulative raw damage preview of 79,947,829. This value is not credible as a game-score prediction. It exposes a large formula and input mismatch:

- The provisional simulator idols each have 180,000 HP.
- Ichigo's equipped stats make the first S1 hit exceed that provisional HP, so the result is clamped to a 180,000 kill.
- The A6 S1 defeat rule automatically repeats through the other three living idols.
- Each repeated hit also defeats its provisional target.
- Clearing the wave activates the provisional Minion Break effect.
- The repeat chain then reaches Hachiman and previews 79,006,569 raw damage.

The automatic chain was logged as four `berry_repeat` damage events after the initial cast: 180,000 to Left Idol B, 180,000 to Right Idol A, 180,000 to Right Idol B, and 79,006,569 to Hachiman. The simulator then recorded Hachiman shield 4 of 6, an omitted Lovesick tick because its coefficient is unknown, 50 damage to Marian from the boss response, and all four idols still defeated. The live profile's scripted-only summon policy suppresses the generic end-turn respawn.

The provisional idol HP explains why the automatic chain reaches Hachiman. It does not explain the 79,006,569 boss-hit magnitude by itself. The runner records these calculation inputs at that exact repeat:

| Formula input | Simulator value |
| --- | ---: |
| Berry equipped Attack | 4,927 |
| Additive Attack buffs | 72% |
| Attack scaling value | 8,474.44 |
| Listed S1 power | 1.502 |
| High-HP S1 multiplier | 3x |
| Effective power | 4.506 |
| Effective Hachiman Defense | 107 |
| Pre-variance base | 79,076.92 |
| Combined status multiplier | 9.7193345167x |
| Critical multiplier | 1x |
| Engine damage normalization | 100x |
| Implied variance and Technical factor | 1.0279617329x |
| Resulting raw damage | 79,006,569 |

The 72% Attack buff is 30% from Berry's second Chain, 12% from Marian's opening party passive, and 30% from J&C's Mischief awareness effect. The effective Defense is the local 385 boss Defense after 42.7% Rakunda, 36% reduction from 12 transferred Lovesick stacks before the boss repeat, and Berry's 7.5% equipped Pierce. The combined status multiplier includes Berry's 55.9% equipped Damage Bonus, 48% exposure from those Lovesick stacks, J&C's 24% Oxymoron damage and 32.704% Two Masks damage, Marian's 6% Blessing damage, Hachiman's Curse weakness and 20% final-damage-taken modifier, the provisional 40% Minion Break, and Berry's 15% party DOT bonus. The boss repeat was not critical in seed 8, so Marian's S3 critical-damage increase did not enter this result.

These are simulator inputs and engine formula outputs, not verified live coefficients. The 4,927 Attack and percentage stats come from the saved Ichigo screenshot preset, while other party equipment, Revelation, Persona, and buff assumptions remain incomplete. The large value therefore needs formula and input validation later. It was not used for score calibration.

The seed-conditioned simulator Gun did 70,550 raw damage and reduced Hachiman shield 6 to 5 because it critically hit. The live Gun also reduced shield 6 to 5, but no Crit banner appeared. This result alignment comes from the seed condition and does not establish that the simulator's Gun down-point rule matches the live rule.

The corrected T1 simulator now reaches the following endpoint fields:

| Field | Live T1 endpoint | Simulator T1 endpoint |
| --- | --- | --- |
| Remaining idols | 0 | 0; all four defeated |
| Boss shield | 4 | 4, reached with a seed-conditioned Gun crit |
| Hachiman Lovesick | 15 | 15 |
| Attack Turns Left | 4 | 4 |
| Next party actor | J&C | J&C |
| Marian resource | 2 | 2 |
| Berry Chains of Love | 2 | 2 |

The simulator now retains all four idols as defeated because the Hachiman profile uses scripted-only summons. It also transfers 3 Lovesick from each defeated idol to Hachiman before the next repeat, then applies 3 more on the boss hit, ending at 15. These endpoint fields agree with what was visible in the live game, but they do not establish damage, score, or full-state parity. The user confirmed the live priority rule kills the minions first and then hits the boss. The exact order among the four idols and the observed per-hit damage remain unknown because the intermediate frames were not captured.

At the T1 checkpoint, the simulator resources were:

| Unit | HP | SP | Other |
| --- | ---: | ---: | --- |
| J&C | 886 | 100 | Ammo 7, True Desire 1 |
| Wonder | 920 | 158 | Vasuki active |
| Marian | 940 | 75 | 2 prescriptions; took 50 simulated boss damage |
| Berry | 8,634 | 80 | 2 Chains of Love |

The shared gauge is 93%: 25% opening, then 42%, 59%, 76%, and 93% after the four normal counted T1 actions. No additional boss, round, automatic-follow-up, or navigator charge is assumed.

## T2 status

The targeted T2 runner was invoked after the live endpoint was complete. It replayed opening and T1, then successfully executed MIKU Heaven Feel the Beat as a free action. The simulator remained on J&C at internal action 5, kept Hachiman at shield 4, added the Break track, and put both MIKU support skills on cooldown 4.

The next guarded action, Berry's ordinary Highlight, was illegal. The runner now uses the shared gauge, but T1 reaches only 93%. MIKU Heaven Feel the Beat did not change it, and no observed boss, round, automatic-follow-up, or navigator charge supports filling the remaining 7%. The runner stopped without forcing the gauge, bypassing the guard, simulating later T2 damage, or using the observed score to choose another seed.

| Field | Live after MIKU S1 | Simulator after MIKU S1 |
| --- | --- | --- |
| Current party command | J&C command with Berry Highlight available as an interrupt | J&C, but Berry Highlight is unavailable |
| Highlight model | Shared meter at 100% | Shared meter at 93% |
| Boss shield | 4 | 4 |
| Remaining idols | 0 | 0 |
| MIKU song | Heaven | Heaven |
| MIKU support cooldown | 4 | 4 |
| T2 progression | Berry Highlight and the remaining rotation completed | Blocked before Berry Highlight |

This is the decisive T2 comparison gap. The simulator now reproduces the observed shared-meter shape through T1 but has no evidenced source for the remaining 7%. It therefore cannot legally reach the live score 5,844,450 endpoint through this route. The later live states are still useful observations: Berry Highlight reduced shield to 3, Berry S3 reduced it to 2, Hachiman kept 15 Lovesick, no idols returned, and MIKU transitioned to Spring Storm at the round boundary. None of those later fields have a baseline simulator endpoint in this run.

The encoded route uses a direct free switch from Vasuki to Dionysus. The live run cycled Vasuki to Jano to Dionysus and showed Harmony plus Matarukaja IV before Revolution. Those intermediate Persona activations are an additional configuration mismatch even if the Highlight gate is resolved later.

## T3 status

T3 is encoded as a dependent guarded checkpoint. Its route changes MIKU from Spring Storm to Play-With-Fire as a free runner-recorded song selection, uses Feel the Beat, then casts J&C S2 Service and Admonition on Hachiman. The S2 is expected to create two Facades and let the live J&C automatic S3 resolve on the previous skill target without a second manual input.

The targeted `T3` invocation stops at the same preceding T2 Berry Highlight gate. The current simulator therefore does not reach the live T3 start state of shared Highlight 72%, Spring Storm, support ready, shield 2, Lovesick 15, and zero idols. No baseline T3 simulator damage or endpoint is reported.

The song-selection step is a runner-only adapter because the shared engine does not expose the observed free Spring Storm to Play-With-Fire selection. If the Highlight model is repaired later, this adapter still needs separate validation against the game's song-selection timing and cost.

## Implementation and verification status

The focused Item and Dreamscape fixes are complete. An independent review cleared the four prior blockers. The final focused Item and Dreamscape tests passed 11 of 11 with no failures; the archived benchmark remained exactly 3,642,530,108 with error 0; and the static build succeeded. These are focused checks only and do not claim full-suite success or full live-score parity.

Root browser QA at `127.0.0.1:4173` confirmed the Hachiman ITEM tab renders with AI Assist on. Wonder's ordinary Attacker Tablet on Berry advanced the actor to Marian, changed shared Highlight from 0% to 18% under the default configuration, left Marian's basket at 0 of 2, changed Attack inventory from 1 to 0 and disabled it, reduced total item uses from 10 to 9, and left Fighter inventory at 1. Browser error logs were empty.

The observed game result remains 6,101,612,096 and its result screen was left untouched. The active Guardian or Medic role-trigger source remains uncertain pending the user's live-text answer, so this verification does not claim role-conditional live-party parity. An unrelated existing unsupported-Theurgy mode test assertion still fails, leaving that broader mode run at 17 of 18.

## Known omissions and cautions

- The live result screen establishes this run's final arithmetic, but the source allocation within Foe Defense Points, individual final S3 and DOT frames, and the actual ending trigger remain unverified.
- The simulator uses a shared Highlight meter for live runs. This runner supplies only the observed 25% opening and +17% normal counted-action gain, leaving T2 at 93% with no evidenced source for the final 7%.
- Ichigo Lovesick's base damage coefficient and duration are absent from the imported source. Trigger events are logged and unsupported damage is omitted.
- Dionysus trait effects are not modeled.
- The shared engine now supports observed Persona SP costs and Universal Theoria's 33% party Attack plus selected-ally 22% damage effect for the recorded path. This static update does not change the separately recorded T2 Highlight block or establish later runner checkpoints as unblocked.
- The Dreamscape audit identified missing idol score exclusion, Skill and Resonance critical treatment, party Curse damage, and Guardian or Medic modifiers. A bounded live-Hachiman implementation is in progress; it is not yet validated by this record. The role-trigger source for the active Guardian or Medic effects remains unknown, so the literal role conditional cannot claim live-party parity.
- The mode-patch review also identified missing BERRY +30% continuous damage and J&C automatic-S3 Critical Damage bonus. These, together with actual-idol species exclusion, are in the focused patch pass and remain unvalidated here.
- The all-wave-clear +40% for 1 turn behavior remains unsupported; its exact per-stack rule is still unknown.
- BERRY A6's defeated-target fallback is implemented as first living target, but its exact retarget policy is unverified. Nullified, reflected, and absorbed outcomes remain unmodeled engine gaps.
- Vasuki Stare, Serpent Bite, Venomous Spiral damage-taken effect, and continuous damage are not modeled by this checkpoint path.
- Persona switching is recorded as free, matching the action-cost behavior observed in the live route.
- The T2 runner encodes Vasuki directly to Dionysus and does not model the live intermediate Jano cycle, Harmony activation, or visible Matarukaja IV reactivation.
- The T3 runner records the observed free MIKU song selection with a local adapter because the engine has no matching command.
- The simulator boss and idol defenses, idol HP, scripted summon timing, enemy damage, and Minion Break are provisional encounter data. The T1 overkill chain shows that they do not reproduce the live damage scale.
- Seed 8 makes the simulator trace deterministic and conditions J&C Gun to crit after the opening target-selection draw. It does not reproduce the live Gun presentation or the game's random stream.

This artifact treats the supplied rotation as a test guide. It records coincident fields and material divergences without treating raw damage as a score forecast or claiming endpoint parity.
