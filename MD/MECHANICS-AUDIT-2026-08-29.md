# P5X A6 Character Mechanics Audit

Audit date: 2026-08-29  
Passive parity update: 2026-08-30

## Result

The A6 data layer is now consistent for all 20 imported characters:

- Character base stats use the source `a6_lv80` record.
- Every imported character is tagged Awareness 6 and Skill Level 13.
- Every damage skill and Highlight with four source coefficients uses the fourth coefficient.
- A regression test checks every character, every damage skill, and every Highlight.

This corrected a systemic issue where the first coefficient was previously selected. For example, Miyu's Jellyfish Splash now uses 117.2%, Aerial Tide uses 208.0%, Catch a Wave uses 58.4%, and J&C's selected mask skills use 86.7%.

The stateful mechanics audit found that the full kits are not yet identical for most characters. Their complete source descriptions are present, but the generic engine executes only direct damage and a limited set of simple buffs, debuffs, and healing. The table below separates verified runtime behavior from mechanics that still need dedicated implementation or a gameplay example.

## Character coverage

| Character | Verified runtime behavior | Mechanics still needing dedicated parity |
|---|---|---|
| BLITZ | A6 stats, Level 13 damage, normal affinity damage | Speed scaling, Hard Knocks scaling and cap, Detention, forced Down Point changes, Lightning Legs state and skill limits, both passives |
| BERRY | A6 stats and Level 13 direct damage | Lovesick stacks and duration, Chains of Love, high HP damage bonus, defeat replay, stack scaling on My Beloved Prince, continuous damage activation and critical rules |
| PUPPET Wavecatcher | Starts in Surf at A6; Hang Ten scales Attack from SP Recovery and caps at 280%; Ride It Out grants Surf damage; Jellyfish restoration scales from SP Recovery and can overcap; Catch a Wave, Offshore, Aerial Tide, Surf Highlight, Paddle Out cleanse, Surf immunity, and Surf buff and debuff duration extension | Freeze and item-use restriction |
| MARIAN Beachflower | Soothing Sunlight Blessing stacks and cap; Blossoms by the Beach permanent party Attack and unique medicine-type scaling; Summer Garden scaling and cleanse; Beach Basket max HP damage; Bewitching Blossoms; Gentle Sea Breeze critical formula and two-turn cooldown; two-use Midsummer Prescription; all eight Flower Basket medicines; one medicine per Marian turn; A1 and A6 item effects; ally-targeted Highlight and next-medicine amplification | DOT, ONE MORE, All-Out Attack, Theurgy, and Technical resolution systems outside the current battle model |
| MIKU | A6 Level 13 support values; shared opening and post-use cooldown; Heaven to Spring Storm to Play-With-Fire song cycle; Break, Critical, and Expert Tracks; Track refresh and held-Track conditional; Setlist and Fan Favorite; Showstopper; Ghost Rule; two uncounted Concert party turns; stopped foe turns; MIKU buff extension; support lockout; navigator cooldown freeze; Concert status ticking; A1 Highlight reset and gain; A2 Concert effects; A4 Highlight Attack buff; and per-target A6 Neverending Song recording and fixed Almighty repeat | Highlight sharing 20% of MIKU's stats, because the source does not define which stat fields are shared |
| AKIHIKO | A6 stats and Level 13 direct damage | Grit and Mettle, Lightning Fist hit count and per-stack multiplier, Theurgy gauge, guaranteed critical range, critical passives, Assist behavior |
| YUKARI | A6 stats and Level 13 direct damage | Erosion ownership and transfer, Windswept, attack amplification scaling, damage reduction, Whisperwind, Theurgy reserve, Highlight amplification, cleanse and buff removal, both passives |
| MAKOTO | A6 stats and Level 13 base coefficients | Moon Phase and Full Moon stacks, per-stack hit counts, Scarlet Hades availability, four-stack bonuses, Theurgy gauge, Entrusted Hope triggers, SEES party bonus, Assist behavior |
| ANGE | Cooldown fields and basic party buff and healing fields | Musical Note history and spend rules, cooldown reduction, selected-use healing bonus, automatic heal every 12 notes, attack formulas, Da Capo, stat-share Highlight |
| LUCE | A6 stats, Level 13 direct damage, basic support fields | Blessing stacks, Attack and ailment accuracy passive scaling, Adlib ailment immunity, four Improv states and their different effects, fixed Attack formulas |
| CROW | A6 stats and Level 13 direct damage | Suspicion, Deduction, Stratagem, Arrow of Truth recording, Arrow of Perjury hit distribution, Mastermind, Flames of Desire, Defense-based Almighty scaling, Highlight hit increase |
| TURBO | A6 stats, Level 13 direct damage, basic support fields | Extra-action detection, extra-action damage and critical rules, speed-scaled buffs, shields, selected Highlight mark, Down Point bonus, downed foe passives |
| VIOLET | A6 stats and Level 13 direct damage | Lead Step and Follow Step, Dance Partner selection, Cinderella Glow follow-up, Masquerade mode, Step scaling, Highlight and Theurgy reactions |
| RIN Firecracker | A6 stats and Level 13 direct damage | Burn and Year-End Flames, Yanhua Slash replacement action, free Orange Blossom Blade action, cooldown, Technical triggers, Happy New Year duration reset and upgraded Attack buff |
| MATOI | A6 stats and Level 13 direct damage | Extinguish stacks, Freeze and Icebound, Burn conversion to Scald, ailment-accuracy scaling, Technical Precision, Ice Technical results, skill evolution at four stacks, shields from Technicals |
| WIND Tempest | A6 stats and Level 13 direct damage | SP Recovery passive, Falling Petals, Arrival of Spring one-time SP trigger, Blossoming Season spend thresholds, Unravel and Blossom stacks, critical multiplier scaling, Highlight ally targeting |
| HOWLER | A6 stats and Level 13 direct damage, basic Defense and damage-taken fields | Ailment accuracy scaling, Burn, Big Welcome and Furrocious Follow-Up, two Woof Woof Blaze branches, Resonance flags, elemental and Resonance exposure, Enthusiastic Fuse stacks |
| MONT Frostgale | A6 stats and the source fourth coefficient for each dual-mode skill | Spring and Winter mode choice, dual element and coefficient selection, Edge states, Vestige stacks, ally-triggered follow-ups, shields, mode-specific ailments, Resonance finishers, mode-specific Highlight branches |
| J&C | Locked two-mask loadout; either S1 or S2 available as the opening choice; opposite-slot alternation after that choice; only selected masks visible; automatic Two Masks; Facades; source-domain A6 Desire; A1 start trigger; free A6 True Desire ON/OFF decision with spend-on-resolution; Level 13 coefficients; all six Oxymoron pairs; Service healing and damage reduction; pair shields, Down Point, ailments, Blessing, exposure, and Rebel Surveillance; Service Highlight healing and max HP | Independent cooldown tracking for the two selected Highlights |
| NOIR | A6 stats and Level 13 direct damage | Target Audience transfer, Focused, Painpoint, Spillover and Overload Rounds, ranged follow-up damage, Area to Improve, Thoughtful Round, ailment accuracy scaling |

## Evidence needed for exact timing

The source text is enough for coefficients, but several systems need gameplay examples to settle timing and interface behavior. The highest-value examples are:

1. MONT Frostgale switching or starting Spring and Winter modes, including when Edge finishers fire.
2. One stack-based attacker, preferably MAKOTO or AKIHIKO, showing stack gain, availability gates, and hit count.
3. One follow-up attacker, preferably VIOLET or CROW, showing automatic action timing and target selection.

One short recording per mechanic family is enough. It does not need to be a full score run.
