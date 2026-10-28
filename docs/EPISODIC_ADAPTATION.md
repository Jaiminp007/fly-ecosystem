# Adaptation screen and same-body memory probes

Latest follow-up: [learned reserve-cost study](EPISODIC_RESERVE.md) and [runtime optimization](RUNTIME_CATCHUP.md).

Recorded 2026-10-23T19:33:25.527Z. The full RSI goal remains active. No controller upgrade or environmental promotion qualified. The previously confirmed stable-world learner remains the incumbent.

## What the diagnosis established

[Phase/recall replays](../evidence/episodic-confirmation/2e3dcc99-51c7-402a-bd2b-305aff52ee25/adaptation-diagnosis/results.json) reproduced 30 recorded trajectories exactly. In the first 10 relocation seeds, 69.2% of recalled neighbors during the first 200 ticks after a shift came from before that shift. The TD learner chose the fast speed on 68.5% of those agent-ticks versus 56.8% for observed-window learning. Old memories can remain useful; these observations do not establish a causal failure mechanism. Phase-level food fields in this diagnostic accumulate clipped lastFood (at most one per agent-tick), not total consumed energy. Final replay comparisons use the engine's full food total.

## Bounded factorial screen

[Protocol and results](../evidence/episodic-adaptation/4dc8f483-9c0c-45a1-a98e-de169d325e2b/results.json) · [audit](../evidence/episodic-adaptation/4dc8f483-9c0c-45a1-a98e-de169d325e2b/audit.json).

The predeclared eight policies crossed TD/observed-window targets, reservoir/hybrid replacement, and zero/32-experience recency half-life. Hybrid memory reserves one quarter of the existing total capacity for the newest experiences and uniformly samples older displaced records in the remaining slots. Recency affects retrieval weights and ranking; it does not invent rewards. Total storage bounds, energy prices, founder bodies and motor levels stayed fixed. Both features are opt-in; defaults retain the old behavior.

12 fresh development seed pairs in each of stable and relocating habitats were evaluated before selection. Cue-retention and nonnegative mean population guards took priority over energy rank.

| Candidate | Cue-retention guard | All development guards | Worst mean energy advantage |
| --- | --- | --- | --- |
| td-reservoir-recent0 | pass | pass | -0.87 |
| td-reservoir-recent32 | pass | fail | 1.42 |
| td-hybrid-recent32 | fail | fail | 0.87 |
| mean-hybrid-recent0 | fail | fail | 0.22 |
| mean-reservoir-recent0 | pass | fail | -0.06 |
| mean-hybrid-recent32 | fail | fail | -0.61 |
| mean-reservoir-recent32 | pass | fail | -0.79 |
| td-hybrid-recent0 | fail | fail | -0.87 |

The locked selection was **td-reservoir-recent0**, the unchanged incumbent. The recency-only TD variant had a better development energy score but failed the survival guard. Hybrid variants failed the cue-retention guard. Held-out data did not trigger reselection. The experiment therefore produced no qualified adaptation improvement.

## Fresh locked-policy outcomes

30 untouched seed pairs per environment; reproduction and mutation disabled; 24 matched founders, 1800 ticks. Energy is per founder; population is per world.

| Control | Stable energy [95% interval] | Stable population | Relocation energy [95% interval] | Relocation population |
| --- | --- | --- | --- | --- |
| frozen | 1.52 [0.82, 2.23] | 0.00 | 1.18 [0.13, 2.24] | -0.10 |
| noMemory | 1.83 [1.05, 2.60] | 0.00 | 0.97 [-0.10, 2.03] | -0.10 |
| neural | 3.53 [2.51, 4.55] | 0.43 | 8.59 [7.08, 10.10] | 1.67 |
| fullRange | 2.73 [1.66, 3.80] | 0.27 | 8.47 [7.43, 9.51] | 0.80 |

The joint habitat gate failed. The incumbent-comparison upgrade gate also failed: selecting the incumbent yields zero improvement over itself. The separate cue-memory gate passed. All 744 evaluated worlds had matched inherited founders and checked energy ledgers; maximum absolute residual 2.700e-9. All comparisons, selection ranks and cue intervals were recomputed in the audit. This is an unsuccessful upgrade study, not a successful independent confirmation of a new algorithm.

## Exploratory memory retention in the same surviving bodies

[Probe protocol and outcomes](../evidence/episodic-retention/3b598126-9414-406c-b14d-5ec5915ba6a5/results.json) · [audit](../evidence/episodic-retention/3b598126-9414-406c-b14d-5ec5915ba6a5/audit.json).

The incumbent trained for 600 ticks in stable landscape A and then 1200 ticks with relocating food B, without resetting any acquired state. End-B surviving bodies were branched into common probe landscapes. Body, position, neural state and exploration RNG were matched across branches. Each branch received a standardized 60-energy probe budget and a saved food field; the signed energy intervention was entered in the ledger. All learning was frozen during the 600-tick probes. Only the episodic store differed: current end-B memory, the same body's saved A memory, or empty memory.

Across 20 seeds, the A-landscape end-B memory advantage over empty memory was **0.91 [0.46, 1.35]** energy per surviving founder. Saved A memory also helped: 1.06 [0.51, 1.61]. End-B minus saved-A memory was -0.15 [-0.94, 0.64]; absence of a statistically clear difference does not establish noninferiority.

In landscape B, end-B minus empty memory was 0.63 [-0.11, 1.37], and end-B minus saved-A memory was -0.43 [-1.23, 0.36]. Improved new-landscape skill was not established. These exploratory survivor-conditioned probes show useful memory still present after additional experience in the same bodies. They do not prove two distinct retained skills, full-population survival gains, or broad continual learning.

## Terminal credit and next experiment

[Death-credit replay](../evidence/episodic-confirmation/2e3dcc99-51c7-402a-bd2b-305aff52ee25/death-credit-diagnosis/results.json) exactly reproduced 60 trajectories. Across 20 seeds, deaths were 4 for TD, 2 for observed-window and 3 for memory disabled. Terminal TD targets ranged from -3.104e-3 to -4.355e-5 with zero future value. The controller currently learns energy rewards, with no separate learned mortality target. This is a reason to test reward/survival alignment, not evidence that terminal credit caused the failed gate.

Next: evaluate a learned survival-risk or viability estimate with an explicit ablation, keeping the same inherited bodies and prices. Require retained stable-world gains, matched learning-off controls, and the existing population guard before any promotion. Do not keep enlarging memory or lower the environment gate to force a pass. Agent-generated algorithm changes and RSI remain unimplemented.

## Verification and runtime

- Node regression suite: **56 passed**. Hybrid partition, reward reversal, absent-context recall, malformed recency settings, exact checkpoint continuation, and old checkpoint defaults are covered.
- Three legacy relocation seeds reproduced their recorded baseline outcomes exactly after the initial extension. Post-study small-positive-half-life validation and disabled-recency arithmetic refactoring are checked separately in compatibility-replays.json; use archived sources for exact historical resumes.
- The running app health endpoint returned ok. During concurrent study/probe work, a 12.04-second live sample measured 4.03 artificial seconds per wall second against a 10× target. The target is not currently sustained; this is not an FPS measurement or matched optimization benchmark.

Reproduce the study from its archived source tree as the working directory, using absolute reference/output paths. The source/reference hashes reject mixed-source resumes. The same-body probe refuses an existing output directory to preserve earlier evidence.
