# Retention and transfer development

This continuation uses the same explicitly reusable eight-history development
bank. Earlier locked studies and closed reserves remain unchanged. Each attempt
keeps its sources and all outcomes; none is held-out qualification or RSI.

The first revision adds all products of the four sensed odor signs: constant,
four singles, six pairs, four triples and the quadruple, normalized by 1/4.
For the sixteen possible odors these vectors are orthonormal. Ordinary unclipped
logistic updates to one odor therefore leave the other odor predictions unchanged.
This uses sensed bits and the body's own signed stationary intake, never patch
identity or hidden valence. The exploratory taste step size is 1 instead of .1;
both representation and step size change together in attempt 05, so that run
does not isolate their effects. Five additional weights and actual extra work
and bytes are charged. This is sufficient capacity for these odors, not evidence
of successful learning under functional memory pressure.

The runner now saves end-B bodies and compares end-C current, saved-A/saved-B,
and reset models on common physical bodies, inventory, random streams and debt.
Both saved and current models are compacted identically and frozen. Descriptive
retention compares their mean advantages over reset, requiring a positive saved
advantage before reporting a 95% threshold. Deaths retain the original founder
denominator. These exploratory ratios are not confidence bounds or qualification.

A second prospective development hypothesis concerns movement: the old motor
policy sees local contact but cannot distinguish a learned positive odor from
a learned negative one. Its 16-tick hold also delays reacting to new contact.
An optional contextual motor will route the same lawful features into separate
search / predicted-positive-contact / predicted-negative-contact blocks using
only the learner's own current taste prediction. No-odor contact routes to the
positive-contact block, consistent with the shared accept scaffold. A shorter
four-tick hold will be tried with unchanged discount time scale, physical costs
and lifetime accounting. This is a human-proposed revision, not an autonomous one.

Attempt 06 improves lifetime energy but fails transfer on all eight histories.
Its completed early probes show less food intake than reset. The next revision
splits positive contact by whether the body's own previous signed intake is
positive. Productive contact receives a fourth motor block; zero/negative prior
intake keeps the earlier nonproductive contact block. This explicitly represents
active feeding versus depleted contact, without reading remaining patch amount.
The extra comparison, calculations and state are charged. It is a development
hypothesis motivated by the observed failure, not an established explanation.

## Completed exploratory results

All three new attempts ran eight A/B/C/return-A histories of up to 1792 ticks
with candidate, unlearned, frozen-after-A, reset-at-B/C and accept-cruise arms.
All 192 original founders stay in each endpoint denominator. The same development
bank is intentionally reused. No physical cost, initial energy or lifespan was
changed; added learner calculations and canonical state bytes incur normal prices.

| Attempt | Candidate survivors | Frozen / reset survivors | Energy over frozen / reset per founder | Transfer energy over reset | Runtime |
| --- | ---: | ---: | ---: | ---: | ---: |
| Previous 04: pairwise, shared motor, hold 16 | 40 | 29 / 36 | +0.716 / +0.423 | -0.154 | 103.0 s |
| 05: orthogonal taste, rate 1 | 44 | 29 / 31 | +0.751 / +0.529 | -0.242 | 105.0 s |
| 06: appetite motor, hold 4 | 72 | 45 / 60 | +2.111 / +1.056 | -0.831 | 120.3 s |
| 07: intake-aware motor, hold 4 | 81 | 41 / 65 | +2.247 / +0.829 | -0.499 | 122.0 s |

Attempt 07 has the highest observed survival: 81/192 (42.19%), versus the earlier
40/192 (20.83%). This is +41 survivors, a 21.35 percentage-point increase on
tuned development histories. Its matched unlearned control has 21 survivors,
frozen 41, reset 65 and accept-cruise 9. Energy gains over frozen are positive
in 8/8 histories and over reset in 7/8. Early acquired-A advantage over reset
is +2.940 per original founder. Attempt 06 has slightly higher mean lifetime
energy than 07 (+4.086 versus +3.911 over the fixed accept-cruise arm), so the
survival improvement is not a win on every measure. Neither is an overall
qualified learner. Options remain explicit; legacy defaults are preserved.

Same-end-C-body descriptive retained/saved energy-advantage ratios:

| Attempt | A | B | Current minus saved probe survivors, A / B |
| --- | ---: | ---: | ---: |
| 05 | 96.01% | 98.85% | -1 / +1 |
| 06 | 91.50% | 91.10% | +2 / +2 |
| 07 | 98.11% | 92.61% | +4 / +1 |

These ratios use positive aggregate saved-over-reset advantages. They are
descriptive means on reused histories, not simultaneous bounds or evidence of
95% retention under functional pressure. Attempt 05 loses one A probe survivor;
07 still misses the B energy threshold. Saved/current full models differ in
both taste and motor weights. Orthogonal taste features do not protect the
shared lifetime motor skill, and clipping could also break exact orthogonality.
No functional-capacity-pressure success has been demonstrated.

Transfer remains a failure: attempt 07 is -0.499 energy per founder against
reset, positive in only 2/8 histories, with tied aggregate probe survivors. The
intake split improves this against attempt 06 but remains worse than the earlier
checkpoint on this endpoint. Original-ecology movement generalization and B
retention are the next concrete problems. Human-proposed feature and interval
changes are not autonomous learning-algorithm revisions or RSI.

## Brief checks and reproducibility

Twelve targeted core/integration tests pass in about 0.53 seconds, covering
orthogonal features, lawful contextual routing, short holds, checkpoint restore,
terminal updates, costs, common probe starts and no revival. A separate 3.8-second
independent fixture check covers the original pairwise/shared-motor implementation
after the configuration extension; it does not audit the new mechanisms. The
Python observer explicitly rejects the new mechanisms instead of certifying them.
No full suite or multi-hour numerical world audit was run.

`scripts/summarize-taste-continuation.py` completed a 0.60-second readback of all
four result sets: captured source hashes, endpoint arithmetic/debt conservation,
physical residuals, common probe starts, control effects, survival counts and
descriptive retention means. Results are in
`evidence/taste-continuation/20261025-v1/summary.json`. All three new attempts keep
their exact executed sources, complete rows, models and results. The incremental
portable checkpoint is `handoff/taste-continuation-20261025/manifest.json`, with
the previous checkpoint linked separately. It is hash checked; a full temporary
restore is deliberately omitted for this development checkpoint.

Run the intake-aware development version into a new output directory:

```powershell
node scripts/taste-development.mjs --output evidence/taste-development/NEW-ATTEMPT --ticks 1792 --count 8 --feeding greedy --taste orthogonal --taste-rate 1 --motor intake --hold 4 --arms candidate,unlearned,frozen,reset,acceptCruise
```

The options `--motor appetite --hold 4` reproduce the 06 method; omit motor/hold
for the 05 method with shared movement. Archived attempts must use their captured
sources for exact reproduction, including configuration/serialization changes.
No previous study, old failure, archive or closed confirmation reserve is changed.
