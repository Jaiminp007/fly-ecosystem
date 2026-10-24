# Assignment, history and horizon intervention study

Performance collection completed, 2026-10-24. **The locked action-value and weighting-follow-up gates failed.** [Results and current audit status](INTERVENTION_RESULTS.md). This is the first stage of the [revised research goal](RESEARCH_GOAL.md), following [Astra's recommendations](ASTRA_REVIEW_DECISION.md). [Locked protocol and sources](../evidence/intervention-study/20261024-assignment-history-horizon-v1/protocol.json).

The collector executes both first-action branches from the same unmodified pre-decision checkpoint. It forces one eight-tick speed choice, restores the natural decision RNG continuation, and then lets the incumbent continue learning. At eight and 256 ticks the branch matching the natural action must reproduce the complete natural world exactly, including acquired state. Other branches are counterfactual diagnostic data. They never train a live fly.

## Frozen design before collection

- Eight development seed pairs: four for fitting, four different pairs for selecting one candidate. Sixteen additional held-out seed pairs. Stable and relocating-food environments retain their original settings; the same seed pairs share bodies and initial resource layouts. They are not distinct-task retention tests.
- Two predetermined founder identities, sixteen scheduled decision checkpoints per world. There is no replacement by surviving founders. Dead founders stay in the scheduled denominator; a death within a branch has zero terminal energy. The endpoint is terminal energy change relative to checkpoint energy, not a survival model or long-run policy value.
- Behavior-selected outcomes, independently fair-selected outcomes and privileged paired outcomes share the same checkpoint bank. Observational, IPW, direct IPW contrast, prequential DR, uniform, paired, explicit-exploration and matched-uniform fits use one fixed weighted Laplacian ridge estimator class. Current-observation and three-previous-own-decision history representations are compared. History scaling is a declared representation package, so a difference does not isolate information from metric effects.
- Full training fits use at most 128 labels; the paired reference spends two labels at half as many checkpoints. Its alternating sampling covers both founders and the time grid. Explicit exploration excludes ties; the matched-uniform reference uses the exact same sparse checkpoint subset. DR uses nuisance estimates before receiving the current label. Pooled cross-founder development learning is disclosed and cannot establish individual own-experience learning.
- Pick a nonprivileged candidate at horizon 256 by its worst development-selection mean advantage across the incumbent greedy first action and both constant first actions in both environments. Save every fitted model hash and the choice before collecting held-out worlds. Held-out data never update models.
- Twelve comparisons share family alpha .05: six action-value tests and six specified weighting-mechanism/noninferiority tests. A gate needs positive simultaneous Student-t lower bounds and passing paired sign-flip tests at the declared per-test alpha. The independent unit is the seed pair, not the checkpoint. Assumptions and the conditional-on-one-training-bank limitation appear in protocol.json.

Constant-action controls refer to the first eight-tick action only. Later behavior is the incumbent's continuation. Even a passing action diagnostic cannot qualify whole-life fixed-policy superiority, embodied learning, retained skills or RSI.

## Review, reproducibility and next decision

Astra identified three blockers in the initial implementation: overlapping future labels in the DR nuisance fit, lack of enforcement that the captured code actually runs, and insufficient validation of row identities against registered statistical units. The implementation now releases nuisance labels only after their horizon ends, requires archived runner/auditor entrypoints, and checks every seed/environment/checkpoint/founder identity. Tests exercise delayed labels, future-query exclusion, terminal denominators and duplicated-world rejection. The final machine-readable protocol will archive all physical and learner sources, fresh seed registries, assignment seed, inference constants, endpoint and gates. Source changes after locking require a distinct prospective protocol; failed samples will not be extended.

The mechanism screen only motivates further weighting research. It cannot identify systematic propensity bias: contrast/DR candidates change targets and model structure, and the experiment uses one training-bank/assignment realization. All methods share the maximum raw-label budget, but history features and the extra DR nuisance matrix use different storage and compute. Report those costs; do not claim equal total memory or arithmetic.

Astra reviewed the corrections and returned **Go for the bounded diagnostic** in run 4 of the [existing consultation thread](t3-thread://v1/mcp:1c9455cc-ca9f-4a5b-9ce3-5195a55afb00). That is source-review evidence; Astra ran no simulations or tests. The local regression suite passed 119 tests before collection. Review approval and passing software tests do not establish scientific performance.

The JavaScript audit cold-replays every world and action fork, rebuilds every model, and reproduces selection, scores and gates. The Python auditor independently solves the weighted kernel systems and recomputes held-out policy values, intervals and sign-flip statistics. These audits establish reproducibility, not another scientific sample.

If weighting does not clear both action and mechanism gates, do not enlarge that research program on this evidence. Compare the randomized, paired and history references to choose the next representation, horizon or acquisition intervention. A later embodied test must use continuous distinct regimes, own resulting trajectories, actual memory pressure and separate retained-skill/survival gates. A later recursive test must preserve state across generations and use the copied-improvement control.

Commands (replace DIRECTORY with a new evidence/intervention-study run directory):

```sh
node scripts/intervention-study.mjs init DIRECTORY
node DIRECTORY/sources/scripts/intervention-study.mjs development DIRECTORY
node DIRECTORY/sources/scripts/intervention-study.mjs lock DIRECTORY
node DIRECTORY/sources/scripts/intervention-study.mjs heldout DIRECTORY
node DIRECTORY/sources/scripts/intervention-study.mjs evaluate DIRECTORY
node DIRECTORY/sources/scripts/audit-intervention-study.mjs DIRECTORY
python3 DIRECTORY/sources/scripts/audit-intervention-numerics.py DIRECTORY
```

Use the archived runners after initialization so all fitting, scoring and physics imports resolve to the captured sources. Development output, selection lock, held-out output, results and audit reports are preserved separately.
