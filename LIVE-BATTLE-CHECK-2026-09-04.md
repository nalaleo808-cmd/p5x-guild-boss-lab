# Live Battle Check - 2026-09-04

## Scope

- Purpose: Record live evidence from one complete Hachiman Nightmare battle, including J&C selected-mask Highlight cooldowns, Alt controls, Marian medicine and skill cooldowns, MIKU Virtual Concert, mode timing, and the result calculation.
- Battle: Hachiman Nightmare, difficulty bonus 8, Multidimensional Dreamscape.
- Party: Wonder, J&C, Beachflower Marian, co-op Ichigo, and MIKU.
- Selected J&C masks: Mischief and Service.
- Evidence policy: Preserve UI and tooltip observations as observed. Keep inferred mechanics and untested claims separate. Do not use simulator behavior as evidence of live-game timing.

## Result and Confirmed Findings

- Final result-screen score: 2,065,787,456 at Challenge Difficulty NIGHTMaRe and Difficulty Bonus 8.
- Result-screen components: Foe Defense Points +258,098,432; Turns Survived 6; Turns Survived Bonus +125,000.
- The displayed result formula is confirmed for this run: (258,098,432 + 125,000) x 8 = 2,065,787,456.
- J&C Mischief and Service Highlights maintain independent cooldown states.
- A selected-mask Highlight cooldown decrements during resolution or completion of J&C's counted action, including J&C actions inside Virtual Concert. Other allies' actions and party-loop boundaries did not decrement it in the isolated comparisons.
- MIKU Showstopper immediately reset or cleared both selected-mask cooldowns before any Concert ally action.
- J&C Alt behaved as a one-shot stored enhancement in this battle. Ichigo Alt opened DOUBLE BERRY and its observed one-time skill availability matched the cited fan reference.
- Marian's medicine menu displayed base effects, while four observed applied magnitudes were each 1.58 times their relevant base value. Applied medicine durations reached 3 turns, consistent with the fan reference's A0 and A6 extensions; the live passive text remains unverified.
- Gentle Sea Breeze repeatedly followed Marian's owner-turn cadence, including her Virtual Concert turns: cast turn, badge 2 next turn, badge 1 following turn, ready on the fourth turn including the cast turn.
- Attack Turns Left reaching 0 did not immediately end this battle. Play continued through at least Wonder Action 40 before Auto completed the remaining phase.

This evidence flags simulator gaps in J&C selected-mask Highlight clocks and Concert reset, J&C Alt semantics, Ichigo's stateful A6 Alt behavior, Marian's owner-turn cooldown and medicine modifiers, and this mode's ending and score composition. No fixes were implemented. The existing Nexus benchmark remains preserved, and optimizer rotations should be rerun and replayed after confirmed mechanic fixes rather than treated as validated for this observed team and mode.

## Direct UI and Tooltip Observations

### Mode and battle state

| Point | Observation |
| --- | --- |
| Mode text before battle | "Each turn, the boss's attacks grow stronger, and you get more points!" |
| First captured battle state | Action 06, Wonder acting, Attack Turns Left 5, Total Score 0, Survival Bonus Points x0.5. |
| Boss HUD | Hachiman's HP displayed an infinity icon. |

### Hachiman details before the first party action

| Field | Observed value or text |
| --- | --- |
| Level | 82 |
| HP | 100% |
| Resistances | Fire, Ice, Electric, Nuclear |
| Weakness | Curse |
| Permanent Special Effect | Increase final damage taken by 20% and decrease final damage dealt by 60%. |
| Berserk | Gain a set amount of increased damage. No numeric value was shown in the supplied observation. |
| Immunities | Null Insta-kill; Null Spiritual Ailment; Null Control Ailment. |

### Hachiman skills

| Skill | Directly observed tooltip text or value |
| --- | --- |
| Makouha | 57.6% ATK, AoE Bless damage. |
| Mahama | 39.9%. |
| Mahamaon | 45%. |
| Megidolaon | 43.5% Almighty damage, ignores Defense. |
| Matarukaja | Increase party ATK by 10.9%, plus 0.9% per 500 user ATK, up to 7.2% more, for 3 turns. |

These values are observations from this specific live battle. They are not generalized to other Hachiman levels, difficulties, modes, or patches.

### Beachflower Marian Flower Basket Pharmacy

At Action 17, Marian's free Flower Basket menu directly displayed all eight medicines:

- Attacker Tablet
- Defender Tonic
- Fighter Salve
- DOT-Up
- Reso-Up
- Technica-Up
- HL-Up
- 1 More-Up

| Medicine | Quantity shown | Direct tooltip observation |
| --- | --- | --- |
| Attacker Tablet | x1 | Increase 1 ally's Attack by 30% for 1 turn. |
| Defender Tonic | x1 | Increase 1 ally's Defense by 45% for 1 turn. |
| DOT-Up | Earlier quantity uncertain; later Concert menu showed x11 | Increase continuous damage by 2.5% for 1 turn. When used by Minami or Beachflower Minami, increase continuous damage by 10%. |
| Fighter Salve | Not recorded | Increase damage by 25% for 1 turn. |

The live menu tooltip names the first medicine "Attacker Tablet." It displays a base duration of 1 turn for both Attacker Tablet and Defender Tonic. Applied status evidence below shows that these menu durations do not directly equal the effective post-application durations in this battle.

#### Applied medicine status evidence

At Action 24, the remaining free Defender Tonic was used on Ichigo. The action remained 24, the Highlight gauge remained 89%, MIKU cooldown badge remained 2, the flower icon became gray and empty, and the basket control disappeared. Ichigo's HP changed from 8,142 to 9,753. This HP change is recorded without assigning a cause.

After scrolling Ichigo's status panel, the following exact applied rows were visible:

| Applied status | Menu tooltip base | Effective status row |
| --- | --- | --- |
| Attacker Tablet, applied at Action 17 | ATK +30% for 1 turn | ATK +47.4%, 2 turns remaining at Action 24 |
| Defender Tonic, applied at Action 24 | DEF +45% for 1 turn | DEF +71.1%, 3 turns immediately after application |
| DOT-Up, applied during Marian's second Concert turn | Beachflower-specific continuous damage +10% for 1 turn | Continuous damage +15.8%, 3 turns immediately after application; 2 turns remaining at Action 37 |
| Fighter Salve, applied at Action 37 | Damage +25% for 1 turn | Damage +39.5%, 3 turns immediately after application |

Four observed effective medicine magnitudes share the same 1.58 ratio: 47.4 / 30 for Attacker Tablet, 71.1 / 45 for Defender Tonic, 15.8 / 10 for Beachflower's DOT-Up, and 39.5 / 25 for Fighter Salve. The passive, weapon, or other source that produces this magnitude multiplier has not yet been established.

During Marian's second Virtual Concert turn, DOT-Up was used on Ichigo through the free Pharmacy. The applied status immediately showed continuous damage +15.8% for 3 turns. Relative to the Beachflower-specific displayed value of 10%, the effective ratio is again 1.58. The 3-turn applied duration is consistent with the displayed 1-turn base plus the A0 and A6 one-turn extensions described by the Lufel fan reference. No Marian Highlight had been used at any point, so Marian Highlight cannot explain this observed magnitude or duration. A simulator value of 25% for DOT-Up would conflict with this live battle evidence.

At Marian Action 37, the Fighter Salve menu tooltip directly showed a base effect of damage +25% for 1 turn. Fighter Salve was used on Ichigo. Its applied status immediately showed damage +39.5% for 3 turns. The magnitude ratio is again 1.58: 39.5 / 25 = 1.58. The duration again matches the 1-turn base plus the A0 and A6 one-turn extensions described by the Lufel fan reference.

The same Action 37 Ichigo status panel showed a separate permanent Special Effect: "Cannot activate critical hits, but increase final damage by 324.3%." It also remained separate from Ichigo's permanent continuous damage +30% effect. The 324.3% value is recorded only as Ichigo's active modifier in this battle and is not extrapolated into a universal formula.

A fan reference, [Lufel's Beachflower Marian character page](https://lufel.net/en/character/marian-beachflower/), states that Flower Basket Pharmacy extends medicine effects by 1 turn at A0 and extends them by another 1 turn at A6. This gives a source-supported explanation for the observed 3-turn Defender Tonic status from a 1-turn base tooltip: 1 base + 1 at A0 + 1 at A6 = 3 turns. This is not an official source and has not yet been checked against Marian's live in-game kit text. No Marian Highlight had been used, so it cannot explain the observed duration. The 1.58 effective magnitude remains unresolved.

### Ichigo Alt control and DOUBLE BERRY

At Action 32, clicking Ichigo's Alt control opened the DOUBLE BERRY menu without immediately casting or consuming the turn. The menu displayed these states:

| Option | Displayed state |
| --- | --- |
| Vorpal Butterfly | Clock badge 1 |
| Obsessive Rose | Bright green, 20 SP |
| My Beloved Prince | Dark, 22 SP |
| Highlight | Dark |

Clicking My Beloved Prince twice and Highlight twice displayed their tooltips only and did not open target selection. The second click on Obsessive Rose opened target selection. Selecting Hachiman and confirming the boss-heart control successfully cast the skill. Its tooltip showed 124.4% ATK Curse damage and +4 Lovesick.

During the animation, Hachiman's Lovesick changed from 7 to 12. At the later settled Action 34 state it showed 15, while Ichigo's Chain count remained 2. The observed 7 to 12 to 15 sequence is consistent with an initial application plus a repeat that reaches the 15 cap, but the exact hit and application breakdown was not captured. Ichigo's actual SP after the cast was not visible. The Alt skill ended Ichigo's normal turn and was not a free extra action.

A fan reference, [Lufel's Berry character page](https://lufel.net/en/character/berry/), states that A6 unlocks an S1 repeat at 1 Chain, an S2 repeat at 2 Chains, an S3 repeat at 3 Chains, and one free Highlight at 4 Chains. This supports Obsessive Rose availability and a repeat at the observed 2 Chains, but the full threshold table has not been live-verified in this battle.

The first Virtual Concert party turn provided direct live evidence for the S3 threshold. At Chains 2 on Action 32, My Beloved Prince was dark and could not open target selection. Ichigo then used her ordinary Highlight during the first Concert turn, after which Chains increased from 2 to 3. DOUBLE BERRY then showed My Beloved Prince available, and it successfully cast on Hachiman for 22 SP. The post-cast status panel showed SP 075/100 and Chains of Love 3, permanent, from a pre-cast SP value of 97. This confirms one 22 SP charge, confirms S3 availability at Chains 3, and shows that the Alt S3 did not consume Chains in this use.

The same Lufel fan reference describes A6 A World of Our Own as allowing each of its four effects once per battle. During Ichigo's second Concert turn, Obsessive Rose and My Beloved Prince were dark without cooldown badges after their prior Alt uses, while Vorpal Butterfly was bright and ready. At Action 38, after Vorpal Butterfly, Obsessive Rose, and My Beloved Prince had each been used once through Alt, the Alt or DOUBLE BERRY button was absent. This live availability pattern supports the once-per-battle constraint. The full set of four one-time effects was not exhausted in this observed battle.

### MIKU Virtual Concert Highlight reset

The immediate before-and-after Showstopper comparison at Action 34 directly establishes a J&C selected-mask cooldown reset on Virtual Concert activation in this battle. Before Showstopper, at full Highlight gauge, J&C's portrait was disabled with clock badge 2 and the chooser would not open. Immediately after Showstopper, before any Concert ally action, the J&C portrait was enabled. The chooser opened and both Mischief and Service showed no cooldown badge, even though Mischief had been used at Action 16 and Service at Action 25. Action 34, Attack Turns Left 1, Survival Bonus Points x2, and Total Score 12,799,631 were unchanged.

A fan reference, [Lufel's MIKU character page](https://lufel.net/en/character/miku/), attributes this effect to A1 Hologram Screen, which resets all allies' Highlight cooldowns when Virtual Concert activates. That attribution is source-supported but was not independently tied to MIKU's live Awareness level through a new in-game inspection during this battle.

The simulator's `src/engine.js` `startVirtualConcert` implementation at lines 853-896 sets each unit's Highlight gauge to 100 when MIKU Awareness is at least 1, but the engine has no per-mask J&C Highlight cooldown state to reset. No code change has been made during the live battle.

The Lufel MIKU fan reference and the simulator both place A6 Neverending Song at the end of Virtual Concert, after the second party loop. The score increase observed from Ichigo's Alt S3 through the next actor in the second Concert round is therefore not validated as a MIKU echo, and missed intervening frames prevent assigning the entire delta to Ichigo's direct skill. After Ichigo's final second-loop action, the score moved from a mid-attack 103,689,240 to a settled post-Concert 226,644,192, but individual echo damage was not isolated because intervening frames were missed.

## Inferences Supported by Current Evidence

- The battle is using Multidimensional Dreamscape, and its displayed mode text describes stronger boss attacks and increased points each turn.
- The infinity HP icon indicates the HUD is not presenting a finite HP total. This observation alone does not establish any hidden HP-floor, Life Sustainment, break, or defeat rule.

## Current Findings and Remaining Uncertainties

- J&C's selected-mask Highlights have independent cooldown states. Service successfully cast while Mischief displayed a cooldown badge.
- J&C's selected-mask Highlight cooldown decrements during resolution or completion of J&C's counted action. It does not decrement on other allies' actions, J&C turn start, boss or normal party-loop boundaries, Concert party-loop boundaries, or Concert exit in the observed comparison intervals.
- J&C's counted actions inside Virtual Concert decrement the selected-mask Highlight cooldown. Virtual Concert does not freeze this cooldown.
- Virtual Concert activation immediately reset or cleared both J&C selected-mask cooldowns before any Concert ally action. Attribution to MIKU A1 Hologram Screen is supported by the Lufel fan reference and remains pending a live Awareness inspection.
- Whether a selected-mask Highlight cast earlier in the same J&C turn receives a grace period before that turn's counted action decrement remains unresolved because the immediate post-Highlight cooldown number was hidden by the empty gauge.
- J&C Alt behaved as a one-shot activation in this battle. The blue button disappeared and Power to Resist Ruin appeared, conflicting with the handoff's reversible ON/OFF model. Full True Desire stack consumption and the automatic Two Masks as One hit distribution remain unverified.
- Ichigo Alt is live-confirmed to open DOUBLE BERRY. Availability at Chains 2 and 3, one-time S2 and S3 use, and disappearance of Alt after S1, S2, and S3 were each used are live-observed. The full four-effect A6 sequence was not exhausted.
- Gentle Sea Breeze showed a repeatable owner-turn cadence that included Marian's Concert turns: cast, badge 2 on her next turn, badge 1 on her following turn, then ready on her fourth turn including the cast turn.
- The medicine menu shows base values and 1-turn durations, while applied effects receive a 1.58 magnitude and reach 3 turns in this battle. The Lufel fan reference supports A0 and A6 duration extensions. The source of the 1.58 magnitude remains unresolved.
- Attack Turns Left reaching 0 did not end the battle. The game proceeded from boss Action 39 to playable Wonder Action 40 with Attack Turns Left still 0. No numeric hard-stop explanation was visible.
- No Life Sustainment lock rule has been observed for this battle or mode.
- Berserk's numeric damage increase is unknown.
- The exact event that changed Survival Bonus Points from x0.5 to x1 is unknown. The available animation screenshot establishes the changed value during Ichigo's attack, but not the precise trigger.
- The source and derivation of J&C's active 117.9% final damage modifier and Ichigo's 324.3% final damage modifier are unresolved.
- No engine change has been made during the live battle.

## J&C Cooldown Observation Log

| Sequence | Battle marker | Acting unit or event | J&C Highlight gauge | Mischief UI state | Service UI state | Direct observation | Interpretation status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | Action 06; Attack Turns Left 5 | Wonder acting | Not yet recorded | Not yet recorded | Not yet recorded | Initial battle-state capture only. | No cooldown inference. |
| 1 | Action 07; Attack Turns Left 5 | J&C acting | Unnamed bottom-right meter showed 42% | Highlight state not recorded | Highlight state not recorded | Both manual mask skills were selectable. Mischief was used on Hachiman without True Desire. | Manual skill availability does not establish Highlight eligibility or cooldown state. No Highlight had been used. |
| 2 | Action 16; Attack Turns Left 4 | J&C acting | 100% before use | Selectable in actual Highlight chooser | Selectable in actual Highlight chooser | Clicking J&C opened the Highlight chooser with both selected-mask icons. Mischief Highlight was used. It displayed party ATK +28.4% and damage +39.8% for 2 turns. | Confirms both masks were Highlight-eligible before the first use. Cooldown test starts here. |
| 3 | Action 16 unchanged, immediately after Mischief Highlight | J&C still acting | 0% | Numeric cooldown not observable | Numeric cooldown not observable | Score remained 185,758, Survival Bonus Points remained x1, and MIKU support badge remained 3. Clicking J&C at 0% opened the status panel instead of the Highlight chooser. | Confirms the Highlight did not advance the Action counter. Does not reveal either mask cooldown state. |
| 4 | Action 17; Attack Turns Left 4 | Marian acting after J&C used manual Service | 17% | Highlight state not observable | Highlight state not observable | MIKU cooldown badge showed 2 and Marian's flower counter showed 2. | One post-Highlight action-state capture. The meter increase alone does not identify the selected-mask cooldown clock. |
| 5 | Action 18; Attack Turns Left 4 | Ichigo acting | 34% | Highlight state not observable | Highlight state not observable | MIKU cooldown badge showed 1. | Second post-Highlight action-state capture. Highlight gauge growth still prevents direct inspection of either selected-mask cooldown. |
| 6 | Action 22; Attack Turns Left 3 | Wonder acting after enemy actions | 55% | Highlight state not observable | Highlight state not observable | Third ordinary party turn after the first Highlight. MIKU showed ready. Spring Storm was the displayed song, with one cyan Track before the support action. | The gauge remained below 100%, so this state does not reveal either selected-mask cooldown. All clock models remain unresolved. |
| 7 | Action 23; Attack Turns Left 3 | J&C acting | 72% | Highlight state not observable | Highlight state not observable | MIKU cooldown badge showed 3. J&C used manual Mischief on Hachiman and left True Desire untouched. | No additional Highlight occurred, so this does not test mask cooldown eligibility. |
| 8 | Action 24; Attack Turns Left 3 | Marian acting | 89% | Highlight state not observable | Highlight state not observable | MIKU cooldown badge showed 2. | Gauge remained below 100%. No additional Highlight occurred and both mask cooldown states remained hidden. |
| 9 | Action 25; Attack Turns Left 3 | Ichigo acting after Marian's Beach Basket | 100% | Clock badge 3 | No cooldown badge | Clicking J&C opened the actual Highlight chooser. The only J&C Highlight used so far was Mischief at Action 16. Between the Action 16 Highlight and this capture, J&C had normal actions at 16 and 23, and ordinary party actions were observed at 17, 18, 22, and 24. | Confirms differentiated selected-mask state at full gauge. It does not isolate whether decrements occur on J&C actions, other ally actions, party turns, or another boundary. |
| 10 | Action 25 unchanged, immediately after Service Highlight | Ichigo still acting | 0% | Cooldown state hidden at 0% | Newly used; cooldown state hidden at 0% | Service Highlight cast successfully, its healing animation played, and the party was healed. Action remained 25, MIKU cooldown badge remained 1, and score remained 2,245,499. | Confirms the unused selected mask could activate independently while Mischief showed clock badge 3. The cast did not advance the Action counter or MIKU cooldown badge. |
| 11 | Action 29; Attack Turns Left 2 | Wonder acting after enemy actions | 21% | Cooldown state hidden below full gauge | Cooldown state hidden below full gauge | MIKU showed Play-With-Fire ready. A third Feel the Beat was used, Action remained 29, MIKU cooldown badge became 4, and cyan, yellow, and purple Tracks were all visible. | The gauge remained below 100%, so neither selected-mask cooldown could be inspected. |
| 12 | Action 30; Attack Turns Left 2 | J&C acting during and after Alt-control animation | 38% | Cooldown state hidden below full gauge | Cooldown state hidden below full gauge | Before and after Alt, score was 5,712,769, Survival Bonus Points x2, MIKU cooldown badge 3, J&C SP 73, Highlight gauge 38%, and Action 30. The blue Alt button disappeared after the animation. J&C's initially visible status rows showed Facade Mischief, permanent; Twin Wardens, Desire Level 120, permanent; and new Power to Resist Ruin, permanent, with text "Strengthen next activated Two Masks as One." | Confirms a one-shot live Alt activation and a stored enhancement for the next Two Masks as One. It conflicts with the handoff's reversible ON/OFF model. Full True Desire status consumption remains unproven without a complete before-and-after status comparison. |
| 13 | Action 31; Attack Turns Left 2 | Marian acting after J&C manual Service and automatic sequence | 59% | Cooldown state hidden below full gauge | Cooldown state hidden below full gauge | MIKU cooldown badge showed 2. | No additional Highlight occurred. The selected-mask cooldown states remained hidden below full gauge. |
| 14 | Action 32; Attack Turns Left 2 | Ichigo acting through DOUBLE BERRY | 76% | Cooldown state hidden below full gauge | Cooldown state hidden below full gauge | MIKU cooldown badge showed 1. Obsessive Rose cast through the Alt menu and ended Ichigo's normal turn. | No J&C Highlight occurred. The mask states remained hidden below full gauge. |
| 15 | Action 34; Attack Turns Left 1, before Virtual Concert | Wonder acting after boss action | 100% | Individual mask state not visible | Individual mask state not visible | J&C's portrait showed clock badge 2 and was disabled. Clicking did not open the Highlight chooser, so neither individual mask could be read. MIKU showed ready with all three Tracks, and the song displayed Heaven (ATOLS Remix). | Confirms J&C Highlight was blocked at full gauge before Concert with an overall portrait badge 2. The badge cannot be assigned to Mischief, Service, or a combined readiness rule from this capture. |
| 16 | Action 34 unchanged, immediately after Showstopper and before any Concert ally action | Concert starting | 100% | No cooldown badge | No cooldown badge | J&C's portrait changed from disabled with clock badge 2 before Showstopper to enabled immediately afterward. The chooser opened and both masks had no cooldown badge. Mischief had been used at Action 16 and Service at Action 25. Action 34, Attack Turns Left 1, Survival Bonus Points x2, and Total Score 12,799,631 were unchanged. | Directly confirms that Virtual Concert activation reset or cleared both displayed selected-mask cooldowns before any Concert ally action. It does not rely on Concert turns advancing a clock. |
| 17 | Action 34 unchanged, before the first Concert ally action | Mischief Highlight interrupt | 100% to 0% | Successfully cast, new cooldown hidden at 0% | No cooldown badge before the cast; hidden at 0% afterward | Reset Mischief Highlight was successfully cast. Action 34, Attack Turns Left 1, Survival Bonus Points x2, and Total Score 12,799,631 remained unchanged. | Starts a new post-reset Mischief cooldown interval inside Virtual Concert. |
| 18 | Action 34 unchanged, first Concert party turn | Wonder then J&C then Marian | 0% to 34% to 68% to 100% | Clock badge 3 when gauge reached 100% | No cooldown badge when gauge reached 100% | Wonder used Tarukaja on Ichigo. J&C then used manual Mischief on Hachiman, starting from SP 99. Marian's Gentle Sea Breeze showed disabled clock badge 2, and Marian used Beach Basket. At Ichigo's turn, the chooser opened at full gauge and displayed the mask states. | Establishes the live clock badge 3 state after these three Concert ally actions. Exact decrement timing remains unresolved because the immediate post-cast cooldown number was hidden at 0% gauge. No boss turn or normal Action advance occurred. |
| 19 | Action 34 unchanged, end of first Concert party turn | Ichigo ordinary Highlight then DOUBLE BERRY S3 | 100% to 0% after Highlight, then 42% at next actor | Cooldown state hidden below full gauge | Cooldown state hidden below full gauge | Ichigo's ordinary Highlight raised Chains from 2 to 3 without changing SP 97. My Beloved Prince then became available in DOUBLE BERRY and successfully cast for 22 SP. At the next actor, Ichigo showed SP 075/100 and Chains 3. | Confirms Ichigo's Alt S3 unlock at Chains 3, one 22 SP charge, no Chain consumption, and normal Concert-turn consumption. It does not expose J&C mask cooldowns. |
| 20 | Action 34 unchanged, second Concert party turn through Marian's medicine | Wonder then J&C, Marian still acting | 42% to 76% to 100% | Clock badge 2 at Marian's turn | No cooldown badge at Marian's turn | Wonder used Universal Theoria on Ichigo. J&C, starting at SP 90, used manual Service on Hachiman and its automatic sequence resolved. Marian's Gentle Sea Breeze showed disabled clock badge 1. Marian canceled Beach Basket targeting before casting, returned to the main controls, opened the free Pharmacy, and used DOT-Up on Ichigo. Action 34 and the battle counters remained unchanged. | Mischief changed from clock 3 at the prior chooser reading to clock 2 during Concert, directly confirming cooldown advancement inside Concert. The exact action or boundary responsible remains unresolved. |
| 21 | Action 34 unchanged, Ichigo's second Concert turn start | Ichigo acting | 100% | Clock badge 2 | No cooldown badge | The chooser state was unchanged after Marian's free DOT-Up and normal Beach Basket action. Ichigo SP was 86 and Chains 3. | Confirms Marian's second Concert action did not decrement Mischief clock 2. |
| 22 | Action 35, immediately after Concert exit | Wonder acting | 100% | Clock badge 2 | No cooldown badge | Ichigo completed the eighth Concert party action with Alt Vorpal Butterfly. Concert ended and the normal Action counter advanced once from 34 to 35. The chooser state remained unchanged. | Confirms Ichigo's second Concert action, the second loop boundary, and Concert exit did not decrement Mischief clock 2. |
| 23 | Action 36, J&C turn start before any J&C action | J&C acting | 100% | Clock badge 2 | No cooldown badge | Wonder had used Revolution as the normal Action 35 move. At J&C turn start, score was 226,644,192, J&C SP 81, and the chooser still showed clock 2. | Confirms Wonder's Action 35 and J&C turn start did not decrement Mischief clock 2. |
| 24 | Action 37, immediately after J&C manual Mischief | Marian acting | 100% | Clock badge 1 | No cooldown badge | J&C used manual Mischief on Hachiman for 20 SP. At Marian's next turn the chooser showed clock 1. | Isolates the 2 to 1 decrement to resolution or completion of J&C's counted action in this interval. |
| 25 | Action 37 unchanged, Service Highlight and free medicine interrupts | Marian still acting | 100% to 0% | Cooldown state hidden at 0% | Successfully cast, new cooldown hidden at 0% | Service Highlight successfully cast as a free interrupt. Fighter Salve was then used through the free Pharmacy. Action 37, Attack Turns Left 1, Survival Bonus Points x2, score 226,906,304, Highlight gauge 0%, and Marian SP 71 remained unchanged after the medicine. The Pharmacy button vanished and the flower icon became black and empty. | Confirms both interrupts did not consume Marian's counted action. Service's new cooldown remained hidden at 0% gauge. |

## Live Action Timeline

| Action | Actor or event | Direct observation | Score and battle HUD |
| --- | --- | --- | --- |
| 06 | Wonder | Used Revolution with Dionysus. | Attack Turns Left 5. Initial Total Score was 0 and Survival Bonus Points was x0.5. |
| 07 | J&C | Bottom-right meter showed 42%. Both manual masks were selectable. Used Mischief on Hachiman with no True Desire toggle. During the hit, Damage showed 11,123. | During the hit, Total Score showed 5,561 and Survival Bonus Points showed x0.5. |
| 08 | Beachflower Marian | Bottom-right meter showed 59%. Gentle Sea Breeze tooltip showed 25 SP and a cooldown of 2 turns. Used Gentle Sea Breeze on Ichigo. | Total Score showed 10,939. |
| 09 | Ichigo | Bottom-right meter showed 76%. Marian's flower counter showed 2. Used Vorpal Butterfly on Hachiman. Tooltip showed a 1-turn cooldown, 20 SP, 150.2% ATK single-target Curse damage, 2 Lovesick, and skill damage +200% if HP is above 70%. During the attack, Damage showed 323K. | Total Score showed 172,936. Survival Bonus Points changed to x1 while Attack Turns Left remained 5. |
| 12 | Enemy action point | Enemy action observed. | Attack Turns Left 4, Total Score 185,758, Survival Bonus Points x1. |
| 15 | Wonder and MIKU interrupt | Before the navigator action, the bottom-right meter showed 97%. MIKU used Feel the Beat during Heaven as a free action. Action remained 15 afterward and the support badge showed 4. The tooltip showed party ATK +0.57% per 100 MIKU ATK, counting up to 5,368 MIKU ATK and a maximum of 30.5%, for 3 turns. Wonder then used Universal Theoria on Ichigo, granting party ATK +33% and primary damage +22% for 2 turns. | Attack Turns Left 4, Total Score 185,758, Survival Bonus Points x1. |
| 16 | J&C and Highlight interrupt | The bottom-right meter showed 100% and the MIKU support badge showed 3. Clicking J&C opened the actual Highlight chooser with both selected-mask icons. Mischief Highlight was used and displayed party ATK +28.4% and damage +39.8% for 2 turns. After the animation, the meter showed 0%. At 0%, clicking J&C opened the status panel rather than the Highlight chooser. | Action remained 16, Attack Turns Left 4, Total Score 185,758, Survival Bonus Points x1, MIKU support badge 3. |
| 17 | Beachflower Marian after J&C manual Service | J&C's bottom-right Highlight meter showed 17%. MIKU cooldown badge showed 2 and Marian's flower counter initially showed 2. Marian opened the free Flower Basket Pharmacy menu, which displayed all eight medicines. Attacker Tablet and Defender Tonic each showed quantity x1 and their direct tooltip values recorded above. Attacker Tablet was used on Ichigo as a free action. Action remained 17, the free-basket control disappeared, and the flower display changed from a numbered 2 to an unnumbered flower icon. Gentle Sea Breeze was gray and disabled with clock badge 2; clicking it did not begin a cast. Marian then used Beach Basket AoE. | At the captured Action 17 state, Attack Turns Left 4, Total Score 185,758, and Survival Bonus Points x1. The unchanged score means no scored damage from the preceding manual Service cast or the free medicine use was captured. The unnumbered flower icon is not treated as a numeric count. |
| 18 | Ichigo | J&C Highlight meter showed 34% and MIKU cooldown badge showed 1. Vorpal Butterfly was gray and disabled with clock badge 1 on Ichigo's next observed turn after its Action 09 cast. Ichigo used My Beloved Prince on Hachiman for 22 SP. The tooltip showed 296.6% ATK plus 13.6% per Lovesick; at 10 or more Lovesick, add 138.2% ATK Curse damage; refresh Lovesick duration. | Total Score 235,246. |
| 22 | Wonder and MIKU interrupt | This was the third ordinary party turn after enemy actions. J&C Highlight meter showed 55%. MIKU showed ready, the displayed song was Spring Storm, and one cyan Track was present before the support action. A second Feel the Beat was selected and its animation was visibly confirmed. Afterward, Action remained 22, MIKU cooldown badge showed 4, the Highlight gauge remained 55%, and cyan plus yellow Tracks were visible. Wonder then used Tarukaja on Ichigo for 22 SP. Its tooltip showed ATK +17.1%, plus 1.4% per 500 user ATK up to +11.4%, for 3 turns. No Showstopper and no further J&C Highlight had occurred. | Attack Turns Left 3, Total Score 2,012,276, Survival Bonus Points x1.5 before the normal Wonder action. |
| 23 | J&C | Highlight gauge showed 72% and MIKU cooldown badge showed 3. J&C used manual Mischief on Hachiman with True Desire untouched. A mid-hit screenshot showed Damage 43,809. | Total Score moved from 2,012,276 to 2,077,989, a delta of 65,713. This single delta is consistent with the displayed x1.5 bonus after rounding behavior, but does not establish a universal score formula. |
| 24 | Beachflower Marian | At the settled screen, Highlight gauge showed 89% and MIKU cooldown badge showed 2. Gentle Sea Breeze was gray and disabled with clock badge 1 on Marian's third turn, counting its Action 08 cast turn as the first. Clicking twice displayed or selected its tooltip only; no target-selection scene appeared and no cast started. Marian used the remaining free Defender Tonic on Ichigo. Action remained 24, the Highlight gauge remained 89%, MIKU cooldown badge remained 2, the flower icon became gray and empty, and the basket control disappeared. Ichigo's HP changed from 8,142 to 9,753. The status panel then showed Attacker Tablet at ATK +47.4% with 2 turns and Defender Tonic at DEF +71.1% with 3 turns. No additional J&C Highlight occurred. | Attack Turns Left 3, Total Score 2,145,031, Survival Bonus Points x1.5. |
| 25 | Ichigo after Marian's Beach Basket | Highlight gauge showed 100% and MIKU cooldown badge showed 1. Clicking J&C opened the Highlight chooser. Mischief clearly showed clock badge 3; Service showed no cooldown badge. Service Highlight was selected and cast successfully, its healing animation played, and the party was healed. After the cast, Action remained 25, MIKU cooldown badge remained 1, Highlight gauge showed 0%, and Total Score remained 2,245,499. Ichigo's Vorpal Butterfly, first cast at Action 09 and blocked with clock badge 1 at Action 18, was now ready on Ichigo's third turn and successfully cast on Hachiman for 20 SP. No Marian Highlight, True Desire, or Virtual Concert had occurred. | Attack Turns Left 3, Total Score 2,245,499 before Vorpal Butterfly damage, Survival Bonus Points x1.5. |
| 29 | Wonder and MIKU interrupt | After enemy actions, Highlight gauge showed 21% and MIKU showed Play-With-Fire ready. A third Feel the Beat was used. Action remained 29, MIKU cooldown badge became 4, and all three Tracks were visible in cyan, yellow, and purple. Wonder then used Universal Theoria on Ichigo. | Attack Turns Left 2, Total Score 5,712,769, Survival Bonus Points x2 before the normal Wonder action. |
| 30 | J&C Alt control and manual Service | Before Alt, Highlight gauge showed 38%, MIKU cooldown badge showed 3, and J&C SP was 73. The Alt control was clicked once. An animation played with partially visible text, "Power to ... Ruin." After it settled, Action 30, score 5,712,769, Highlight gauge 38%, MIKU cooldown badge 3, and J&C SP 73 were unchanged. The blue Alt button disappeared. The initially visible status rows showed permanent Facade Mischief; permanent Twin Wardens with Desire Level 120; and a new permanent Power to Resist Ruin status stating, "Strengthen next activated Two Masks as One." J&C then used manual Service on explicitly selected Hachiman for 20 SP. An automatic damage sequence followed, but the exact Two Masks as One titles and hit distribution were missed. At the following settled state, J&C SP was 53, consistent with only the manual 20 SP cost. J&C's initial status rows showed permanent Twin Wardens with Desire Level 120, Two Masks as One with critical damage +31.6% for 2 turns, and Rebel Surveillance for 2 turns. Power to Resist Ruin was absent from the initial section where it had previously appeared. | Attack Turns Left 2 and Survival Bonus Points x2. The status transition strongly supports the stored enhancement resolving, but the complete automatic sequence remains unverified. |
| 31 | Beachflower Marian | After J&C's automatic sequence, Total Score was 7,547,379, Highlight gauge 59%, and MIKU cooldown badge 2. The two remaining minions were gone and party shield bars were visible. Gentle Sea Breeze was ready for 25 SP on Marian's fourth turn and successfully cast on Ichigo. A new flower counter 2 was visible during the animation. | Attack Turns Left 2, Total Score 7,547,379, Survival Bonus Points x2. |
| 32 | Ichigo Alt and DOUBLE BERRY | Before Alt, Highlight gauge showed 76%, MIKU cooldown badge 1, Ichigo SP 71, HP 12,058, and Chains 2. Alt opened the DOUBLE BERRY menu without an immediate cast. Vorpal Butterfly showed clock badge 1; Obsessive Rose was bright green at 20 SP; My Beloved Prince was dark at 22 SP; and Highlight was dark. Clicking My Beloved Prince twice and Highlight twice only displayed tooltips. The second Obsessive Rose click opened target selection, then selecting Hachiman and confirming the boss-heart control cast it. Its tooltip showed 124.4% ATK Curse damage and +4 Lovesick. During animation, Hachiman's Lovesick moved from 7 to 12. The skill ended Ichigo's normal turn. Actual post-cast SP was not visible. | Attack Turns Left 2, Total Score 7,547,379, Survival Bonus Points x2 before resolution. |
| 34 | Wonder after boss action and Virtual Concert start | At the settled pre-Concert state, Hachiman's Lovesick showed 15 and Ichigo's Chains still showed 2. Highlight gauge was 100%. J&C's portrait showed clock badge 2 and was disabled; clicking did not open the chooser, so individual mask badges were unavailable. MIKU was ready with all three Tracks, and the song displayed Heaven (ATOLS Remix). Showstopper was selected and its cast animation was confirmed. Its tooltip required 3 different Tracks, spent all Tracks, stopped foe turns, and granted allies 2 extra turns. Immediately after Showstopper and before any Concert ally action, J&C's portrait was enabled. Its chooser opened and both Mischief and Service showed no cooldown badge. No ordinary Action 34 move had been used. | Throughout the immediate comparison: Attack Turns Left 1, Action 34, Total Score 12,799,631, Survival Bonus Points x2. |
| 35 | Wonder immediately after Virtual Concert | Exactly eight ordinary Concert party actions had occurred while the HUD continued to show Action 34. After Ichigo's final second-loop action and automatic Concert ending, the HUD advanced once to Action 35. J&C chooser still showed Mischief clock badge 2 and Service with no badge. MIKU support was ready, the song showed Heaven, and all Tracks were gray. | Attack Turns Left 1, Total Score 226,644,192, Survival Bonus Points x2. |
| 35 | Wonder normal action | Wonder used Revolution for 22 SP. | Before and after the pre-action cooldown inspection, Mischief showed clock badge 2 and Service showed no badge. |
| 36 | J&C turn start and manual action | Before any J&C action, Highlight gauge was 100%, J&C SP 81, and the chooser still showed Mischief clock badge 2 with Service clear. J&C then used manual Mischief on Hachiman for 20 SP. | Attack Turns Left 1, Total Score 226,644,192, Survival Bonus Points x2 before the manual action. |
| 37 | Marian turn start | Highlight gauge was 100%. The J&C chooser now showed Mischief clock badge 1 and Service clear. | Attack Turns Left 1, Total Score 226,906,304, Survival Bonus Points x2. |
| 37 | Marian, Service Highlight, free medicine, and Gentle Sea Breeze | J&C Service Highlight successfully cast and healed the party. The displayed max HP values were Wonder 14,661, Ichigo 12,058, Marian 20,403, and J&C 13,405. Highlight gauge changed from 100% to 0% while Action 37, score 226,906,304, Attack Turns Left 1, and Survival Bonus Points x2 remained unchanged. Marian then used Fighter Salve on Ichigo. Afterward, Action 37, score 226,906,304, Highlight gauge 0%, and Marian SP 71 were unchanged; the Pharmacy button vanished and the flower icon became black and empty. Ichigo's status showed HP 12,058/12,058, SP 66/100, Chains 3, Fighter Salve damage +39.5% for 3 turns, and DOT-Up continuous damage +15.8% with 2 turns remaining. Marian's Gentle Sea Breeze was visibly ready at 25 SP and successfully cast on Ichigo as the counted Action 37 move. Flower counter 2 appeared. | This completes a second cooldown sequence: Action 31 cast, first Concert Marian turn badge 2, second Concert Marian turn badge 1, Action 37 ready and cast. |
| 38 | Ichigo | At Chains 3 after Alt Vorpal Butterfly, Obsessive Rose, and My Beloved Prince had each been used once, the Alt or DOUBLE BERRY button was absent from Ichigo's regular controls. Ichigo SP was 77 and Highlight gauge 17%. Regular Vorpal Butterfly showed clock badge 1, while regular Obsessive Rose and My Beloved Prince were available. Ichigo used ordinary My Beloved Prince for 22 SP. | This was not the final party action of the battle. |
| 39 | Boss action | Hachiman acted with Attack Turns Left 0. | Total Score 242,135,200, Survival Bonus Points x2. |
| 40 | Wonder playable turn after Attack Turns Left reached 0 | The game returned to playable Wonder rather than ending. Highlight gauge showed 38% and Wonder SP 52. Hachiman remained at 100% HP. Hachiman's details showed Berserk 3, permanent, with the same vague set-amount increased-damage text; Mine Alone with damage 60%; Pounding Heartbeat with DEF -45%; and Bewitching Blossoms with an ATK term of 56.8% for 2 turns. | Attack Turns Left 0, Total Score 243,215,856, Survival Bonus Points x2. No displayed numeric effect explained the continued phase or a hard stop. Auto was planned for the remaining phase. |
| 40 | Auto enabled | Auto was enabled from playable Wonder Action 40. Remaining actions and hits were not individually captured. | Starting Auto state: Attack Turns Left 0, Total Score 243,215,856, Survival Bonus Points x2. |
| 41 | Intermediate Auto J&C action | A screenshot captured J&C acting under Auto. | Attack Turns Left 0, Total Score 243,553,920, Survival Bonus Points x2. |
| Result | Hachiman NIGHTMaRe result screen | The result screen appeared about 18 seconds after Auto was enabled. Wonder's victory pose was visible. No capture established the exact battle-end trigger or a party death. | Final Score 2,065,787,456; Foe Defense Points +258,098,432; Turns Survived 6; Turns Survived Bonus +125,000; Difficulty Bonus 8. |

### Virtual Concert, first party turn at Action 34

| Sequence | Action | Highlight gauge | Score after resolution | Other direct observation |
| --- | --- | --- | --- | --- |
| Opening Highlight | J&C reset Mischief Highlight | 100% to 0% | 12,799,631 | Cast successfully before any Concert ally action. Action 34, Attack Turns Left 1, and Survival Bonus Points x2 remained unchanged. |
| Wonder | Tarukaja on Ichigo | 34% at next actor | 12,799,631 | Next actor was J&C. No normal Action or boss-turn advance. |
| J&C | Manual Mischief on Hachiman | 68% at next actor | 13,476,673 | J&C SP was 99 before the action. Next actor was Marian. |
| Marian | Beach Basket | 100% at next actor | 13,991,625 | Gentle Sea Breeze showed disabled clock badge 2. Next actor was Ichigo. |
| Ichigo turn start | Opened J&C Highlight chooser | 100% | 13,991,625 | Mischief showed clock badge 3; Service showed no cooldown badge. No boss turn or normal Action advance had occurred through the three completed Concert party actions. |
| Ichigo Highlight | Ordinary Highlight on Hachiman | 100% to 0% | 23,491,110 | Tooltip showed 532% ATK Curse damage, Lovesick can critically hit for 3 turns, activate all continuous damage once, and apply Lovesick 2 more times. Action 34, Attack Turns Left 1, and Survival Bonus Points x2 remained unchanged. Chains increased from 2 to 3 and SP remained 97. |
| Ichigo Alt S3 | DOUBLE BERRY My Beloved Prince on Hachiman | 42% at next actor | 84,030,928 at next actor | My Beloved Prince became available at Chains 3 after being dark at Chains 2. It cost 22 SP and ended Ichigo's Concert turn. At the next actor, Wonder in Concert round 2, Ichigo's status showed SP 075/100, HP 11,334/11,334, Chains of Love 3 permanent, Virtual Concert critical damage +24.5% with 1 turn remaining, and partially visible permanent Special Effect continuous damage +30%. The 60,539,818 score delta from the pre-S3 settled score includes missed intervening frames and is not attributed entirely to the direct skill. |
| Second Concert round start | Wonder | 42% | 84,030,928 | Still Action 34, Attack Turns Left 1, Survival Bonus Points x2, and Ichigo Chains 3. |
| Wonder, round 2 | Universal Theoria on Ichigo | 76% at next actor | 84,030,928 | Next actor was J&C. Still Action 34, Attack Turns Left 1, and Survival Bonus Points x2. |
| J&C, round 2 | Manual Service on Hachiman plus automatic sequence | 100% at next actor | 86,686,664 | J&C SP was 90 before the action. Next actor was Marian. |
| Marian, round 2 | Inspected chooser and used free DOT-Up on Ichigo | 100% | 86,686,664 | J&C chooser showed Mischief clock badge 2 and Service with no badge. Gentle Sea Breeze showed disabled clock badge 1. Beach Basket targeting was canceled before a cast. Marian returned to the main controls, opened the free Pharmacy, selected DOT-Up x11, and used it on Ichigo. Action 34, Attack Turns Left 1, Survival Bonus Points x2, Total Score 86,686,664, Highlight gauge 100%, and Marian SP 80 were unchanged. Marian remained the current actor. The basket control disappeared and flower 2 became an unnumbered flower icon. |
| Marian normal action, round 2 | Beach Basket | 100% at next actor | 87,126,152 | Next actor was Ichigo. Still Action 34, Attack Turns Left 1, and Survival Bonus Points x2. |
| Ichigo turn start, round 2 | Inspected J&C chooser and DOUBLE BERRY | 100% | 87,126,152 | Ichigo SP 86 and Chains 3. J&C chooser still showed Mischief clock badge 2 and Service with no badge, unchanged after Marian's free medicine and normal action. DOUBLE BERRY showed Obsessive Rose and My Beloved Prince dark without cooldown badges, while Vorpal Butterfly was bright and ready at 20 SP. |
| Ichigo final action, round 2 | DOUBLE BERRY Vorpal Butterfly on Hachiman | 100% during the captured attack | 103,689,240 mid-attack | Tooltip showed 150.2% ATK, +2 Lovesick, +200% skill damage if target HP is above 70%, and a 1-turn cooldown. Mid-attack Damage showed 8281K. This was the eighth ordinary Concert party action. |
| Concert exit | Wonder at Action 35 | 100% | 226,644,192 | No other root-selected ordinary move occurred between Ichigo's final action and this settled state. Action advanced once from 34 to 35 on exit. Attack Turns Left remained 1, Survival Bonus Points remained x2, MIKU support was ready, the song showed Heaven, and all Tracks were gray. J&C chooser still showed Mischief clock badge 2 and Service with no badge. Individual end-of-Concert echo damage was not isolated. |

Immediately after DOT-Up, Ichigo's Intel status showed:

| Status | Directly observed value |
| --- | --- |
| DOT-Up | Continuous damage effect +15.8%, 3 turns |
| Lovesick Critical | 2 turns |
| Callous Kindness | ATK +30% for 1 turn; damage reduction +20% for 2 turns |

The bottom-right percentages at Actions 07, 08, 09, and 15 were initially preserved as an unnamed meter because the resource name was not shown. At Action 16, reaching 100% allowed the J&C portrait to open the Highlight chooser, and using Mischief Highlight reset the meter to 0%. This supports identifying the same bottom-right percentage as the Highlight gauge, but the earlier screenshots did not independently display its name. The displayed 323K damage is recorded exactly as abbreviated by the HUD.

### J&C status panel after the first Highlight

| Status | Directly observed text |
| --- | --- |
| Special Effect, permanent | Cannot activate critical hits, but increase final damage by 117.9%. |
| Twin Wardens | Desire Level 120. |
| True Desire | Stored. |
| Reconciliation, permanent | HP, ATK, and DEF +15%. |

These are current active modifiers observed in this battle. The source and calculation of the 117.9% final damage value were not shown.

## Result Calculation

The result screen displayed:

| Component | Displayed value |
| --- | ---: |
| Foe Defense Points | 258,098,432 |
| Turns Survived | 6 |
| Turns Survived Bonus | 125,000 |
| Difficulty Bonus | 8 |
| Final Score | 2,065,787,456 |

For this run, the displayed values reconcile exactly:

`(258,098,432 + 125,000) x 8 = 2,065,787,456`

This confirms the result-screen composition for this run. It does not establish the internal formula for Foe Defense Points, the schedule that produced the survival multipliers during battle, or the rule that ended the remaining phase after Attack Turns Left reached 0.

## Evidence Notes

- Evidence consists of this written observation log and screenshots retained in the conversation tool history.
- No video or raw screenshot files were saved to the workspace.
- Remaining Auto actions and hit-by-hit damage between Action 41 and the result screen were not captured.
- Wonder's victory pose was visible on the result screen. The captures do not establish party death or the exact battle-end trigger.
- Simulator and fan-reference notes are labeled separately from direct live UI observations.
- This was documentation-only verification. No simulator or engine edits were made.

## Residual Gaps

1. Determine whether a selected-mask Highlight cast earlier in the same J&C turn receives a grace period before that turn's counted-action cooldown decrement.
2. Capture J&C's complete status list immediately before Alt, after Alt, and after the next mask action to resolve True Desire consumption and the full enhanced Two Masks as One sequence.
3. Isolate the passive, weapon, or other source of the repeated 1.58 medicine magnitude multiplier through live kit inspection.
4. Capture the full DOUBLE BERRY animation or event log to isolate repeat counts and Lovesick applications, and test the fourth one-time A6 effect.
5. Determine the internal Foe Defense Points formula, the Survival Bonus Points schedule, and the exact post-zero-turn battle-end rule.
6. Resolve Berserk's numeric damage increase and the formulas behind the battle-specific 117.9% J&C and 324.3% Ichigo final damage modifiers.
