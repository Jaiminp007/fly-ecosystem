# RSI gen4 fresh eval (retention-line (32,16)) — FAIL, mirror image

Predeclared in `RSI_TASTE_GEN4_LINE.md`. Fresh bank `8a2b3cc7…`, 48 worlds.

## Outcome vs v2 gates: FAIL

* vs unlearned +4.14, 8/8, +69 — pass. vs frozen +3.27, 8/8 — pass.
* vs reset +0.70, 5/8, +3; worst −0.43 ≥ −1.00 — pass noninferiority.
* Skills exist: aSkill +0.96 6/8, bSkill +1.14 8/8, bAcq +0.62 7/8 — pass.
* **aRetention +0.26, 6/8** (losses only −0.16, −0.16) — **PASS**. The line's
  hypothesis confirmed: the dual-true search config generalizes A where the
  score-best failed (gen3: 3/8).
* **bRetention −0.04, 4/8** (losses −0.06,−0.35,−0.54,−0.24; descriptive
  1.048/1.142 = 92% FALSE) — **FAIL** (needs mean>0).
* Transfer 0.0 exactly — pass.

## The A/B tradeoff, demonstrated both ways on fresh seeds

* (64,8) score-line: A 3/8 FAIL, B 5/8 pass.
* (32,16) retention-line: A 6/8 pass, B mean<0 FAIL.
* Larger reservoir keeps B at A's expense; wider recent window keeps A at B's
  expense. No explored memory point jointly holds both skills under the fresh
  margin, though both beat Gen0 on lifetime (+3.5/+4.1 seq). The substrate's
  single shared replay buffer trades the skills against each other — a
  tradeoff-breaking revision (e.g. skill-specific buffers) would be a new
  algorithm, not a grid point.

## Accounting

* gen4 round: 48 worlds. Cumulative RSI: prior 960 + 48 = **1008 worlds**.
* v4 claimants: 2 evaluated (score-line FAIL, retention-line FAIL), both
  preserved. Successive acceptances: **0/2**. Revisions SUSPENDED: no further
  grid search without a tradeoff-breaking idea; Gen0-memory stays the
  unrevised qualified base. No RSI.
