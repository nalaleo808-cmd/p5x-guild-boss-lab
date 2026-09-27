# Hachiman Highlight charge audit - 2026-09-05

## Finding

Latest numerical correction from the user: ordinary Thief actions grant 17%, and weakness actions grant 21% total (+4%). The later uncapped +4% discrepancy is therefore accounted for by the confirmed weakness difference. The older statements in this report about unresolved Virtual Concert rates are historical to the audit and superseded by the current confirmed Concert rule. Eligibility for opening automatic repeats and other follow-ups remains unresolved.

Subsequent user correction: attacking a boss weakness and acting during Virtual Concert change Highlight gain. The confirmed rates are 21% for a weakness action, 34% for an ordinary Concert action, and 42% for a Concert weakness action. Virtual Concert also doubles Theurgy gauge filling, adds +10% Highlight and Theurgy Final Damage Amplification, and resets all ally Highlight cooldowns on activation. Eligibility for extra repeats or follow-ups remains unresolved, and Theurgy activation in the simulator remains unimplemented. See `HACHIMAN-HIGHLIGHT-RULES-2026-09-05.md`. The interval analysis below remains useful historical evidence, but should no longer be read as requiring an invented boss-round charge.

Trust + Prosperity is confirmed as part of Marian's live loadout and is the source of the observed 25% opening Highlight. Formalizing that loadout is necessary for source provenance and for its separate party damage effect. It does not add charge beyond the 25% already present in the checkpoint runner, because the old runner supplied that same observed opening value manually.

The remaining T1 charge is real but its source is not isolated. The observed interval from Marian S3 through Berry S1, its automatic defeat chain, Hachiman's response, and the next round moves the gauge from 76% to a capped 100%. Berry's normal counted action accounts for 17%, so the combined unmodeled events contribute at least 7%. The cap prevents an exact measurement.

Two later uncapped intervals establish a smaller repeated discrepancy:

| Interval | Observed start | Known counted action | Expected from current replay model | Observed settled gauge | Unmodeled net |
| --- | ---: | ---: | ---: | ---: | ---: |
| T2, Marian S2 endpoint through Berry S3 and the round transition | 51% | +17% | 68% | 72% | +4% |
| T3, Beach Basket endpoint through Berry S3 and the round transition | 17% | +17% | 34% | 38% | +4% |
| T1, Marian S3 endpoint through Berry S1 chain and the round transition | 76% | +17% | 93% | 100% capped | at least +7% |

The repeated +4% is evidence for a charge event somewhere inside the later Berry S3 to settled-next-round interval. It does not identify whether the trigger is Berry's additional damage, a continuous-damage resolution, Hachiman's action, party damage taken, or the round transition. T1 also contains four defeated idols and several automatic S1 activations, so its larger censored remainder cannot safely be assigned to the same event.

## Revelation evidence

The pinned local English Revelation catalog says:

- Prosperity four-piece: recover 25% Highlight charge when entering battle, non-stacking (`vendor/lufelnet-data-source/data/en/revelations/revelations.js:186-189`).
- Trust + Prosperity: after using skills on allies, increase all party members' damage by 8% for two rounds (`vendor/lufelnet-data-source/data/en/revelations/revelations.js:354-357`).

The pair text contains no charge clause. Marian S3 is the relevant ally-targeted trigger, but the direct checkpoint moves from 59% to 76%, exactly the same displayed +17% seen after J&C Gun and Rakunda. This does not expose a separate immediate charge from the pair. A hidden fractional change or a delayed localized effect cannot be ruled out from rounded HUD values, but neither is supported by the local text.

The local source checkout contains only `data/en/revelations/revelations.js` for Revelation effects. Korean names are retained as mappings and comments, but no independent Korean, Japanese, or Chinese effect text is present to resolve a localization difference. The smallest source check is a capture of the full Trust + Prosperity pair tooltip from the same live client and server as the Hachiman run.

## Character, Navigator, weapon, and encounter checks

The imported BERRY, Beachflower Marian, J&C, and MIKU skill and passive text contains no ordinary shared Highlight charge effect. BERRY's S1 does reactivate after a defeat, and her Highlight activates continuous damage, but neither description states that it fills Highlight. Marian's known passives grant Blessing, damage, and Attack. J&C's known passives grant Desire and mask-pair bonuses. MIKU's ordinary support skills and passives grant stats, Tracks, and Concert effects. MIKU A1 fills the gauge when Showstopper starts, which happens much later and cannot explain T1.

Wonder's weapon cannot be cleared by the checked-in catalogs. The runner gives Wonder an empty base-stat loadout and models no weapon. The vendored source contains a weapon manifest, but the actual weapon data files are absent, and the generated simulator catalog has no weapon collection. Therefore the reported R6 Curse Dagger trait remains an open candidate. Its exact live name, refinement level, and full trait text are required before adding any charge behavior.

The encounter source also does not define Highlight gain from Hachiman, Daisoujou or idol defeat events. Static engine inspection shows that shared Highlight changes only at these current call sites:

- initialization from `sharedHighlightStart` or the maximum party `highlightStart` (`src/engine.js:236-247`);
- normal counted actions and items (`src/engine.js:2717-2721` and `src/engine.js:2828-2834`);
- Guard (`src/engine.js:2805-2809`);
- Highlight spend (`src/engine.js:2895-2904`);
- MIKU A1 on Virtual Concert activation (`src/engine.js:1631-1645`).

There is no shared-gauge call in summon defeat handling, enemy attacks, continuous-damage resolution, or end-of-round handling. This explains why the current replay cannot represent any live charge originating in those intervals, but it does not establish which missing hook is correct.

## Patch recommendation

A full +7% patch is not supported. Do not encode a generic `+7`, attach charge to Trust + Prosperity, or make MIKU's normal call fill the gauge.

The two historical +4% observations can be retained as comparison checkpoints. They are explained by the confirmed 17% versus 21% weakness action difference where the interval isolates a weakness action, but the settled intervals do not establish separate repeat or follow-up eligibility. No interval charge adapter was adopted in this pass. Applying +4% generically to T1 would be an unsupported generalization and would reach only 97%. Resolve the repeat/follow-up trigger before adding any separate charge rule to the engine.

The smallest evidence set needed for a correct final patch is:

1. Capture the shared gauge immediately after Berry's manual T1 S1 input and after each automatic S1 activation, especially before Hachiman acts. This isolates action, repeat, hit, and defeat contributions while the four idols disappear.
2. Capture the gauge immediately after a later Berry S3 finishes, before Hachiman or the round transition, then immediately after Hachiman acts, then after the next party command appears. This partitions the established +4% among skill resolution, continuous damage, incoming damage, and round start.
3. Capture the live Trust + Prosperity pair tooltip in the client language used for this run.
4. Capture Wonder's R6 Curse Dagger full trait panel and MIKU's equipped weapon and Talent text. Record whether any clause names Highlight recovery, enemy defeat, damage dealt, damage taken, or turn start.
5. If a charge appears on enemy defeat, repeat one capture with only one idol defeated before pausing. The T1 gauge is capped, so the current four-kill sequence can establish only a lower bound.

Once a trigger is isolated, the implementation point follows directly: summon defeat behavior belongs next to `defeatSummon`, incoming-hit behavior belongs next to `applyPartyDamage`, continuous-damage behavior belongs next to its resolution event, and a true round effect belongs in the normal end-of-turn transition. Equipment and Revelation triggers should remain loadout-scoped.

## Sources and affected paths

Sources inspected:

- `HACHIMAN-ROTATION-CHECK-2026-09-05.md:101-120`, plus later Concert checkpoints for consistency
- `data/ichigo-live-t3-snapshot-2026-09-05.json:164-171`
- `vendor/lufelnet-data-source/data/en/revelations/revelations.js:186-189,354-357`
- `data/lufel-live-recent.json`, entries for BERRY, Beachflower Marian, J&C, and MIKU
- `src/engine.js:236-247,1021-1050,1631-1645,2717-2721,2805-2834,2895-2904,2929-3092,3170-3219`
- `scripts/compare-hachiman-opening.mjs:244-278`
- `src/default-presets.js:30-45`
- `vendor/lufelnet-data-source/data/weapon-manifest.js`

Potential implementation paths after the missing evidence is captured are `src/engine.js`, `scripts/compare-hachiman-opening.mjs`, the relevant tests under `tests/`, and a weapon or loadout catalog if Curse Dagger is the source. This audit changes only this report. No simulation, optimizer, replay test, build, or game interaction was run.
