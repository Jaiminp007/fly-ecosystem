# P17 exploration: selection relay (stopped before a frozen test)

This was exploration only. No frozen test was run. Seeds 99101–99104 (pairs / staircase / pairs / staircase), histories 99601–99604, 4 lineages × 8 generations. Probe: `scratch/p17-probe.mjs`.

| Arm | Survivors, all generations | Generations 6–8 | Target terms held at the end |
|---|---|---|---|
| S0 | 10.39 | 10.08 | 0–1 |
| TRUE (oracle) | 15.57 | 15.40 | all |
| RELAY (P12: founder i → founder i) | 12.95 | 13.52 | 2.9–3.5 |
| SELECT (parents drawn from survivors, pruning τ = 2) | 12.80 | 13.15 | 3.0–3.5 |
| SEL_SHAM (parents drawn at random, pruning) | 12.82 | 13.60 | 2.8–3.4 |
| SEL_RAND (survivor parents, random extensions) | 11.20 | 11.35 | 0.7–1.6 |

**The headroom gate passed, but selection added nothing.**
- The pre-set headroom gate (TRUE − RELAY ≥ 2) passed at 2.62.
- SELECT − SEL_SHAM was −0.02.
- The relay already finds nearly all target terms without selection, so selection over masks has nothing left to choose between.
- The only positive contrast is own evidence vs random extensions under selection, about +1.6, which restates P12.

**Decision (Fable review, 2026-11-17):** stop, and do not run a frozen P17.
- Record selection as **not tested**: a 4-rule exploration found no benefit, because the relay already saturates term discovery.
- Four rules cannot rule out a small effect, so this is not recorded as a failed test.

**The remaining gap is unexplained.** About 1.9 survivors in generations 6–8 remain, with the targets held. The presumed cause is unverified: extra false masks dilute the step/√n learning rule. Fixing it would mean tuning the learner, which closes none of the open gaps, so it was not pursued.
