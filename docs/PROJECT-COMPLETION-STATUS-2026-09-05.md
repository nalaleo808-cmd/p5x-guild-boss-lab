# P5X simulator completion status, September 5, 2026

## Current profile and scoring status

New battles and searches default to `live-2026-09-04`. The explicit `recorded-2026-08-29` profile exists to preserve the recorded Slaughter Drive regression. Its exact Nexus result of 3,642,530,108 protects the archive behavior and recorded bucket composition; it is not evidence that the corrected live profile reproduces the recording.

Multidimensional Dreamscape currently runs as `damage_preview_only`. Its Level 82 Hachiman preview is configured for six party rounds, includes the observed `Attack Turns Left 0` round, and ends as `preview_complete`. Results expose simulated damage while leaving Foe Defense Points and Turns Survived Bonus null. The separate observed result `(258,098,432 + 125,000) x 8 = 2,065,787,456` verifies one result composition. Exact Foe Defense Points accumulation, the survival-bonus rule, and the actual end trigger remain evidence blockers.

The September 4 optimizer result of 37,425,059,184 and baseline of 8,734,831,636 are historical and archived at `data/optimizer-slaughter-2026-09-04-archive.json`.

The current `live-2026-09-04` full search completed 29,119 candidates and found a best searched score of 20,757,143,632. The current Full Auto baseline is 4,699,599,848, and the artifact reports fast/full replay parity for both. The result is a best searched simulator result, not a guaranteed global optimum or verified live-game score. The final suite passed 98 tests, browser QA passed, and the main project was synchronized with verified hashes. See VALIDATION-2026-09-05.md.

## Audit scope and evidence

This audit compares all 20 characters in `data/lufel-live-recent.json` and `src/generated/lufel-catalog.js` with the current runtime in `src/engine.js` and the current automated tests. It treats imported descriptions as source data, executable engine branches as implementation, and assertions as runtime proof. A skill coefficient appearing in the catalog does not mean the complete skill works.

The generated catalog has a common verified base layer:

- All 20 characters have A6 level 80 stats, Skill Level 13, SP or HP costs, targets, and fourth-tier direct damage coefficients.
- One catalog regression checks the fourth source coefficient for every imported damage skill and Highlight.
- The generic engine can execute one direct damage packet, one simple buff or debuff, simple healing, SP restore, cost, and a numeric cooldown when those fields were normalized.

This base layer has material limits. Multi-hit descriptions usually execute as one aggregate damage packet. Conditional formulas can be flattened into incomplete values. For example, a text formula such as a percentage per 100 Attack can appear as a very small fixed buff in the normalized record. Ailment chance, stack state, action replacement, follow-up timing, and trigger ownership are not inferred from prose. Passives remain descriptive unless a named engine branch applies them.

## Character coverage

Status meanings:

- **Implemented and tested** means the named core state machine has dedicated assertions. It does not mean every line of the kit is complete.
- **Partly modeled** means direct damage and some named mechanics run, with significant missing behavior.
- **Base layer only** means source coefficients and generic fields run, without the character's defining state machine.

| Character | Status | Executable and tested today | Sourced work still required | Evidence blocker |
| --- | --- | --- | --- | --- |
| BLITZ | Base layer only | A6 coefficients; generic Electric damage; imported Highlight Defense debuff | Speed formulas, Hard Knocks, Detention, forced Down Point loss, Lightning Legs state and one-use enhancement, Dizzy, downed-target passive | Confirm exact Lightning Legs consumption and status clocks in play |
| BERRY | Partly modeled and tested | Chains of Love, Lovesick stacks and exposure, S1 high-HP bonus, S3 stack scaling and bonus hit, DOUBLE BERRY thresholds and repeats, one-time free fourth Alt, Highlight triggers, fatal survival, explicit optional DoT definition, unknown-DoT omission, Auto legality, and replay determinism | Target retargeting; all Awareness thresholds; ordinary defeat repeat; exact default continuous damage | Imported raw snapshot omits Awareness text and Lovesick base coefficient and duration. Live run confirms S2 and S3 availability and once-per-battle use, but not the complete hit breakdown |
| PUPPET Wavecatcher | Implemented and tested core | A6 Surf start, SP Recovery Attack scaling and cap, Surf damage, SP overcap, Catch a Wave, Offshore, Aerial Tide, Surf Highlight, cleanse, status duration extension, and spiritual or control immunity | Freeze behavior and the stated item-use restriction | Direct examples are still needed for Freeze and item restriction timing |
| MARIAN Beachflower | Implemented and tested core | Beach Basket HP scaling, Bewitching Blossoms, Summer Garden, Blessing stacks, party Attack passive, Gentle Sea Breeze owner-turn cooldown, two medicines, free medicine use, A0 and A6 duration extension, Potent Medicine, ally Highlight | Generic DoT, ONE MORE, All-Out Attack, Technical, and Theurgy consumers for four medicines | Source of the observed 1.58 medicine magnitude multiplier remains unknown. The current source-backed base values cannot reproduce it without a loadout or passive source |
| MIKU | Implemented and tested core | Shared cooldown, three-song and Track cycle, conditional Track effects, Showstopper, two Concert loops, stopped foe turns, cooldown freeze, status ticking, A1 Highlight reset, A2 and A4 effects, and A6 per-target echo | Stat-sharing Highlight and any remaining song edge cases | Source says stats are shared but does not identify the exact stat fields or rounding |
| AKIHIKO | Base layer only | A6 direct coefficients and numeric Lightning Fist cooldown | Grit, Mettle, per-stack Lightning Fist multiplier and hit behavior, guaranteed critical range, critical passives, Theurgy gauge, Assist | Generic Theurgy and Assist rules are absent. Live timing is needed for gauge gain and Assist insertion |
| YUKARI | Base layer only | Gale Burst damage; some flattened simple buff fields | Erosion ownership and transfer, Windswept, Attack-based support formulas, damage reduction, Whisperwind, gauge reserve, Highlight reaction, cleanse, buff removal, Theurgy, Assist | Generic Theurgy and Assist rules, plus live evidence for overflow reserve and Erosion transfer timing |
| MAKOTO | Base layer only | A6 direct coefficients; generic self buff on Scarlet Hades | Moon Phase and Full Moon, availability gates, per-stack hit counts, four-stack bonuses, Entrusted Hope, SEES bonus, Theurgy, Assist | Awareness data is absent from the raw snapshot; generic Theurgy and Assist timing is also absent |
| ANGE | Partly modeled | Navigator actions remain separate from party actions; source cooldown numbers can run through the navigator clock | Musical Notes, cooldown reduction, selected-use healing bonus, automatic heal per 12 notes, Attack-scaled formulas, Da Capo, passive pierce | Stat Buff says 20% of Manaka's stats but does not enumerate transferable fields or rounding |
| LUCE | Base layer only | Followspot damage and flattened basic buff fields; numeric Adlib cooldown | Blessing stacks, Attack and ailment-accuracy scaling, Adlib immunity, Improv mode state and all four branches, fixed Attack formulas | Raw snapshot does not include Awareness or a definitive Improv state selection and transition contract |
| CROW | Base layer only | A6 direct Bless, Curse, and Almighty coefficients; some simple buffs | Suspicion, Deduction, Stratagem, Arrow of Truth recording, fixed recorded-damage payout, Arrow of Perjury distribution, Mastermind, Flames of Desire, Defense-based Almighty scaling, Highlight hit increase | Raw unique skill text consumes Arrow of Truth but the imported snapshot does not contain the complete Awareness rules that create the recording state |
| TURBO | Base layer only | HP cost, direct Physical damage, and flattened party buffs | Extra-action detection, Speed-scaled buffs, guaranteed critical main target, shields, selected Highlight target mark, Down Point bonus, extra-action and downed-foe passives | Needs the global extra-action contract and one live example for selected Highlight mark consumption |
| VIOLET | Base layer only | Direct Bless coefficients and simple self buffs | Lead Step, Follow Step, Dance Partner, immediate Cinderella Glow, Masquerade availability, Step scaling, Highlight and Theurgy reactions | Raw snapshot omits Awareness rules that establish or enter Masquerade; ally-trigger target timing needs a live example |
| RIN Firecracker | Base layer only | Direct Fire coefficients, simple self buffs, and numeric cooldown | Burn, Year-End Flames DoT, evolved Yanhua Slash, free Orange Blossom Blade action, replacement melee action, Technical branches, passive refresh | Generic DoT and Technical contracts are absent. A live example should settle the free action and replacement expiry boundary |
| MATOI | Base layer only | Direct Ice coefficients | Extinguish stacks and gates, Freeze, Icebound, Burn-to-Scald conversion, ailment scaling, Technical Precision, Ice Technical branches, evolved skill, Technical shields, Highlight second hit | Generic ailment and Technical contracts are absent; Technical threshold and ailment conversion timing need direct evidence |
| WIND Tempest | Base layer only | One Wind damage coefficient, one flattened critical buff, and Highlight SP restore | SP Recovery passive, Falling Petals, one-time SP trigger, spend-all-SP thresholds, Unravel, Blossom stacks, critical scaling, ally-targeted Highlight | Target selection and one-time trigger timing need a live example; Theurgy and Resonance trigger categories need a shared event contract |
| HOWLER | Base layer only | Direct Fire damage and simple Defense or damage-taken debuffs | Ailment accuracy scaling, Burn, Big Welcome, Furrocious Follow-Up, two Woof Woof Blaze branches, Resonance classification, elemental and Resonance exposure, Enthusiastic Fuse, passives | Source text is detailed enough for a first implementation. A live example is needed to verify branch priority and Fuse spend timing |
| MONT Frostgale | Base layer only | Spring-side Wind coefficients are imported and executable as generic damage | Spring and Winter selection, dual coefficients and elements, Edge states, Vestige stacks, ally follow-ups, shields, ailments, Resonance finishers, mode-specific Highlight branches and passives | Raw snapshot omits the Awareness rules that choose or switch modes. A live mode-switch example is required before default behavior is selected |
| J&C | Implemented and tested core | Locked two-mask loadout, either opening mask, alternation, automatic Two Masks, Facades, Desire formula, A1 start, stored True Desire, all six Oxymoron pairs, support effects, shields, Down Point, ailments, selected Highlights, independent cooldowns, MIKU reset | Exact enhanced hit distribution review and any untested Awareness edge cases | Same-owner-turn Highlight cooldown grace is provisional. Live Alt evidence shows a stored irreversible enhancement, but exact True Desire stack consumption and the full automatic hit sequence remain unresolved |
| NOIR | Base layer only | Direct Psy and Gun coefficients, HP cost, and simple self buffs | Target Audience transfer, Focused, Painpoint, Spillover, Overload, ranged follow-ups, Area to Improve, Thoughtful Round, ailment scaling and passives | Raw snapshot omits Awareness rules that create Thoughtful Round, which blocks the complete round-state progression |

No character should be labeled full-kit complete from this audit. Five kits now have substantial tested state machines: BERRY, PUPPET Wavecatcher, MARIAN Beachflower, MIKU, and J&C. The new live-mechanics file has 15 focused tests, including eight dedicated BERRY regressions. The final integrated suite passed 98 of 98 tests. The other 15 characters remain partial generic or lightly normalized implementations.

## Priority system families

### Damage over time

The engine has a generic continuous-damage trigger loop and source category. BERRY can create Lovesick and trigger it, but if no coefficient is supplied the engine emits `unmodeled_dot` and adds zero damage. This is the correct behavior for the current evidence gap. Firecracker's Burn and Year-End Flames, MATOI's Scald, and other imported DoTs do not yet have a shared application, ownership, tick, refresh, stack, critical, and expiry contract.

Minimum next step: define a status record with `sourceActorId`, element, coefficient source, stack policy, duration clock owner, refresh policy, trigger event, critical rule, and provenance. A missing coefficient must remain non-damaging and visible as a limitation.

### ONE MORE and All-Out Attack

The engine recognizes `one_more` and `all_out_attack` only as damage source labels that can consume the medicine bonus. It has no trigger, action insertion, eligibility, targeting, or damage calculation for either system. The presence of `oneMoreDamage` in a buff is not functional coverage.

Minimum next step: specify a battle-level opportunity state, exact Down and weakness trigger, eligible actors, action cost, target set, resolution order, and whether each action advances owner and status clocks. These rules require live battle evidence before implementation.

### Technical

Imported descriptions name Technical types and the engine can store a `technicalPrecision` buff, but damage calculation never reads Technical Precision and no Technical resolver exists. RIN Firecracker, MATOI, and LUCE therefore lose defining branches even though their direct coefficients run.

Minimum next step: build a data table for ailment and attack compatibility, precision thresholds or probability, named result tiers such as Fireburn or Deepfreeze, damage modification, ailment consumption, and emitted event data. Exact thresholds and result selection require game text or captured examples.

### Theurgy and Assist

AKIHIKO, YUKARI, and MAKOTO source records place Theurgy and Assist descriptions in slots that the generic importer cannot execute faithfully. These actions are now disabled with a visible unavailable reason. There is no Theurgy gauge, eligibility threshold, gain event, overflow reserve, distinct clock, or Assist insertion system. A coefficient in the imported description does not make either action executable.

Minimum next step: split `highlight`, `theurgy`, and `assist` into distinct action kinds. Each needs its own gauge or availability state, insertion timing, action cost, target rules, source category, and duration-clock effect. The imported descriptions give several thresholds, but live examples are needed for gauge gain and insertion timing.

## Minimum contract for isolated kit modules

Future character work should move behind a small contract so each kit can be implemented and tested without adding more name checks to the main engine.

1. **Registration:** a module registers one `slug`, supported source version, evidence status, and initial state factory.
2. **Action projection:** `getActions(context)` returns explicit `counted`, `free`, `interrupt`, `extra`, `repeat`, or `assist` action kinds, with availability reasons and target rules.
3. **Event hooks:** modules can handle battle start, actor turn start and end, before and after action, before and after each damage packet, ally action completion, status tick, enemy defeat, wave change, and fatal party damage.
4. **Damage packets:** each packet identifies hit count or individual hits, element, source category, coefficient and scaling stat, critical rule, Down Point delta, target selection, and provenance. Recorded-damage mechanics store the exact packet set they record.
5. **Statuses:** every status identifies owner, recipients, duration clock, remaining duration, stack cap, refresh or replacement policy, dispel class, trigger event, and evidence status.
6. **Determinism:** all random choices use the engine RNG supplied in context. A module cannot use its own ambient randomness.
7. **Unknown behavior:** unsupported coefficients and timing emit a structured limitation event. They do not substitute a default percentage, clock, target, or damage packet.
8. **Serialization:** kit state must remain plain cloneable data so observations, replay, optimizer state, and saved evidence can reproduce it.
9. **Tests:** each module needs source-coefficient assertions, state-transition tests, action-cost and clock tests, target tests, deterministic replay, and at least one evidence reconciliation when a live example exists.

The main engine should own shared action order, status clocks, damage arithmetic, targeting, RNG, and mode scoring. Kit modules should own character-specific state and reactions. Mode formulas should remain separate from kit damage so the recorded Nexus calibration and the partial Multidimensional evidence cannot leak into one another.

## Completion gates

The project can claim broad kit parity only after:

1. The four priority system groups above have explicit contracts and tests.
2. Each of the 20 rows has dedicated state-machine tests, not only coefficient checks.
3. Every remaining evidence blocker is either resolved with a cited observation or exposed in runtime limitations.
4. Multi-hit, chance, duration clock, and action-kind semantics are represented directly instead of flattened into a single generic action.
5. The archived Nexus replay remains exact and current live mechanics use a separately labeled profile.
6. Multidimensional Dreamscape has direct evidence for Foe Defense Points accumulation, Turns Survived Bonus derivation, and its actual ending trigger before it reports a calculated game score.
7. A current `live-2026-09-04` optimizer artifact records the baseline, winning rotation, and matching fast and full replay results.
