# Slaughter Drive A6 Passive-Aware Rotation

Seed: 808  
Mode: Nexus of Dreams  
Team: Wonder, Marian Beachflower, Puppet Wavecatcher, J&C  
J&C locked pair: active S1 Mischief, active S2 Service  
Break: Attack Turn 7  
Archived pre-correction best searched score: 22,176,247,296

This result predates the explicit True Desire choice, corrected main-target elemental hits, two-use Midsummer Prescription, and character skill cooldown tracking. Rerun the optimizer before comparing this archived score with the current simulator.

## MIKU sequence

| Attack Turn | MIKU action | Song and result |
|---|---|---|
| 1 to 3 | None | Feel the Beat and Clear Sound begin at cooldown 4. |
| 4 | Feel the Beat | Heaven, gain Break Track. |
| 5 | Feel the Beat | Spring Storm, gain Critical Track. |
| 6 | Clear Sound | Play-With-Fire, gain Expert Track. |
| 7 | Showstopper after the break | Spend all three Tracks, start Ghost Rule, and insert two Virtual Concert party turns. |
| 8 | Feel the Beat | Heaven after Concert. |

The optimizer candidate also contained unavailable Showstopper requests on turns 2 and 3. The engine correctly rejected them because MIKU starts on cooldown and lacks all three Tracks. The table shows only the actions that actually fired.

## Normal setup

| Attack Turn | Ordered actions |
|---|---|
| 1 | Wonder Guard; Marian Summer Garden; Miyu Jellyfish Splash; J&C Service |
| 2 | Wonder Guard; Marian Summer Garden; Miyu Jellyfish Splash; J&C Mischief |
| 3 | Wonder Maziodyne; Marian Guard; Miyu Jellyfish Splash; J&C Service |
| 4 | MIKU Feel the Beat; Wonder Gun; Marian Guard; Miyu Jellyfish Splash; J&C Mischief |
| 5 | MIKU Feel the Beat; Wonder Revolution; Marian Summer Garden; Miyu Jellyfish Splash; J&C Service |
| 6 | J&C Mischief Highlight; MIKU Clear Sound; Wonder Maziodyne; Marian Gentle Sea Breeze; Miyu Guard; J&C Attack |

## Break and Virtual Concert

1. Break the HP lock at the start of Attack Turn 7.
2. Use Wonder Highlight and Miyu Highlight, then MIKU Showstopper.
3. Resolve the Concert opening Highlights for Wonder, Marian, Miyu, and J&C.
4. Concert party turn 1: Wonder One-Fathom Fang; Marian uses Fighter Salve and Beach Basket; Miyu Jellyfish Splash; J&C Mischief.
5. Concert party turn 2: Wonder Maziodyne and Highlight; Marian uses Beach Basket; Miyu uses Jellyfish Splash and Highlight; J&C Attack.
6. Neverending Song repeats the damage recorded against Slaughter Drive during those two Concert party turns as fixed Almighty damage.
7. End Concert, use J&C Highlight, then resume Attack Turn 7: Wonder Guard; Marian Gentle Sea Breeze; Miyu Aerial Tide; J&C Attack.
8. Attack Turn 8: MIKU Feel the Beat; Wonder One-Fathom Fang; Marian uses Fighter Salve and Attack; Miyu Aerial Tide; J&C Attack.

During Concert, the normal Action number, boss turn, Weakened turns left, and navigator cooldowns stay frozen. Buff and debuff durations still decrease after each Concert party turn.

## Score buckets

- Base raw damage: 1,160,656
- Base damage points: 827,135
- Weakened raw damage: 364,369,368
- Weakened damage points: 5,542,984,689
- Boss attack points: 250,000
- Difficulty bonus: 4
- Total simulated damage: 372,101,175
- Catch a Wave hits: 7
- Catch a Wave damage: 13,405,357
- Final score: 22,176,247,296

The optimizer evaluated 28,743 deterministic candidates. The search baseline scored 8,540,121,504, so the best result gained 13,636,125,792 points, or 159.671%. This is the best searched result, not proof of a global optimum or an exact live-game prediction. Slaughter Drive's point conversion remains calibrated to the supplied recording.
