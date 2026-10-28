# Embodied learner development checkpoint

Continuation completed: [retention and transfer development](TASTE_RETENTION_TRANSFER.md)
adds orthogonal odor learning and intake-aware movement. On the same reusable
eight-history bank, survival rises from 40 to **81/192**; the latest matched
frozen/reset controls have 41/65 survivors. Mean energy advantages are +2.247
and +0.829 per original founder. Twelve brief targeted checks pass. A retention
is descriptively 98.11%, B is 92.61%, and transfer remains negative (-0.499).
No fresh qualification, functional-pressure success or RSI is claimed. The
following section preserves the earlier checkpoint.

2026-10-25, approximately 08:00–08:22 America/Toronto. The user's revised
immediate goal was larger working chunks, brief checks and development retries.
This checkpoint integrates the learner into real continuous A/B/C/return-A
worlds, measures a weakness, changes feeding selection and shows repeatable
**exploratory development** gains. The full Astra/RSI objective remains unproved.

The learner learns odor outcomes from its own stationary intake sensations and
movement from its own budget-adjusted energy returns. Physics, initial energy,
lifespans and per-operation/byte-time prices remain unchanged. Every original
founder and terminal debt stays in the denominator. A reusable eight-history
development bank is separate from all previously locked studies/reserves.

| Implementation/run | Histories | Whole-sequence gain over unlearned, per founder | Early learned-over-reset gain | Final survivors, learner / unlearned | Runtime |
| --- | ---: | ---: | ---: | ---: | ---: |
| Probability matching, early A only | 4 | +0.405 | +0.726 | 96 / 96 at end-A | 10.4 s |
| Probability matching, full sequence | 8 | +0.155 | +0.622 | 28 / 22 | 55.9 s |
| Greedy feeding with exploration, full sequence | 8 | +1.030 | +1.502 | 40 / 18 | 58.6 s |

The measured weakness was small final gains, weak retained-skill probes and
substantial mortality. Probability matching samples likely-harmful food with
its predicted positive-class probability. The development revision uses feeding
probability .95 above the classifier's .5 threshold and .05 below, preserving
exploration. The naturally absent-odor always-accept scaffold is unchanged and
shared by reset. This human-proposed change is not an autonomous revision.

An extended full-sequence comparison then added frozen-after-A and reset-at-B/C
controls. It finished in **103.0 seconds**, with these paired development results:

| Comparison | Mean energy gain per original founder | Positive histories | Additional final survivors |
| --- | ---: | ---: | ---: |
| Learner over unlearned-from-start | +1.030 | 7/8 | +22 |
| Learner over frozen-after-A | +0.716 | 7/8 | +11 |
| Learner over reset-at-B/C | +0.423 | 6/8 | +4 |
| Learner over always-accept cruise | +1.443 | 8/8 | +31 |

Final survivor counts are **40 learner, 18 unlearned, 29 frozen, 36 reset and
9 always-accept**, each from 192 original founders. The candidate's complete
endpoints reproduced exactly across the two greedy full-sequence attempts.
The brief readback recomputes energy means, positive-history counts, exact
survivor differences, denominators and endpoint conservation. Nine targeted
core/integration checks pass in approximately 0.54 seconds. No full certification
suite or multi-hour independent trajectory audit was run for these development
iterations, as requested.

Important unfinished work: 152/192 learner founders still die. Final frozen
A/B skill advantages over reset average +0.511 / +0.357, but separate 95%
advantage retention is not established. Original-ecology transfer over reset
averages **-0.154**, so transfer still needs work. There is no fresh held-out
qualification, demonstrated functional-pressure success or RSI result.

All four attempts preserve their exact source snapshots, bank identity, rows
and results under `evidence/taste-development/`. The bank is deliberately reusable
and the greedy method was selected using its outcomes; none of these comparisons
is an untouched confirmation claim. The portable checkpoint is
`handoff/taste-development-20261025/manifest.json`.

Reproduce a development run into a new output directory:

```powershell
node scripts/taste-development.mjs --output evidence/taste-development/next-attempt --ticks 1792 --count 8 --feeding greedy --arms candidate,unlearned,frozen,reset,acceptCruise
```
