# Character modules

Cosmic Yui is the reference implementation. Each other character has a data module,
a mechanics module, and a pinned research record in `data/character-research/`.
Research coverage is separate from executable coverage. A source description is
not evidence that the engine implements its effect.

`registry.js` is the shared entry point for the battle engine and build screen.
Register a data module's `characterResearch`, optional `characterDefinition` or
`adaptCharacterDefinition`, and mechanics module's `characterMechanics`.
Existing specialized methods may be extracted as `legacyMethods` without changing
their call sites. Do not install a second implementation of those same effects.

Hooks receive the engine and owning unit first:

| Hook | Boundary |
| --- | --- |
| `initialize` | Once after party and navigator state exist, before first turn |
| `beforeSkill` | Before costs and damage; returns a prepared skill |
| `afterSkill` | After one cast, receives damage/critical/targets/packets; may return extra damage |
| `beforeDamage` | Pure per-target skill transform, also used in previews; no resource changes |
| `onDamage` | After actual damage and normal Down resolution, for each party owner |
| `onActionEnd` | One counted action by the owner, excluding free interrupts |
| `onAllyActionEnd` | One counted action, delivered to living owners and navigator |
| `onTurnStart` | After owner-turn counter and normal recovery |
| `onTurnEnd` | After all counted actions in the owner turn |
| `actionUnavailableReason` | Legal-action listing; return an explanation or null |
| `beforeNavigatorSkill` / `afterNavigatorSkill` | Independent navigator action |

All new hooks are live-profile-only. Recorded-profile behavior stays on its original
path. Base live replacements are supplied explicitly by the UI; direct engine
callers can use `adaptRegisteredCharacter` to obtain the same definitions.

Use existing damage, scoring, status, and replay methods. Do not infer effects from
tooltip prose at runtime. Preserve source coefficients and distinguish coefficient
columns from awareness ranks. Record unknown timing, unsupported effects, and
source conflicts in `characterResearch`. Test mechanics through real battle steps,
especially reset, repeated actions, and fast/full replay equivalence.
