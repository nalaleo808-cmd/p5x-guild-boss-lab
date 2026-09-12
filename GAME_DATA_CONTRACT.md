# P5X simulator data contract

The most useful source is a versioned JSON snapshot. It can come from a public API, an export script, or a manually maintained dataset. Do not include login cookies, access tokens, account identifiers, or other private credentials.

## Highest-priority data

1. **Battle rules:** how Attack Turns, each actor's Actions, extra actions, Highlights, navigator actions, Persona selection, Down points, knockdowns, targeting, and effect duration timing work.
2. **Character kits:** base stats at a stated level/awareness, role, element, speed/action order, SP costs, Gun ammo, skill formulas, passives, Highlights, and targeting.
3. **Persona skills:** innate versus transferable skills, skill-card restrictions, costs, formulas, targets, status chances, durations, stacking rules, and triggers.
4. **Revelations:** two-piece/four-piece effects, allowed combinations, stat rolls, caps, triggers, and whether an effect counts as a skill, Revelation, navigator, or encounter effect.
5. **Boss encounters:** score multipliers, turn limit, phase thresholds, defenses, affinities, Down gauges, adds, scripted actions, respawn rules, and scoring conditions.

## Evidence attached to every formula

Each record should include a game version, region, source URL or screenshot/video reference, and a confidence value such as `official`, `observed`, or `estimated`. Conflicting observations should remain separate rather than silently overwriting one another.

## Preferred delivery formats

- A JSON response or saved `.json` file matching [data/game-api-template.json](data/game-api-template.json).
- API documentation plus several real example responses.
- A spreadsheet with one sheet each for characters, skills, Personas, Revelations, bosses, and mechanics.
- Short battle recordings accompanied by the exact team, builds, skill levels, and action sequence.
- Screenshots of skill descriptions and stat screens, ideally with the game version and language visible.

If an authenticated API is involved, provide exported responses with secrets removed. Never send an API key, session token, login cookie, password, or private account data.

