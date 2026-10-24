# Bounded self-applicable learning programs

Completed 2026-10-24T02:59:33.026Z. The full RSI goal remains active and unachieved.

The new offline lab agent can edit an executable weight-update expression and, after an accepted revision, use that same expression to learn its structural-edit preferences. The fixed-proposer control keeps its original preference-learning rule. **This study accepted no revisions.** The self-application path was exercised by software tests, but no recursive improvement chain occurred in the experiment.

## Protocol and mechanism

The [protocol](../evidence/self-modification/a5f74db8-2b02-4ae5-a8dd-17c8c416c2d3/protocol.json) was written before collecting fresh worlds or evaluating proposals. The initial rule is normalized gradient descent, represented as JSON instructions: `.2 * gradient / norm`. The bounded interpreter supports arithmetic, sign, square root, and registers for momentum, gradient magnitude, feature norm, update count and current weight. Expressions cannot read files, execute arbitrary code, access the evaluator, or consume future labels. Expressions have maximum node and depth bounds. Edits include normalization, momentum, decay and sign transformations as well as scaling. Syntactic edits alone do not establish a new algorithmic capability.

Both arms had 3 rounds and 24 proposals per round. Development used 6 previously recorded seed pairs. Each round had a disjoint 8-seed acceptance bank; a final 16-seed bank was never used for selection. All fresh seeds were checked against archived protocol registries. The modifier receives development improvement only. Acceptance labels decide whether to replace a rule; they are excluded from the preference-update target.

The task forecasts a completed factual eight-tick reward window from current fly observations and movement choice. It is **not an embodied controller upgrade**. Each founder's forecasting weights train on fixed-food experience, carry into relocating-food training, and are tested again on the original fixed-food queries. Test queries never update weights. The target is the discounted reward average. Each factual world remains on its confirmed controller.

Acceptance requires improved post-training error in both environments, useful acquired learning versus reset weights, and no mean retention regression. Seed-level one-sided exact sign-flip tests use the declared threshold 0.004166666666666667; these tests assume symmetric independent paired effects. No failed round was extended or resampled.

Realized update-expression work was 49,566,720 node-coordinate evaluations in the self-applying arm and 49,566,720 in the control. These counts cover candidate weight updates; they exclude forecasts, preference updates, validation and compilation. Equal proposal budgets and maximum bounds are not a general claim of equal runtime or total compute.

## Results

Positive MSE differences favor the candidate. Development reduction uses the declared objective, including its retention penalty.

| Round | Development objective reduction | Fresh fixed-food MSE reduction | Fresh moving-food MSE reduction | Decision |
| --- | ---: | ---: | ---: | --- |
| 1 | 1.52% | 3.4881e-05 | -3.2176e-05 | rejected |
| 2 | 5.32% | -1.1677e-04 | -2.3793e-04 | rejected |
| 3 | 5.10% | -7.7460e-05 | -4.8345e-04 | rejected |

The same candidates were selected in the control arm. Because no revision passed, the proposer rules never diverged. The final retained programs had exactly equal errors to the initial rule and control. In the final bank, acquired learning versus zero/reset weights had mean MSE improvement -3.9306e-04 in fixed food and 2.7529e-04 in moving food; neither met its significance gate. This does not establish a general learning advantage for this forecast architecture. The experiment cannot estimate whether a successful self-application would improve future search.

## Verification

The [audit](../evidence/self-modification/a5f74db8-2b02-4ae5-a8dd-17c8c416c2d3/audit.json) checked source fingerprints, reference files, seed separation, every stored program score and gate, and reproduced all 144 proposals including their RNG states and modifier checkpoints. It checked 36,000 completed factual windows from 80 fresh worlds. 8 selected cold physical replays reproduced every observed window, metric and final-world hash exactly. This was the first seed of each bank in both environments; the other worlds were not physically rerun. An intentionally altered comparison was rejected. The software suite passed, including exact modifier continuation, bounded execution, malformed-state rejection, reset effects and the self-application/control distinction.

Reproduce the audit:

```sh
node scripts/audit-self-modification.mjs evidence/self-modification/a5f74db8-2b02-4ae5-a8dd-17c8c416c2d3
```

`node scripts/self-modification-study.mjs` starts a distinct prospective study with a new directory and seed banks. Do not use repeated runs to reinterpret the rejected study as a pass. [Full results](../evidence/self-modification/a5f74db8-2b02-4ae5-a8dd-17c8c416c2d3/results.json).

## Remaining work

Before more program search, test whether this forecast representation and training protocol can learn reliably across worlds. Diagnose capacity and distribution shift against stronger fixed learners on archived data; any new confirmation needs a separately locked prospective protocol. No weakening of this failed gate, live-policy promotion, survival conclusion, general intelligence claim or RSI completion follows from this result.
