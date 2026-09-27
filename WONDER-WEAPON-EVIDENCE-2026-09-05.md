# Wonder weapon evidence - Cursed Ties - 2026-09-05

## Finding

Implementation update: `src/wonder-weapons.js` stores the inspected profile, and Wonder's saved default, equipment editor, and Hachiman runner now pass it into the engine. Evil Eye's target modifiers and Wonder's conditional Attack are supported. Automatic application stays off by default because proc granularity is unknown; the engine exposes explicit experimental per-hit/per-cast policies and reports unresolved rules. Weapon component stats and the 62.3% ailment-accuracy trait remain metadata rather than being added to potentially equipped totals. Runtime damage impact is not yet validated.

Syntax checks and the static build passed. Browser QA confirmed Cursed Ties selected in Wonder's editor, the inspected weapon stats and effect visible, and no browser console errors. No battle simulation, optimizer run, or replay test was performed. The local server was restarted at `http://127.0.0.1:4173/`.

The Wonder weapon in the observed Hachiman loadout is **Cursed Ties**. This resolves the user's shorthand label `R6 Curse Dagger` for this loadout only. The direct live panel is the controlling evidence for its displayed name, level, stats, and effect.

Cursed Ties does not state that it restores or increases Highlight charge. It therefore does not explain the unresolved Hachiman Highlight gains of at least 7% in the T1 censored interval or the repeated 4% later intervals.

It can materially raise the team's Curse damage against a target with Evil Eye. The direct benefit is target-scoped: Evil Eye decreases that target's Defense by 22.9% and increases its damage taken from Curse attacks by 14.7% for 3 turns. The text does not state a partywide Curse aura or a party Attack buff.

## Direct live game evidence

The full weapon panel was read directly in the live client on 2026-09-05 during review of the user's Hachiman loadout.

| Field | Direct display |
| --- | --- |
| Weapon | Cursed Ties |
| Level | Lv80/80 |
| HP | 1,926 |
| ATK | 654 |
| DEF | 396 |
| Forge Details heading | Evil Eye |
| Ailment accuracy | Increase ailment accuracy by 62.3% |
| Trigger | After an ally deals Curse damage, 70% chance for Wonder to inflict Evil Eye on the target |
| Wonder-only offensive clause | When attacking a foe that has Evil Eye, increase Attack by 33.0% |
| Evil Eye | Decrease Defense by 22.9% and increase damage taken from Curse attacks by 14.7% for 3 turns |

The exact wording above is a compact transcription of the displayed panel. It is primary game evidence. No value was inferred from the historical score or from simulator output.

## Stats and passive effects are separate inputs

The displayed HP 1,926, ATK 654, and DEF 396 are the weapon's Lv80/80 stat block. They contribute to Wonder's equipped character totals. They are not percentages in the Evil Eye passive and should not be represented as party buffs.

The Forge Details text describes conditional combat effects:

1. Wonder receives 62.3% ailment accuracy.
2. An ally's Curse damage can trigger a 70% Evil Eye application attempt by Wonder.
3. When Wonder attacks an Evil Eye target, Wonder receives the stated 33.0% Attack increase for that attack condition.
4. Evil Eye applies the target-side 22.9% Defense reduction and 14.7% Curse damage-taken increase for 3 turns.

The grammar of "When attacking" follows Wonder as the subject of the preceding application clause and appears in Wonder's equipped weapon effect. The panel does not say "all allies" for the 33.0% Attack increase. Treating it as a BERRY or party Attack buff would add an effect that the source does not state.

## Hachiman relevance

BERRY's Curse skills can satisfy the stated trigger condition. If Evil Eye is successfully applied to Hachiman and remains active, BERRY's later Curse damage receives the target's 14.7% Curse damage-taken modifier, and her attacks can also benefit from the target's 22.9% Defense reduction. Other damage attributes can benefit from the Defense reduction, subject to the game's normal Defense and debuff rules.

These are damage-side benefits only. The panel contains no reference to Highlight, Highlight recovery, gauge fill, enemy defeat, damage taken by the party, round start, turn start, or continuous-damage resolution as a charge source.

Do not infer exact damage multiplication or debuff stacking from this tooltip alone. It establishes the modifier values and conditions, but it does not establish the simulator's damage bucket, Defense formula, overwrite priority, or interaction with Rakunda and other Defense reductions.

## Rank label and trigger limits

`R6` remains the user's loadout label. The direct panel displayed the values above, but the captured transcription did not expose a separate machine-readable refinement index. Community sites may number the base copy and forge upgrades differently. The simulator should identify this evidence tier by its exact displayed values unless a direct rank indicator is captured.

The tooltip also does not resolve:

- whether the 70% check occurs once per skill, hit, target, additional attack, or continuous-damage activation;
- whether 70% is the final probability or an application rate before Wonder's ailment accuracy and the target's resistance;
- whether Evil Eye can stack, only refresh, or overwrite another instance;
- whether a failed application has any cooldown or retry restriction;
- whether Evil Eye was actually present on Hachiman at each recorded checkpoint.

These limits matter for event modeling. A per-hit implementation would be unsupported by the direct text.

## Local source provenance

The simulator's vendored Lufelnet snapshot confirms that a Wonder weapon payload exists upstream, but the payload is missing locally:

- `vendor/lufelnet-data-source/data/weapon-manifest.js` lists `원더`, the Korean name for Wonder, among weapon file character names.
- `vendor/lufelnet-data-source/SOURCE-COMMIT.txt` pins commit `b1c906e58267fa9533459eff3707999862b72e96`.
- `vendor/lufelnet-data-source/package.json` names `https://github.com/absolroot/lufelnet` as its repository.
- `scripts/import-lufelnet.mjs` currently writes `https://github.com/nalaleo808-cmd/lufelnet` into generated catalog provenance, so the repository identity is inconsistent inside this checkout.
- The local vendor directory contains `data/weapon-manifest.js` but no `data/weapon/원더.js`, and the generated simulator catalog contains no weapon collection.

The maintained [Lufelnet Cursed Ties page](https://lufel.net/en/wonder-weapon/curse-of-the-phantom/) independently corroborates the English identity, Evil Eye trigger structure, and base-tier form. Lufelnet identifies itself as an unofficial fan information site, so it is reference corroboration rather than game-confirmed evidence. Its default indexed view shows a different, lower value tier and should not replace the values read from the user's live panel.

## Evidence decision

For a later implementation, the supported loadout facts are Cursed Ties at Lv80/80, its displayed HP/ATK/DEF, and the exact observed Forge Details values. The weapon may explain part of the simulator's damage difference if Evil Eye was active and omitted. It does not explain the Highlight charge difference.

The remaining minimum evidence for event-accurate implementation is a live capture that shows the equipped rank indicator and one controlled Curse action with Evil Eye application timing visible. No battle simulation, replay, optimizer, test, or game action was run for this report.
