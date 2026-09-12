# Lovesick formula evidence and implementation

The omitted Lovesick contribution now has a sourced coefficient. No recorded score or damage interval was used to choose a coefficient or multiplier. Raw live observations remain unchanged.

## Sources

[Megami Tensei Wiki's game glossary transcription](https://megatenwiki.com/wiki/Ichigo_Shikano) specifies Curse damage per stack of 6%, 12%, and 18% of Ichigo's Attack at character levels 1, 50, and 70. Duration is four turns. The ordinary maximum is ten stacks; A6 raises it to fifteen. Defeated holders transfer stacks to the highest-HP eligible enemy. This is a secondary transcription, not a new direct game capture. [AppMedia's skill transcription](https://appmedia.jp/p5x/79155572) independently lists the same coefficient thresholds and duration. Confidence in those values is high, although neither page is publisher documentation.

[Lufel's original mechanics guide](https://lufel.net/character.html?lang=en&name=%EC%9D%B4%EC%B9%98%EA%B3%A0) describes per-stack snapshots on application and overwriting them on S3 refresh. Attack, ordinary damage increases and Defense reduction are frozen; critical stats are read when Lovesick activates. End-of-turn Lovesick excludes Pierce. The guide explicitly leaves Highlight-triggered DoT Pierce unconfirmed. Its table distinguishes the all-DoT Highlight activation from the two extra Lovesick activations, showing current critical stats for the extra activations and the turn-end tick. DoT receives no Dreamscape Skill/Resonance critical conversion. Continuous-damage increases occupy a separate multiplier. Confidence is medium to high for snapshot behavior, but the ambiguous first Highlight activation is handled conservatively.

[The publisher's Berry announcement](https://p5x.jp/news/details/001262mdnskihg.html) confirms stacked Lovesick produces damage each turn. It supplies no coefficient or snapshot formula.

## Code behavior

`src/engine.js` now supplies the level-dependent definition for live Berry when no explicit definition is provided. Missing character level defaults to the existing level-80 catalog convention. Snapshot capture computes unrounded noncritical factors without advancing RNG. Applied stack cohorts retain those factors; S3 replaces all cohorts with the current factors. Critical stats and variance are evaluated at activation. The normal damage resolver still handles damage totals, score and Concert recording, so Lovesick enters the existing echo accumulator once.

## Explicit limitations

- Highlight-triggered Pierce is excluded. The first all-DoT Highlight activation cannot crit; the two additional Lovesick activations can crit during the three-turn enabling effect.
- Snapshot transfer retains original factors. Applying stacks at the cap retains existing snapshots. These choices await isolated evidence; the shared duration resets on application as in the existing engine.
- One critical roll and one variance roll apply per activation, not per individual stack. The game roll granularity is unverified.
- Existing encounter Defense inputs, generic damage factors and Concert countdown timing are retained. This change does not validate those independent assumptions.
- Snapshot capture excludes conditional Cursed Ties attack-on-hit and generic skill amplification. It does not establish every external effect's DoT eligibility.

Validation: `node --check src/engine.js` passed. No battle replay, optimizer or score comparison was run for this change; combined validation belongs to the primary agent.
