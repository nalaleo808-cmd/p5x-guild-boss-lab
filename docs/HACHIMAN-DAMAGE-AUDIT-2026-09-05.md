# Hachiman damage audit, September 5, 2026

Subsequent user correction: each defeated Daisoujou adds 10% to Hachiman's damage taken, capped at four stacks for 40%. This establishes the per-stack coefficient that was missing during this audit. It does not establish the old one-round expiry or an additional wave-clear multiplier. The live implementation applies one aggregate stack bonus immediately as minions die; expiry remains unmodeled and explicitly marked unknown. Historical findings below describe the evidence available during the original audit.

Static inspection only. No battle simulations, optimizer runs, replay tests, or score comparisons were performed. Source line numbers refer to the files inspected before the bounded patch below. The recorded Nexus benchmark remains 3,642,530,108; this audit does not claim a fresh benchmark verification.

## Main finding

The historical 79,006,569 Berry opening boss repeat is the damage formula output, not a Dreamscape score conversion. Its saved inputs are 4,927 equipped Attack, 72% additive Attack, 1.502 S1 power multiplied by 3 for high target HP, approximately 107 effective Defense, approximately 9.7193x combined status effects, and the engine's unconditional 100x scale. These produce the recorded magnitude without any final-score multiplier. Removing 100x would mechanically divide this isolated calculation by 100, but no inspected local source establishes that as the correct live formula. Do not replace it with 1 or tune it against the observed score.

The historical trace predates the current Dreamscape critical conversion, Curse bonus, continuous-damage bonus, role conditional, and Trust + Prosperity update. It must not be presented as a current-engine replay.

## Ranked findings and exact recommendations

### 1. Unsupported numeric Minion Break is applied to live Hachiman

**Verified implementation/evidence mismatch; bounded correction authorized.** `src/data.js:210` defines a 40% damage-taken bonus lasting one shared round. The prior engine applied it once when all summons died. The subsequently supplied Daisoujou photo corrects the earlier transcription: the defeat effect stacks up to four times total, not four stacks per defeat. Neither the per-stack coefficient nor duration is specified. This does not establish a 40% all-wave bonus or its expiry.

Recommended patch: at the all-wave-clear branch, for `isHachimanDreamscape()` and the `minion_break` bonus only, omit the unsupported numeric status, emit a runtime limitation naming the unknown per-stack value and duration, and describe the wave clear without claiming the bonus activated. Keep other profiles, defeated-target handling, Lovesick transfer, shield points, and Down mechanics unchanged. Do not invent a replacement stack coefficient. This removes one unsupported historical multiplier, not a complete explanation or correction of the damage scale.

Implemented in `src/engine.js:2118`: the bounded branch now records `hachiman_minion_break` with missing `damage_taken_per_stack` and `stack_duration`, and emits `numericBonusOmitted: true`. The legacy branch still applies its prior status. `node --check src/engine.js` passed. No simulation or replay verification was performed.

### 2. Runner explanation no longer matches the engine's critical formula

**Verified diagnostic bug; runner owned by primary agent.** `scripts/compare-hachiman-opening.mjs:206` reconstructs the base with rounded `result.defense`. Lines 208-209 then use normal critical-hit damage, while `src/engine.js:1250` now applies the sourced Hachiman Skill/Resonance critical-rate conversion. The reported implied variance therefore absorbs more than variance and Technical damage. Even the old 1.0279617329x factor incorporates rounded-defense reconstruction.

Recommended patch: expose exact effective Defense, base, normalization, and the applied critical-damage multiplier from `calculateDamage`, then have the runner consume those authoritative components. Alternatively label the current explanation an approximation and list the omitted conversion explicitly. Do not infer a live coefficient from this diagnostic residual.

### 3. Berry Chain Critical Rate has broader applicability than the recorded tooltip

**Verified source applicability mismatch for Gun/basic attacks; continuous-damage boundary unresolved.** The direct Mine Alone reading (`HACHIMAN-ROTATION-CHECK-2026-09-05.md:228`) grants 15% Critical Rate to all skills at Chain 2. `refreshBerryPassives` (`src/engine.js:1785`) creates an ordinary `critRate` buff, and `calculateDamage` (`src/engine.js:1233`) applies it to every source, including basic attacks and Gun. This can change critical events and physical/Gun Down behavior. It is not a demonstrated cause of the historical S1 magnitude.

Recommendation, not implemented: preserve recorded-profile behavior and restrict this specific live buff to sourced eligible actions. Direct skills, their repeats, and Highlight need to retain it. Clarify continuous damage and other derived sources before implementing a complete allowlist. Do not broadly suppress all Critical Rate buffs or change the mode's retained critical-event roll.

### 4. Global 100x scale and damage bucket stacking lack live formula evidence

**Unverified assumptions, not proven numerical bugs.** `src/engine.js:1247` uses `760 / (260 + Defense)` and line 1256 multiplies by 100 for all profiles. `statusMultiplier` (`src/engine.js:1164`) separately multiplies equipped damage, every damage buff, weakness, exposure, and other categories. Local tooltips establish many individual values but do not establish all category stacking rules, the constants 760 and 260, the 70% Defense-reduction cap, or the 100x normalization for equipped level-80 live totals.

Recommendation: preserve these coefficients until an independently sourced live formula is available. Mark live damage as provisional and trace factor provenance. A future formula change must be scoped to the live profile and retain the recorded benchmark path. Observed score totals cannot determine the damage formula because the Foe Defense Points accumulation rule is still unknown.

### 5. Equipped totals are not uniformly available

**Known input limitations; no evidenced replacement stats.** `src/default-presets.js:11` supplies Berry's 15 equipped totals. `src/engine.js:109` converts displayed percentages once, and lines 123-127 suppress matching Revelation Attack, HP, Critical Rate, and damage bonuses when those equipped totals are supplied. Thus Berry's 4,927 Attack is not accidentally multiplied by Revelation Attack again. The runner passes no Revelation combat bonus for Berry. Its imported generic S1 200% self-buff is removed by `berrySkill` (`src/engine.js:616`, called at line 2225), so the high-HP effect is not applied twice through that parsed buff.

J&C, Wonder, and Marian still use local defaults for direct combat stats. The engine also derives `mechanicAttack` from imported level-specific data when equipped Attack is absent (`src/engine.js:115`, 134), while direct damage retains `unit.attack`. The result mixes low catalog direct stats with level-specific mechanic scaling. This is an explicit approximation, not evidence for replacing unknown equipped values with either defaults or the T3 buffed display.

An equipped elemental bonus cannot currently be represented independently: `elementBonus` still comes from Revelation (`src/engine.js:150`). The live T3 snapshot separates Damage Multiplier and element bonuses, so it is not valid to assume the 55.9% generic preset already includes all elemental bonuses. No blanket elemental suppression patch is justified. This has no role in the historical runner repeat because its Berry loadout contains no Revelation elemental bonus.

## Source-specific effects checked

- Berry's 15% party continuous damage uses `dotDamage` and reaches direct Berry skills only through the Chain 2 conversion (`src/engine.js:1190`, 1200, 1738). The direct T8 reading supports party +30% mode continuous damage, so it must not be restricted to Berry solely because the earlier screenshot was of Berry.
- J&C Mischief + Service supplies party 24% damage and the Two Masks damage buff according to the catalog descriptions (`src/generated/lufel-catalog.js:22472`, 22605). Their individual values are supported; independent multiplication with every other damage bonus is not established by those descriptions.
- Lovesick's exposure and Defense reduction apply before the boss repeat following transfers. The +4% damage taken and -3% Defense per stack are in the direct live reading. The code stacks the latter with Rakunda, capped at 70%; the exact reduction aggregation and cap remain formula assumptions.
- Skill Amplification is applied globally to `calculateDamage` (`src/engine.js:1242`), although its catalog definition concerns leveled skill and Thief Tactics values (`src/generated/lufel-catalog.js:22605`). Its complete source/value applicability needs a separate audit. It is zero for the opening Mischief + Service trace, so it does not explain 79M.
- Mode critical conversion retains independent critical event rolls. The latest direct Intel explicitly says the conversion applies even when a critical occurs (`HACHIMAN-ROTATION-CHECK-2026-09-05.md:240`). The older screenshot's cannot-critical wording is insufficient to replace that behavior without reconciling the sources.

## Raw damage and score separation

`resolveSkill` credits actual damage through `applyEnemyDamage`, adds it to `totalDamage`, then calls `addDamageScore` (`src/engine.js:2300`). Dreamscape's branch (`src/engine.js:681`) excludes Daisoujou from the damage preview and adds eligible raw damage directly. It does not multiply by difficulty 8 or the observed survival HUD multiplier. Its Foe Defense Points and Turns Survived Bonus remain null.

`src/mode-scoring.js` implements only the independently observed final result composition. That formula must remain separate from preview damage. Finite idols cap actual damage to remaining HP; infinite Hachiman retains the calculated damage. Consequently the four 180,000 idol entries describe capped damage and cannot be used as equivalent per-hit formula measurements.

## Remaining blockers

The live base damage formula, stacking categories, actual Defense and idol HP, Daisoujou stack coefficient/duration, other party equipment, some buff source applicability, and damage-to-score accumulation remain unresolved. Exact hit frames are absent. No damage or score parity is claimed. Preserve the recorded benchmark and Life Sustainment behavior, and defer simulation/replay validation to the user's requested combined pass.
