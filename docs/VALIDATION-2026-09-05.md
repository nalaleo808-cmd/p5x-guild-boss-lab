# September 5 release validation

The reviewed update is installed in the main project and available at http://127.0.0.1:4173/. This release completes the confirmed core corrections and the current optimizer rerun. It does not complete every imported character or establish full game parity.

## Verified results

| Check | Result |
| --- | --- |
| Complete suite in the reviewed workcopy | 98 passed, 0 failed |
| Static build | Passed in workcopy and main project |
| Archived recorded Nexus replay | 3,642,530,108, exact |
| Archived Catch a Wave | 40 damage events, 8,636,830 damage |
| Archived replay without Catch a Wave | 3,433,259,816 |
| Current corrected Full Auto | 4,699,599,848 at seed 808 |
| Current best searched rotation | 20,757,143,632 from 29,119 candidates |
| Current optimized fast/full replay | Exact match after review fixes |
| September 4 archived optimizer replay | 37,425,059,184, exact fast/full match |
| Observed Hachiman result reconciliation | (258,098,432 + 125,000) x 8 = 2,065,787,456 |
| Guarded source integration | 25 files copied and SHA-256 verified before this final documentation update |

New battles and optimizer runs use `live-2026-09-04`. The old recording and old optimizer use the explicit `recorded-2026-08-29` archive profile. Archive parity preserves historical evidence without asserting that new mechanics reproduce the old recording. The Nexus calibration constant was not changed.

## Browser checks

Desktop interaction checks ran on the reviewed workcopy at port 4174. The updated main application and current optimizer artifact were then verified at port 4173.

- Selecting Hachiman selects Multidimensional Dreamscape. Its four resistances appear in setup and battle.
- Dreamscape displays simulated damage, leaves game score components unavailable, and shows the numeric observed result separately. A played preview reached its configured six-round boundary. That boundary is not claimed as the actual game ending rule.
- Marian starts with 0/2 medicines. S3 grants two, her next turn displays CD 2, and all eight medicines appear. Attacker Tablet shows its 30% one-turn base and sourced A6 applied value of 36% for three turns. A free use leaves 1/2 USED and Action 0/1, and hides the medicine menu for the rest of that turn. Automated tests cover subsequent CD 1 and readiness.
- J&C's two opening masks are enabled. The free Alt stores the enhancement without changing Action 0/1. Separate Highlight clock badges render; automated tests cover independent clocks and MIKU's immediate reset.
- Ichigo's Alt menu shows the 1/2/3/4 Chain requirements. Using the first option preserves Action 0/1 and marks that repeat spent. Automated tests cover costs, each repeat, Highlight behavior, and survival expiry.
- STATS opens separately from FX. The responsive header no longer forces horizontal page overflow at 390 pixels, and the stats sheet remains within the mobile layout. Browser dimensions were restored after QA.
- Battle logs remain newest first. The Optimizer view labels the new result as a current best searched score and includes its profile, baseline, search count, and rotation.

## Remaining evidence and implementation gaps

Dreamscape point accumulation, survival-bonus derivation, and the actual ending trigger remain unverified. Marian's observed 1.58 medicine multiplier has no confirmed source. Ichigo's default Lovesick DoT coefficient and duration are absent from the imported reference and contribute no invented damage. J&C's same-owner-turn Highlight cooldown grace is explicitly provisional.

Five imported kits have substantial tested state machines; the other 15 still need individual implementation and verification. Generic DoT, ONE MORE, All-Out Attack, Technical, Theurgy, and Assist systems remain incomplete. Unsupported Theurgy and Assist actions are disabled. See `PROJECT-COMPLETION-STATUS-2026-09-05.md` for the character-by-character audit.

The orchestration workspace contains the previous main-project files in `p5x-backup-2026-09-05` and the guarded synchronization manifest `p5x-update-manifest-2026-09-05.json`. Test output and benchmark metrics are saved in `outputs/validation/` as `verification-tests-2026-09-05.txt` and `verification-benchmark-2026-09-05.json`.
