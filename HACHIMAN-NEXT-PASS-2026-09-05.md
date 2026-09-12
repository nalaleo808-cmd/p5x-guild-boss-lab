# Hachiman next pass

Scope: reproduce the observed Multidimensional Dreamscape run with J&C, Wonder, Summer Marian, borrowed Berry, and MIKU. The observed final score is 6,101,612,096. The supplied 6,663,043,136 rotation is a guide, not a calibration target.

## Delegated assignments

| Owner | Assignment | Deliverable |
| --- | --- | --- |
| GPT-6 Astra | Audit raw damage scaling and unsupported Hachiman modifiers | `HACHIMAN-DAMAGE-AUDIT-2026-09-05.md` and a bounded engine correction where evidence supports it |
| GPT-5.6 Sol | Reconcile Highlight charge intervals and Marian's card effects | `HACHIMAN-HIGHLIGHT-AUDIT-2026-09-05.md` |
| GPT-5.6 Luna | Inventory confirmed equipment, source evidence, and replay omissions | `data/hachiman-loadout-evidence-2026-09-05.json` |
| Primary agent | Review findings, integrate corrections, prepare replay and validation | This plan and `scripts/compare-hachiman-opening.mjs` |

## Work order

After the fresh comparison reached 97% Highlight at T1, the user confirmed that Berry's S1 kill-reset recasts supply the missing charge. The focused correction counts those eligible casts individually while preserving one SP payment and one manual turn. Recheck the T2 Highlight gate and the scripted T3 prefix after integration; broader automatic follow-up eligibility remains unresolved.

Latest user correction establishes ordinary Thief charge as 17%, or 21% when hitting weakness. During Virtual Concert, Highlight and Theurgy gauge filling doubles, giving 34% for an ordinary action and 42% for a weakness action. Concert also grants +10% Highlight Final Damage Amplification and +10% Theurgy Final Damage Amplification, and resets all ally Highlight cooldowns on activation. This replaces the default flat 18% and removes the Hachiman runner's old scalar override. Additional automatic repeat/follow-up eligibility remains unresolved, and Theurgy activation in the simulator remains unimplemented. The confirmed normal +4% weakness difference accounts for the previously unexplained later 21-point intervals without inventing an enemy-turn charge.

The supplied Daisoujou photo confirms Curse weakness, Physical/Gun/Bless resistance, level 82, speed 80, no score from damaging Daisoujou, and a defeat effect capped at four stacks total. The later user correction confirms 10% increased Hachiman damage taken per stack, totaling 40% at four stacks. Apply each stack before the following hit. Stack duration remains unknown; see `data/daisoujou-photo-evidence-2026-09-05.json`.

New user evidence supersedes treating all extra Highlight as a mystery around the round transition: weakness attacks and Virtual Concert change charge gain. The current rates are confirmed as 17/21 outside Concert and 34/42 during Concert. See `HACHIMAN-HIGHLIGHT-RULES-2026-09-05.md`. Per-hit or per-cast eligibility for automatic repeats and follow-ups remains pending. Wonder's Cursed Ties was also read directly from the game; see `WONDER-WEAPON-EVIDENCE-2026-09-05.md` for its damage effects and remaining trigger details.

All three delegated reports are complete and reviewed. The confirmed narrow engine correction is integrated. The Highlight audit isolates two later uncapped +4% discrepancies and a capped T1 remainder of at least +7%, but does not establish their triggers. No gauge adjustment was added. The next evidence task is to read the live card and weapon text and capture the gauge between Berry's resolution, Hachiman's action, and the following command.

1. Correct unsupported inputs before interpreting damage. Keep the historical 100x normalization classified as unverified until a sourced formula or isolated live hit establishes a replacement. Do not tune constants to the final score. Remove the unsupported live Hachiman 40% idol-clear bonus while exposing the unknown stack effect.
2. Reconcile the shared Highlight meter. Marian now has Trust + Prosperity; Prosperity supplies the existing 25% opening charge, and the sourced pair effect grants 8% party damage. Apply the confirmed 17/21 and 34/42 rates, then identify any additional repeat or follow-up charge source from recorded intervals. Do not force 93% to 100%.
3. Complete the confirmed loadout inputs. Preserve equipped Berry stats separately from her buffed T3 totals. Record weapons, cards, and ranks as supplied even where their executable effects remain missing. Do not substitute guessed equipped stats for Wonder, Marian, J&C, or MIKU.
4. Complete the observed replay after its earliest blocking action is resolved. Add the intermediate Janosik switch and supported effects, finish T3, then T4 and both Concert rounds before T7 and T8. Include J&C's automatic opening and enhanced S3, Berry retargets, free Marian medicine versus counted ordinary item use, and per-target Concert recording.
5. Request one combined validation pass when the replay and sourced corrections are ready. Compare matching checkpoints first, then the final raw damage and scoring components. Report unresolved fields separately from calculated values.

## Replay safeguards added in this pass

- T1 and T2 actions require the expected current actor, including free interrupts.
- T3's manual Twins action and navigator cast require the Twins' turn.
- Full and compact reports state that the runner ends after T3 J&C S2, partway through the turn. Completing a scripted checkpoint does not establish full live-run parity.
- Compact reports retain Marian's Revelation configuration.
- Stale Universal Theoria and manually supplied opening Highlight descriptions were corrected.
- The reconstructed damage trace explicitly labels rounded Defense and the omitted Dreamscape critical conversion. Its residual is no longer named RNG variance.

## Validation boundary

The user has deferred battle simulations, replay tests, score comparisons, and optimizer runs until one combined pass. This delegation pass uses source inspection, syntax checks, JSON parsing, and a static build. No new simulated score is claimed.

Completed checks: engine and checkpoint-runner syntax checks passed; the loadout inventory parsed as JSON; `node scripts/build.mjs` succeeded. Runtime behavior and score impact remain pending the combined pass.

The combined pass must preserve the explicit recorded Nexus benchmark of 3,642,530,108, Nexus and Devourer Life Sustainment behavior, and reverse chronological logs. Current live Hachiman raw damage must not be presented as a calculated final game score while the mode formulas remain incomplete.
