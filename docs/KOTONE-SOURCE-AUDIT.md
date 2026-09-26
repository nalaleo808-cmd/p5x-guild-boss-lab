# Kotone Shiomi: live Lufel source audit

Retrieved September 26, 2026 (Pacific/Honolulu). The English Kotone page loaded the files below with version query v=5.1.0. I read each complete script through its final assignment and checked the rendered English page with Sync Mindscape unchecked. These are Lufel's published character data and explanatory text, not executable game combat logic.

## Exact sources

| Source | URL |
|---|---|
| Rendered English character page | [Kotone Shiomi](https://lufel.net/en/character/kotone/) |
| Skills and passives | [skill.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/skill.js?v=5.1.0) |
| Awareness | [ritual.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/ritual.js?v=5.1.0) |
| Weapons | [weapon.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/weapon.js?v=5.1.0) |
| Fortune and Sick timing | [review.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/review.js?v=5.1.0) |
| Base stats | [base_stats.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/base_stats.js?v=5.1.0) |

The values below use the **last effective English definitions**. In particular, early Korean and Chinese declarations in skill.js and ritual.js contain older 100%/150% copy text, but later assignments replace it. The page displays the later English values: 30% base copy, multiplied by 1.25 at A2.

## Ordinary Global skills, Sync Mindscape off

The four entries in each source array follow the page's order: **LV10 / LV10 + ordinary Mindscape LV5 / LV13 / LV13 + ordinary Mindscape LV5**. Mindscape LV5 here is the ordinary skill upgrade. It is distinct from the regional **Sync Mindscape** toggle. LV13 values are relevant when the corresponding A3 or A5 skill level increase is active. All percentages below are the published maxima where the skill scales with Kotone's Attack.

| Effect | LV10 | LV10 + M5 | LV13 | LV13 + M5 |
|---|---:|---:|---:|---:|
| Kotone Attack considered for scaling, cap | 4684 | 5164 | 4972 | 5452 |
| Skill 1, Lyre's Melody: critical damage per stack | 19.5% | 21.5% | 20.7% | 22.7% |
| Skill 1, 1 Powerful Bond: Attack | 39.0% | 43.0% | 41.4% | 45.4% |
| Skill 1, 2 Powerful Bonds: pierce rate | 14.6% | 16.1% | 15.5% | 17.0% |
| Skill 1, 3 Powerful Bonds: Final Damage Amplification | 4.9% | 5.4% | 5.2% | 5.7% |
| Skill 2, Burning Moon's Cry: Fire damage per hit | 53.9% | 59.4% | 57.2% | 62.7% |
| Skill 2 at 3 Powerful Bonds: foes' damage taken | 29.3% | 32.3% | 31.1% | 34.1% |
| Skill 2 in Fortune: additional damage wording | 292.8% | 322.8% | 310.8% | 340.8% |
| Skill 3, Lunar Phaseshift: party Attack | 29.3% | 32.3% | 31.1% | 34.1% |
| Highlight: party critical damage | 19.5% | 21.5% | 20.7% | 22.7% |
| Highlight: Arcana Link ally Attack | 24.4% | 26.9% | 25.9% | 28.4% |

**Skill 1:** Costs 20 SP. It buffs one ally's critical damage for 3 turns, up to 3 stacks. If the main target is the Arcana Link ally, it adds 1 Powerful Bond for 3 turns, up to 3 stacks. While Kotone is present, the 1, 2, and 3 stack thresholds provide the Attack, pierce, and Final Damage Amplification values above. Fortune extends this skill's effects by 2 turns.

**Skill 2:** Costs 20 SP. It hits all foes 3 times. Each foe fewer than 5 increases damage by 25%. If the Arcana Link ally has 3 Powerful Bonds, it applies the listed damage taken increase to all foes for 1 turn. Fortune adds the listed damage increase, extends this skill's effect duration by 2 turns, and reduces every damaged target's Down Points by 2 regardless of affinity.

**Skill 3:** Costs 22 SP and has a 2 turn cooldown that **does not count extra actions**. It buffs party Attack for 1 turn. If its main target is another ally who is neither Kotone nor the Arcana Link ally, it copies eligible buffs that ally granted to the Arcana Link ally at **30.0%** of their original effectiveness. The copied effects are described as lasting 1 turn. Fortune extends this skill's effect duration by 1 turn. The source says some special or character specific effects cannot be copied.

**Highlight:** Has a listed 4 turn cooldown. It grants the two listed buffs for 2 turns; Fortune extends the duration by 2 turns.

**Passives:** Leader's Guidance grants the main target +9.0% Attack for 3 turns when Kotone grants buffs, stacking up to 3 times. Clean Sweep grants +12.0% pierce rate for 2 turns when Powerful Bond is granted.

Source: [skill.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/skill.js?v=5.1.0).

## Awareness A0 through A6

| Stage | Final ordinary Global effect |
|---|---|
| A0, Moment of Truth | Owning Kotone grants party +1% Final Damage Amplification per Strategist present in battle, including Wonder's currently equipped Persona, even if Kotone is not deployed. At battle start, the highest Attack Sweeper or Assassin becomes the sole Arcana Link ally. Kotone may reselect the link at the start of her turn. The link ally using a skill, or Kotone using a skill on that ally, increases Lunar Bond by 1, up to 10. At Lunar Bond 1 / 5 / 10 the ally gains +50% Attack / +15% pierce rate / +50% critical damage. Reselecting resets Lunar Bond. Go for Broke can be activated once per battle. |
| A1, Echoing Strings | On entering Fortune, Kotone immediately uses Highlight once without spending its gauge. Granting Arcana Link provides 1 permanent Powerful Bond stack **while that ally remains linked** and sets Lunar Bond to 5. If the target has 3 Powerful Bonds after receiving Skill 1, it gets a further +30% critical damage for 5 turns. |
| A2, Team Mom | In Fortune, all lasting effects granted by Kotone's skills and Highlight gain 1 additional turn. Skill 3's copy multiplier is multiplied by 1.25. Ordinary Global: 30% x 1.25 = **37.5%**. |
| A3, Full Moon Night | Raises the skill levels of Lyre's Melody and Combat Tactics. The skill script publishes LV13 values for Skill 1, shown above. It does not give a Combat Tactics numerical coefficient. |
| A4, Eternal Bonds | Highlight also increases party damage by 25% for 2 turns. |
| A5, Unquenchable Flames | Raises the skill levels of Burning Moon's Cry and Lunar Phaseshift. Their LV13 values are shown above. |
| A6, Song of the Soul | Adds 1 use of Go for Broke, so the total is 2 uses per battle. When Skill 3 is aimed at an ally other than Wonder, and Wonder is not the Arcana Link ally, it also copies eligible buff effects granted by Wonder to the linked ally. The final Korean and Chinese lines say this additional copy uses the applicable **base copy ratio**. Thus the ordinary A6 rate is 37.5% because A2 is already active. Copies last 1 turn by the English text, subject to the timing ambiguity below. |

Source: [ritual.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/ritual.js?v=5.1.0).

## Go for Broke, Fortune, and Cold

Go for Broke enters Fortune and brings Kotone's next 2 turns forward as 2 extra actions. The source describes **3 actions total in the current sequence**. At Fortune's end, the Arcana Link ally automatically activates Highlight or Theurgy. Kotone then enters a 2 turn state called **Sick** in English, or **Cold** in a literal rendering of the Korean text, during which she cannot act. A1 adds Kotone's free immediate Highlight at Fortune entry. Go for Broke has 1 use at A0-A5 and 2 uses at A6. [review.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/review.js?v=5.1.0), [ritual.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/ritual.js?v=5.1.0).

Read the duration bonuses as **Fortune bonus, then A2 bonus**:

| Effect with a stated base duration | Normal | Fortune before A2 | Fortune at A2+ |
|---|---:|---:|---:|
| Skill 1 critical damage and Powerful Bond | 3 turns | 5 turns | 6 turns |
| Skill 2 damage taken debuff | 1 turn | 3 turns | 4 turns |
| Skill 3 party Attack buff | 1 turn | 2 turns | 3 turns |
| Highlight buffs | 2 turns | 4 turns | 5 turns |

These duration arithmetic results follow the tooltip wording; the scripts do not show event scheduling or expiration code. In particular, the precise expiration of Skill 3's copied 1 turn effects, the automatic Highlight/Theurgy trigger, A4's added 2 turn buff, and the two disabled turns need combat testing before being treated as engine verified. Skill 3 explicitly excludes extra actions from its cooldown count. [skill.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/skill.js?v=5.1.0), [review.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/review.js?v=5.1.0).

## Weapons: complete +0 through +6 combat arrays

Each row is one weapon enhancement. Weapon Attack bonuses below apply to Kotone. Ame's temporary Attack buff stacks up to 3 times for 3 turns after granting buffs. Vetri's Skill Amplification applies when the Arcana Link ally has Lunar Bond 5 or higher. Vetri's critical damage bonus applies to any ally with Powerful Bond, once per stack.

| Enhancement | Ame-no-Nuboko Attack | Ame Attack per stack | Vetri Vel Muruga Attack | Vetri Skill Amplification | Vetri critical damage per Powerful Bond |
|---|---:|---:|---:|---:|---:|
| +0 | 12.0% | 7.3% | 30.0% | 10.0% | 6.0% |
| +1 | 12.0% | 9.6% | 30.0% | 13.0% | 7.8% |
| +2 | 16.0% | 9.6% | 39.0% | 13.0% | 7.8% |
| +3 | 16.0% | 11.9% | 39.0% | 16.0% | 9.6% |
| +4 | 20.0% | 11.9% | 48.0% | 16.0% | 9.6% |
| +5 | 20.0% | 14.2% | 48.0% | 19.0% | 11.4% |
| +6 | 24.0% | 14.2% | 57.0% | 19.0% | 11.4% |

The weapon data lists one raw stat block for each weapon, without enhancement specific stat arrays: **Ame-no-Nuboko 4 star:** HP 1807.87, Attack 570.52, Defense 334.73. **Vetri Vel Muruga 5 star:** HP 2259.46, Attack 713.51, Defense 418.4. The page rounds those values. [weapon.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/weapon.js?v=5.1.0).

## Relevant base stats

At A0 level 1: HP **304.38**, SP **100**, Attack **96.12**, Defense **56.37**, critical rate **5%**, critical multiplier **150%**, Speed **100**. Hidden Ability level 7 adds **29% Attack**.

| Awareness at level 80 | HP | Attack | Defense |
|---|---:|---:|---:|
| A0 | 3419.97 | 1080.02 | 633.37 |
| A1 | 3481.57 | 1099.22 | 644.57 |
| A2 | 3543.17 | 1119.22 | 656.57 |
| A3 | 3604.77 | 1138.42 | 667.77 |
| A4 | 3666.37 | 1157.62 | 678.97 |
| A5 | 3727.97 | 1177.62 | 690.17 |
| A6 | 3789.57 | 1196.82 | 702.17 |

Source: [base_stats.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/base_stats.js?v=5.1.0).

## Sync Mindscape values: separate regional variant

The following values appear only in the separate Sync Mindscape descriptions. They should **not** replace ordinary Global values. The source does not change Highlight or passive numerical values under the Sync toggle.

| Sync effect | LV10 | LV10 + M5 | LV13 | LV13 + M5 |
|---|---:|---:|---:|---:|
| Skill 1 critical damage per stack | 39.0% | 43.0% | 41.4% | 45.4% |
| Skill 1, 1 Powerful Bond: Attack | 78.1% | 86.1% | 82.9% | 90.9% |
| Skill 1, 2 Powerful Bonds: pierce rate | 19.5% | 21.5% | 20.7% | 22.7% |
| Skill 1, 3 Powerful Bonds: Final Damage Amplification | 9.8% | 10.8% | 10.4% | 11.4% |
| Skill 2 at 3 Powerful Bonds: foes' damage taken | 58.6% | 64.6% | 62.2% | 68.2% |
| Skill 3 party Attack | 58.6% | 64.6% | 62.2% | 68.2% |

Sync Skill 2 removes **5** Down Points during Fortune rather than 2. Sync Skill 3's **base** copy ratio is 60%; A2 gives 60% x 1.25 = **75%**. These are regional Sync numbers, not the ordinary Global 30% and 37.5%. [skill.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/skill.js?v=5.1.0), [ritual.js](https://lufel.net/data/characters/%EC%BD%94%ED%86%A0%EB%84%A4/ritual.js?v=5.1.0).

## Unresolved implementation ambiguity

1. **Lufel data is tooltip data.** The scripts do not implement combat events. They cannot establish the exact tick when Fortune ends, automatic Highlight/Theurgy occurs, copied buffs expire, or Sick consumes its two turns.
2. **Copy eligibility is not enumerated.** The text excludes enemy debuffs and some special character effects, but it does not provide an exhaustive buff allowlist or rules for duplicate and provenance handling. The final A6 localization supports Wonder as an additional buff source and the current base ratio, while earlier English text is less precise about the source and recipient.
3. **Skill 2's Fortune damage wording is not a formula.** The additional 292.8% / 322.8% / 310.8% / 340.8% values are exact, but the script alone does not settle whether the game applies them as added skill coefficient or another damage term.
4. **Weapon Skill Amplification lacks a formula here.** The 10% / 13% / 16% / 19% tiers and activation condition are explicit. These files do not define exactly how that stat changes the copied buff ratio or every other skill effect.
5. **Combat Tactics and weapon enhancement stats are incomplete here.** A3 names Combat Tactics but gives no numerical upgrade. The weapon script gives combat effect arrays and one raw stat block per weapon, not separate raw HP, Attack, and Defense at each enhancement.

No Mindscape Core values were used.
