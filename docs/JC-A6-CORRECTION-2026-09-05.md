# J&C A6 correction

The user's supplied A6 tooltip supersedes the previous reservation-only resource interpretation. Live Alt spends one True Desire when activated and stores the next Two Masks as One enhancement. Resolution uses the stored enhancement without spending a second stack. The opening stock is one, and unused True Desire must not accumulate indefinitely.

The user clarified that the eight-action recharge counts Wonder's actions, then specified that extra Wonder turns do not count. The live engine uses each eighth normal Wonder action from battle opening as the refill check, restoring one True Desire if spent and holding at one if unused. This periodic interpretation follows "every eight actions if spent"; Alt activation does not reset the counter. Virtual Concert extra turns are excluded, including the action that ends Concert. Free Persona switches, Highlights, navigator actions, and automatic follow-ups also do not advance the counter. The previous provisional J&C-turn clock is removed from the live profile.

Enhanced Two Masks retains its eight main-target elemental hits: Fire, Ice, Electric, Wind, Psychokinesis, Nuclear, Bless, Curse. Each coefficient is `0.4 * (1 + Desire Level / 100)`. The all-Facade attack also includes its existing Almighty effects. The Facade ailments belong only to the main target; the Defense reduction belongs to all foes.

Wonder's skill and Thief Tactics level bonus is an unlock benefit independent of J&C's party membership. The current UI uses the user's established all-A6 unlocked setup. The engine must record this separately from party presence. Per-level Persona coefficients are not supplied, so a +1 level must not be replaced with an invented percentage damage increase.

The wording "Desire Level +20%" does not independently distinguish +20 displayed points from multiplying the pre-A6 value by 1.2. Existing +20-point behavior is retained pending a non-capped before/after example.

All-Facade completion also has prior gaps: Rebel Surveillance has no defined list of shared Effects stats; Skill Amplification currently handles damage but not every level-scaled support value; granted Down Points and Blessing do not yet model their two-turn expiry. These limitations prevent claiming full kit parity from the all-Facade event alone.

Machine-readable evidence: `data/jc-a6-user-evidence-2026-09-05.json`. Archived recorded-profile consumption and recharge behavior remain separate to protect the Nexus benchmark.

Implementation and verification: live immediate spend, one-charge cap, primary-target Facade ailments, eight primary elemental hits, off-party unlock metadata, and optimizer consumption bookkeeping are integrated. Fifteen A6/opening tests and 31 live-mechanics/optimizer regression tests passed. The recorded Nexus benchmark rerun remains exactly 3,642,530,108. The preexisting broader-suite failures are outside this focused pass; full-kit and final-score parity are not claimed.

After the Wonder-action clarification, the updated A6/opening tests passed 16/16 and optimizer regression passed 5/5. The recorded Nexus benchmark rerun again remained 3,642,530,108. The Alt panel now shows Wonder action progress out of eight. The counter checks the eighth action, skips stockpiling if a charge is unused, and preserves a pending enhancement when another charge returns.

After the extra-turn exclusion correction, the counter remains at seven through both Concert rounds, including the last extra action that ends Concert, then refills on Wonder's next normal action. The 16 A6/opening tests and five optimizer regression tests passed again; the archived benchmark remains 3,642,530,108. Concert is the engine's currently modeled extra-turn system. Future extra-turn implementations must preserve this exclusion when invoking counted-action completion.
