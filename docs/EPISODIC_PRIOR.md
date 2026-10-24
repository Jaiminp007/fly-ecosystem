# Pooled local outcome prior

Completed 2026-10-24T00:56:06.769Z. The fixed study failed all three held-out gates: habitat **false**, incumbent upgrade **false**, and cue-memory retention **false**. Development eligibility was also **false**. The experimental option has not qualified for live adoption. No difficulty promotion or sample extension is allowed from this result.

[Protocol](../evidence/pooled-prior/d8eacda2-4afa-4090-bcb8-846e403e2b97/protocol.json) · [Development selection](../evidence/pooled-prior/d8eacda2-4afa-4090-bcb8-846e403e2b97/locked-selection.json) · [Complete default compatibility](../evidence/pooled-prior/d8eacda2-4afa-4090-bcb8-846e403e2b97/compatibility.json).

## Intervention

For each binary action, the controller first retrieves its existing bounded nearest-neighbor set. It derives one local prior from the union of those selected records, using distance/recency weights with a shared numerical offset. Its action value becomes the weighted observed target sum plus the declared prior mass, divided by the action support plus that prior mass. This is an empirical local estimate from acquired experience, with no correct-action label or future environment access. The prior is not a new stored experience.

An action with no local experience inherits the observed local value and ties exactly with the supported action. With both actions supported and fixed stored targets, pooling toward their shared mean preserves their ordering. The intervention changes unsupported-action preferences and TD-bootstrap magnitudes; it does not directly repair ranking among two supported actions. Neither this arithmetic nor its inspection proves useful adaptation.

The disabled option is omitted from both body parameters and memory configuration. 4 historical complete world checkpoints matched their recorded hashes exactly. Enabled checkpoints retain the strength, raw estimate, relative support, prior and pooled estimate. JSON restore/continuation, incompatible settings, malformed metadata and empty acquired memory in descendants are verified. Joint control and reserve-risk combinations are rejected for this experiment.

## Fixed evaluation

Two prior masses 1 and 4 are specified before 12 development seeds and 30 held-out seeds. The development lock selected **prior-4**, eligible **false**. Reproduction and mutation are disabled, with 24 matched founders and 1800 ticks at nutrient 0.4, in stable and relocating-food worlds. Storage limits, sensors, motor levels, TD windows and simulated physical prices remain fixed. Existing record-scan charges apply; pooled arithmetic reuses the selected statistics. Actual CPU cost need not be identical and is not certified by the energy ledger.

The held-out gate requires all matched frozen, memory-disabled, neural and full-range controls in BOTH habitats, incumbent preservation/improvement, separate cue-memory retention and development eligibility. No held-out reselection or sample extension is allowed. The cue component exercises memory retrieval and delayed-context retention; it does not establish habitat TD bootstrapping or whole-body continual learning.

## Held-out outcomes

[Full results](../evidence/pooled-prior/d8eacda2-4afa-4090-bcb8-846e403e2b97/results.json) · [Audit](../evidence/pooled-prior/d8eacda2-4afa-4090-bcb8-846e403e2b97/audit.json). Energy differences are per founder; population differences are ending agents per world. Brackets are the declared seed-level intervals.

| Control | Stable energy [interval] | Stable mean population | Relocation energy [interval] | Relocation mean population |
| --- | ---: | ---: | ---: | ---: |
| Learning frozen | 2.352 [1.579, 3.126] | 0.000 | 1.077 [-0.027, 2.181] | -0.133 |
| Memory acquisition disabled | 2.677 [1.956, 3.399] | 0.000 | 0.895 [-0.248, 2.037] | -0.100 |
| Confirmed incumbent / prior disabled | 0.618 [-0.211, 1.447] | 0.000 | 0.184 [-0.853, 1.221] | 0.067 |
| Neural control | 5.172 [4.414, 5.931] | 0.467 | 11.167 [9.932, 12.401] | 1.333 |
| Full-range movement | 3.415 [2.304, 4.526] | 0.233 | 7.664 [6.279, 9.049] | 0.367 |

The relocation gains over frozen and memory-disabled learning controls remained uncertain, and their population means were negative. Improvement over the incumbent was not established. Stable-food energy gains do not waive these failed survival/adaptation requirements.

The separate cue component retained A accuracy 0.951 [0.919, 0.983] and B accuracy 0.951 [0.918, 0.983]. A's change after learning B was -0.025 [-0.056, 0.006], whose lower interval bound missed the declared preservation threshold -0.05. Accuracy above chance does not waive this retention guard. This cue task is separate from whole-body continual skill retention.

## Mechanism checks and unresolved ranking problem

In stable, the prior arm recorded 0 unsupported-zero preferences versus 4176 in the incumbent trajectory; 13412 decisions differed from their unpooled ranking in the prior arm. In relocation, the prior arm recorded 0 unsupported-zero preferences versus 4881 in the incumbent trajectory; 14070 decisions differed from their unpooled ranking in the prior arm. These are descriptive counts on diverging trajectories, not paired individual causal effects. The intended missing-evidence behavior changed without qualifying the policy.

A separate [support-stratification replay](../evidence/action-support/d789acc5-cb2d-433b-ab1a-f3a961a8f364/results.json), with [arithmetic/hash audit](../evidence/action-support/d789acc5-cb2d-433b-ab1a-f3a961a8f364/audit.json), revisited 20 existing historical action-fork seeds. All original baseline endpoints and sampled retrievals reproduced. Among 100 cases with both actions supported, seed-level ranking agreement with the sampled longer-horizon energy effect was 0.532 [0.450, 0.615]; greedy gain over a random first action was 0.136 [-0.189, 0.460]. Missing support therefore does not exhaust the unresolved estimation problem in these sampled cases. These are post-hoc reused data with limited action-effect horizons, not independent qualification or proof of an optimal policy.

## Verification and preserved preliminary attempts

The recomputation audit covers 552 fixed-study worlds, with 24 exact complete-state held-out replays. Maximum short-study energy-accounting residual: 2.315118763362989e-9. Development selection, paired outcomes, cue-memory summaries and all qualification gates were recomputed from raw records. Whole-world replay covers only the declared subset, not all worlds.

79 Node tests passed. [Test log](../evidence/pooled-prior/d8eacda2-4afa-4090-bcb8-846e403e2b97/checks/node-tests.log). A [paused-world DOM/API inspection](../evidence/prior-inspection/9ad47d9c-1edd-438b-9b0f-1616adf4b9f0/browser.json) matched displayed raw/pooled values, support, prior mass and actual motor output. No screenshot/pixel-layout verification is claimed. Its temporary process was terminated and confirmed absent. The main live habitats were not modified.

A preliminary compatibility attempt is preserved in [its failure record](../evidence/pooled-prior/9b0d32fd-6b6e-4a1b-a9d4-200aab956b33/failure.log): JSON object key insertion order differed from the historical hashed configuration. Replaying the same historical order produced complete equality. A subsequent [partial development campaign](../evidence/pooled-prior/79cc240f-daad-45dc-83f0-269f14b7b9b7/interruption.json) was stopped for the unsupported-action numerical tie correction before held-out evaluation. That evidence is retained and its seeds are excluded from the corrected fixed campaign. No partial outcome was used to select a held-out policy.

Do not adopt or extend this failed policy to force a pass. Next work needs a separately specified estimator that can discriminate action effects when both actions already have local experience, with matched ablations and unchanged learning/survival gates. The full RSI goal remains active and unachieved.
