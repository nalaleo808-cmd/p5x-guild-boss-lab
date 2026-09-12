# Multidimensional Dreamscape evidence, September 5, 2026

## Implemented evidence boundary

The simulator now records the parts of Multidimensional Dreamscape that one complete live Hachiman battle established. It provides a pure calculator for the displayed result composition and a reconciliation function that checks an observed final score. It does not infer Foe Defense Points from simulated damage, assign a survival bonus from turn count, or end a battle from the observed HUD sequence.

The verified result composition for the observed run is:

`(Foe Defense Points + Turns Survived Bonus) x Difficulty Bonus = Final Score`

`(258,098,432 + 125,000) x 8 = 2,065,787,456`

This arithmetic is exact. The internal formula that produced 258,098,432 Foe Defense Points is unknown. The internal rule that produced a 125,000 Turns Survived Bonus at 6 Turns Survived is also unknown.

## Direct live observations

The primary local evidence is [LIVE-BATTLE-CHECK-2026-09-04.md](LIVE-BATTLE-CHECK-2026-09-04.md). It records one Hachiman NIGHTMaRe battle in Multidimensional Dreamscape.

| Field | Observed value | Runtime status |
| --- | --- | --- |
| Boss | Hachiman, level 82 | Stored as live encounter data |
| HP display | Infinity symbol | Stored as an infinite HP HUD observation |
| Weakness | Curse | Stored |
| Resistances | Fire, Ice, Electric, Nuclear | Stored as a multi-value list |
| Immunities | Instant-kill, Spiritual Ailment, Control Ailment | Stored as explicit identifiers |
| Permanent Special Effect | Final damage taken +20%; final damage dealt -60% | Stored as two explicit multipliers and the observed text |
| Berserk | Increased damage, with no displayed numeric value | Numeric effect remains unknown |
| First captured state | Action 06, Attack Turns Left 5, Survival Bonus Points x0.5 | Stored as run evidence |
| Post-zero state | Wonder remained playable at Action 40 with Attack Turns Left 0 | Stored as evidence against ending immediately at zero |
| Result | 258,098,432 Foe Defense Points; 6 Turns Survived; 125,000 bonus; difficulty 8; final 2,065,787,456 | Calculator and reconciliation supported |

The HUD showed this sequence in the observed run:

| Attack Turns Left | Displayed Survival Bonus Points multiplier |
| ---: | ---: |
| 5 | 0.5 |
| 4 | 1 |
| 3 | 1.5 |
| 2 | 2 |
| 1 | 2 |
| 0 | 2 |

The code exposes this sequence only as an observational lookup. A request for 6, -1, or any unobserved value returns no multiplier. This prevents interpolation and avoids presenting the sequence as a validated scoring rule.

The Hachiman data also sets `previewAttackTurns` to 6. This lets a simulator preview include one playable party turn while Attack Turns Left displays 0, matching the observed run length. Its `previewLimitNote` states that this is a preview stop and not a verified game-end trigger. A `preview_complete` result therefore describes the local preview boundary only.

## Other source checks

An [official Taiwan V2.1.2 update notice](https://www.p5x.com.tw/news/view/20240821/7c8b93e3.html) announced a new Nightmare's Gateway environment that differed from the existing post-defeat Weakened damage phase and would test party survival. This supports treating the survival environment as a distinct mode family rather than applying the Nexus or Devourer post-defeat formula. The notice does not give its scoring buckets, multipliers, or end condition.

An [official Taiwan V4.0 balance notice](https://www.p5x.com.tw/news/view/20250417/f577d003.html) says an update increased the benefit in the mode for parties carrying Rescue and Defense role characters. This confirms that Multidimensional Dreamscape can have mode-specific role effects. It does not publish the role bonus values, Foe Defense Points calculation, survival bonus schedule, or ending rule. No numeric simulator behavior was derived from it.

A [Bilibili community video entry](https://www.bilibili.com/video/BV1FRCgBBECo/) identifies a Hachiman run in the mode. This is a fan reference and only supports that the boss and mode pairing exists. Its title and indexed page do not establish the score formula or encounter timing, so it was not used for executable rules.

The older local files `MECHANICS-AUDIT-2026-08-29.md` and `HANDOFF-VERIFICATION-2026-09-04.md` remain useful scope audits. They do not add a Dreamscape accumulation formula. The recorded Nexus benchmark remains its own evidence domain and keeps the exact 3,642,530,108 calibration.

## Data and scoring API

`src/data.js` exports `multidimensionalDreamscapeEvidence`. The object separates:

- `resultFormula.status = verified_observed_result_composition`
- `accumulation.foeDefensePoints = unknown`
- `accumulation.turnsSurvivedBonus = unknown`
- `accumulation.hudMultiplierSchedule = observed_for_one_run_not_a_validated_general_rule`
- `endTrigger.status = unknown`

`src/mode-scoring.js` exports:

- `calculateDreamscapeResult(input)`, which evaluates only the verified displayed composition
- `reconcileDreamscapeResult(input)`, which returns the calculated score, observed score, difference, match status, and formula provenance
- `getObservedDreamscapeMultiplier(attackTurnsLeft)`, which performs an exact lookup in the observed HUD sequence
- `DREAMSCAPE_RESULT_FORMULA_EVIDENCE` and `DREAMSCAPE_SURVIVAL_HUD_OBSERVATIONS`, which let the engine and UI display provenance without duplicating claims

All displayed score components must be non-negative safe integers. This matches the result screen evidence and prevents silent rounding from manufacturing a reconciliation.

## Systems assessed but not implemented here

The current engine has medicine buff tags for continuous damage, ONE MORE and All-Out Attack, Highlight and Theurgy, and Technical Precision. It also maps source categories for existing Highlight, Resonance, DoT, ONE MORE, and All-Out Attack damage multipliers. These tags are not complete combat systems.

| System | Source or code evidence present | Missing runtime evidence or behavior |
| --- | --- | --- |
| Generic damage over time | Imported skill text and a `dotDamage` medicine stat exist | Application, ownership, tick timing, refresh, stack rules, and critical behavior are incomplete |
| ONE MORE | Medicine text and a `oneMoreDamage` source mapping exist | Trigger, action insertion, target rules, and resolution are absent |
| All-Out Attack | Medicine text shares the ONE MORE bonus category | Eligibility, initiation, damage formula, and resolution are absent |
| Technical | Imported skills describe Technical hits and Technical Precision exists | Ailment compatibility, chance or threshold logic, damage formula, and consumption rules are incomplete |
| Theurgy | Imported character and Revelation text mentions Theurgy | Gauge, action type, timing, and damage resolution are absent |

Implementing these from names or isolated coefficient text would make the simulator look more complete while creating unsupported behavior. They need direct kit text plus gameplay examples that settle triggers and timing.

## Exact blockers

1. Capture a result run with hit-by-hit damage and score changes to determine how Foe Defense Points accumulate and round.
2. Capture at least two result screens with different Turns Survived values to derive or reject a survival bonus table.
3. Record the full interval after Attack Turns Left reaches 0, including enemy and party state, to identify the actual ending trigger.
4. Inspect Berserk at a source that gives its numeric increase and stack timing.
5. Verify whether Fire, Ice, Electric, and Nuclear resistance use one shared multiplier in this encounter.
6. Capture a run with a Rescue or Defense role change to quantify the official mode-specific role benefit.

Until those blockers are resolved, simulated Dreamscape damage can remain useful for action comparison, but it cannot truthfully claim parity with the live Foe Defense Points total or final battle duration.
