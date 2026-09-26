# Hachiman contextual Highlight rules proposal, 2026-09-05

## Recommendation

Latest correction after the combined comparison: the user identified Berry's kill-triggered S1 recasts as the missing T1 Highlight source. Each Vorpal Butterfly kill reset is a separate eligible cast using the existing normal/weakness rate, with Concert doubling when active. One manual command still spends SP and advances the turn only once. The capped 100% live endpoint establishes availability but does not independently measure every recast's gain. Double Berry and unrelated automatic follow-up eligibility remain unresolved. This supersedes the blanket repeat-eligibility uncertainty in the historical discussion below.

Latest user confirmation: each Thief action charges 17%; hitting weakness charges 21%, a +4 percentage-point bonus. During Virtual Concert, Highlight and Theurgy gauge filling doubles, so the corresponding action amounts are 34% and 42%. Virtual Concert also grants +10% Highlight Final Damage Amplification and +10% Theurgy Final Damage Amplification, and resets all ally Highlight cooldowns on activation. These current rules supersede the earlier unknown-value discussion below. Eligibility for additional automatic repeats or follow-ups remains unresolved, and Theurgy activation in the simulator remains unimplemented. Machine-readable evidence: `data/highlight-charge-evidence-2026-09-05.json`.

Replace the single live action charge with a sourced context resolver. Keep ordinary action, boss weakness, Virtual Concert, and combined behavior independently configurable. Apply 17% or 21% outside Concert and 34% or 42% during Concert according to the action's weakness context. Record damage packets, casts, automatic repeats, and action boundaries before deciding which of those units earns charge. The extra repeat/follow-up eligibility and charging basis remain unresolved.

The user has confirmed that boss weakness hits earn a different Highlight amount and that actions during Virtual Concert earn a different amount. This supersedes the earlier audit's framing of the repeated normal-round +4 as an unidentified event that might require a boss-action or round hook. Weakness is now a concrete candidate for that difference. The old checkpoints remain valid observations; they do not identify exact per-hit coefficients or establish a boss-round charge.

The later user confirmation establishes ordinary 17/21 and the +4 weakness difference, plus the universal two-times Concert multiplier for Highlight and Theurgy gauge filling. The historical 38 and 42 checkpoints below remain observed settled intervals, not replacements for the confirmed 34/42 action rates and not evidence that every repeat or follow-up is separately eligible.

## What the recorded endpoints establish

All amounts below are displayed percentage-point changes. Rounded HUD values and intervening events limit interpretation. Source: `HACHIMAN-ROTATION-CHECK-2026-09-05.md`, observed game checkpoints.

| Interval | Displayed change | Supported interpretation and limit |
| --- | --- | --- |
| T1 Gun, Rakunda, Marian S3 | 25 to 42 to 59 to 76 | Three separate ordinary commands each display +17. These include damage and non-damage commands. |
| T2 Marian S2 through Berry S3 and settled next round | 51 to 72, +21 | Consistent with a weakness-related increase over the observed +17. Boss action and round events are inside the interval. |
| T3 Beach Basket through Berry S3 and settled next round | 17 to 38, +21 | Repeats the same net interval, not an isolated hit measurement. |
| T1 Berry S1 kill chain through settled next round | 76 to capped 100, at least +24 | Repeats, four defeats, a final boss hit, and boss/round events are not partitioned. A single +4 above 17 would reach only 97. |
| Concert Wonder Universal Theoria | 38 to 72, +34 | Direct support-action interval supports observed ordinary Concert charge of 34 in this loadout. It does not prove every action class doubles. |
| Concert J&C Fire and Ice S1 | 38 to 72, +34 | Another observed ordinary Concert interval. |
| Concert Marian Beach Basket S1 | 0 to 34, +34 | Direct observed +34 after an ordinary damaging command. |
| First Concert J&C S2 plus enhanced automatic S3 | 0 to 38, +38 | Enhanced S3 contains multiple elements, including Curse in current source implementation. The total cannot be assigned to the selected S2 alone. |
| Concert ordinary Berry S3 through second extra-round start | 0 to 38, +38 | Historical settled interval. It includes skill bonus damage and round transition, so it does not isolate repeat or follow-up eligibility. |
| Concert Alt S3 plus repeat and Concert ending | 34 to 76, +42 | Historical settled interval. Preserve the observed 42; it is not a relabeling of the interval as a confirmed per-action rate. The final Concert effect is also inside the interval. |

The confirmed Concert action rates are 34 for an ordinary action and 42 for a weakness action. The historical +38 and +42 settled intervals contain additional casts, packets, repeats, or transition effects and therefore do not identify extra repeat/follow-up eligibility. T1 adds separate constraints and must not be forced to fit by inventing a universal defeat or boss-round charge.

The subsequently supplied Daisoujou photo established Curse weakness for the idols. Live Hachiman now overrides their old provisional Fire/Ice weaknesses and Curse resistance. These corrected affinities qualify for weakness detection, while any additional charge from automatic repeats still requires its own rule.

## Current implementation and integration points

Static inspection only, with line references current when inspected:

- `src/engine.js:72,236-248`: accepts scalar `sharedHighlightGain`, defaults live gain to 18, and stores shared evidence alongside starting charge. A replay override currently labels both the opening amount and recurring gain with one evidence string.
- `src/engine.js:1022-1051`: exposes one `gain` in `getHighlightState`; `gainSharedHighlight` clamps charge and emits only realized gain. It does not retain nominal gain, overflow, hit context, or separate rule evidence.
- `src/engine.js:2235-2390`: `resolveSkill` calculates `result.weakness` separately for primary and extra damage packets. Both packet loops need context recording. Extra hits can change element and source type, so the selected skill element is insufficient.
- `src/engine.js:2626,2832`: Berry S1 defeat chains and Double Berry repeats recursively call `resolveSkill` with `sourceType: berry_repeat`. Preserve their distinct cast IDs and shared parent action ID.
- `src/engine.js:2730`: `completeCountedAction` currently applies scalar gain times two during Concert. This now agrees with the confirmed Highlight/Theurgy gauge-filling multiplier for the sourced action classes, while repeat/follow-up eligibility remains a separate unresolved question.
- `src/engine.js:2827-2850`: ordinary commands resolve damage and automatic chains before reaching the counted-action completion boundary. Start the context before resolution; pass it explicitly through nested calls and finalize it at this boundary.
- `src/engine.js:2747-2751`: item actions also use the counted-action boundary. Keep item eligibility separately sourced; a non-damage action is not automatically an ordinary support skill.
- `src/engine.js:2816`: Guard bypasses the scalar and uses 8 normally or 16 in Concert. Include an explicit Guard rule rather than silently changing its behavior through the main resolver.
- `src/engine.js:568-569`: queued One More and All-Out Attack pass `grantsHighlight` into `resolveSkill`, but its gain block applies only to personal meters. Audit this interface if contextual shared gain is introduced; a boolean cannot express the amount or its basis.
- `src/engine.js:1631-1645,2890-2920`: MIKU A1 fills on Concert activation; normal Highlight spends the shared meter; free Double Highlight has distinct spending behavior. These are resource events, not ordinary action-rate cases.

Personal archived mechanics currently grant 18 or 36 from the damage-resolution path. Keep that branch unchanged. Do not infer that `grantsHighlight: false`, which currently suppresses personal charge, means a repeat can never contribute to the newly confirmed shared weakness mechanism.

## Proposed contract

Use a versioned `sharedHighlightRules` object for live mode. Separate `start` evidence from recurring rule evidence. Each rule should contain an explicit evidence record with status (`confirmed`, `observed`, `provisional`, or `unknown`), source reference, scope/loadout, and capture date. Unknown numeric fields must remain `null`.

An action context should contain:

```text
actionId, actorId, actionType, skillId
concertAtActionStart, concertRoundAtActionStart
casts[]: castId, parentCastId, sourceType, skillId, automatic, repeat
packets[]: castId, targetId, targetKind, element, weakness, actualDamage,
           sourceType, packetKind, targetDownedBeforeHit
```

Capture Concert state before action completion, since the last Concert action can end Concert. Record packets immediately from the resolved damage result rather than scanning log messages: event history may be omitted or truncated in fast mode, and nested casts can otherwise be misattributed. Ensure unrelated end-of-round DOT, foe hits, and Concert finale packets have separate event contexts. An emitted damage packet is not necessarily one visual hit in the live animation, so call it a packet until actual hit segmentation is sourced.

The rule definition must choose a charging basis explicitly:

```text
normalAction: { amount, eligibleActionTypes, evidence }
concertAction: { amount, eligibleActionTypes, evidence }
weakness: { amount, basis, qualifyingSources, targetScope, evidence }
concertWeakness: { amount, basis, qualifyingSources, targetScope, evidence }
composition: replacement_total | action_base_plus_qualifying_units
```

The flat combined totals are useful only if `basis` is confirmed as once per manual action. If the rule adds charge per cast or packet, use an explicit composition with independently sourced base and additive components. Do not let both a replacement combined total and its component bonuses apply. `basis`, `qualifyingSources`, and `targetScope` are required mechanics, not optional defaults. Unknown repeat or packet behavior must not silently mean zero.

Treat support, Guard, items, free medicine, navigator actions, automatic follow-ups, repeats, Highlight attacks, DOT, defeats, incoming damage, and Concert finale as distinct source classes. Only confirmed eligibility grants charge. Observed zero-net free actions can be stored as scoped observations; do not broaden them to every build or mechanic without evidence.

Resource events should retain `before`, `requestedGain`, `appliedGain`, `overflow`, `after`, action/cast IDs, context key, rule IDs, evidence, and any unresolved components. This makes a capped 76 to 100 interval visibly censored rather than falsely claiming a measured gain of exactly 24.

## Missing values and compatibility

Preserve the old scalar path as an explicitly labeled compatibility profile for saved configurations. Keep its existing behavior so archived results remain reproducible, while reporting `provisional_legacy_flat_gain` and its Concert doubling assumption. Do not present this profile as the sourced live rule.

For the new contextual profile, missing amount, composition, or basis must produce a persistent limitation naming the actor/action/context and the missing field. Prefer preflight validation against intended action classes before running. If a missing branch is encountered during an interactive action, mark the meter as unresolved, retain its last known or lower-bound value separately, and withhold Highlight readiness claims until resolved. Simply leaving the displayed gauge unchanged would imply a verified zero and is not sufficient.

Do not solve incomplete rules by silently falling back to 17, 18, twice normal, or a checkpoint correction. A deliberately selected legacy profile can still run, with its limitation visible in output. Contextual results with unresolved charge must not be advertised as a completed comparison or used to rank rotations as if charge legality were known.

## Evidence still required

1. Whether the confirmed amount applies once per manual action, each cast, each damage packet, each actual hit, or each target.
2. Whether automatic S1 chains, Double Berry casts, J&C automatic S3, bonus packets, and DOT qualify, and whether a downed target still qualifies.
3. Complete Theurgy activation records and an uncapped observation isolating the first S1 chain.
4. A pre-finale endpoint after Concert Alt S3 to resolve remaining repeated-action contributions.

No simulations, replays, battle tests, optimizer runs, or builds were performed. This proposal changes only `HACHIMAN-HIGHLIGHT-RULES-2026-09-05.md`; engine implementation is intentionally left to the primary agent after the rule choice is supported.
