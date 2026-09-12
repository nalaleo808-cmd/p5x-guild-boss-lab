# P5X Guild Boss Simulator portable handoff

Conversation snapshot:

https://chatgpt.com/s/cx_6a924b3b95d081919655d6432cce30aa

## Start the simulator

Install Node.js 18 or newer, extract this project, then run:

```text
npm start
```

Open `http://127.0.0.1:4173/`.

Windows users can also run `run-local.bat`. macOS/Linux users can run `./run-local.sh`.

## Validate the project

```text
npm test
npm run build
```

At the latest mechanics update, all 58 tests passed and the static build was generated in `dist/`.

## Current implementation

- Showdown-style arena and action and target flow
- Deterministic P5X battle engine and replays
- Adjustable four-character turn order
- Lufelnet character, Persona, skill, Revelation, and artwork data
- Editable Wonder Persona skills; Wonder has no Revelation set
- Exact per-character HP, SP, Attack, Defense, Speed, Crit Rate, and Crit Damage inputs
- Wonder takes one counted action; Persona selection is free
- Marian's Soothing Sunlight and Blossoms by the Beach passives, Blessing stacks, A6 skill scaling, cleanse, critical formulas, and free medicine actions
- A6 Miyu begins in Surf; Hang Ten, Ride It Out, Surf immunity, cleanse, and duration rules are active
- Paddle Out enters or leaves Surf without dealing Catch a Wave damage
- Catch a Wave triggers after an ally turn as a free Resonance follow up, spends scaling SP, gains Offshore, and cannot reduce Down points
- Jellyfish Splash restores SP using Miyu's SP Recovery and can bank SP up to twice her normal maximum SP
- Navigator cooldowns advance once per counted ally action, with one navigator skill per Attack Turn
- Slaughter Drive mode selection for Nexus of Dreams, Multidimensional Dreamscape, and Devourer of Dreams
- Level 78 Slaughter Drive has 209,244 HP; each of its four Level 78 Scarlet Turrets has 154,474 HP
- Soul Link keeps all five targets at the same proportional HP percentage when any linked target takes damage
- Nexus forces Life Sustainment on at a 1 HP floor; damage credit stops there until the player uses the free manual break
- Breaking the Nexus lock grants exactly 2 complete Weakened Attack Turns, including after a late break
- Devourer Life Sustainment is a free player-turn toggle that is disabled during Full Auto
- With Devourer Life Sustainment off, linked HP reaches 0 and all five targets remain available with infinite HP for 3x points during exactly 2 boss turns, including after a late trigger
- J&C locked S1 and S2 mask selection, either opening choice followed by opposite-slot alternation, Facades, all six Oxymoron pairs, A1 automatic Two Masks as One, A6 Desire Level, and a free True Desire ON/OFF control
- Beachflower Marian's two-use Midsummer Prescription, all eight medicines, one medicine per Marian turn, and Gentle Sea Breeze's two-turn cooldown
- All 20 imported characters use A6 Level 80 stats and Level 13 skill coefficients
- Per-character parity gaps are documented in `MECHANICS-AUDIT-2026-08-29.md`
- MIKU's Setlist and Fan Favorite passives, cooldown opening, song and Track cycle, Showstopper, two Virtual Concert turns, and A6 Neverending Song repeat are active
- Battle logs show the newest event on top and Attack Turn 1 at the bottom
- The corrected deterministic seed 808 auto baseline breaks on turn 7 and scores 8,734,831,636; the older 28,743-candidate search is retained as a pre-correction archive and should be rerun
- Navigators, AI move recommendations, optimizer, results, and replay screens

## Continue on another computer

1. Copy and extract the accompanying ZIP.
2. Open the conversation snapshot above for the full discussion history.
3. Open this folder as the workspace in Codex.
4. Ask Codex to read this handoff file, inspect the project, and continue from the current implementation.

The conversation link is a shared snapshot. The project itself is contained in the ZIP and is the authoritative runnable state.
