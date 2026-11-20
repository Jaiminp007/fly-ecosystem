# GAIN-DOSE Status

- 2026-10-26: V1 FROZEN (`docs/GAIN_DOSE_PLAN_V1.md`, design only).
- 2026-10-26: IMPLEMENTED. Instrument `scripts/gain-dose-dev.mjs`
  (coupled dose d in {0,.5,1,2,4} x 3 pairs + train + unlearned = 21
  mains; V1i transplant/collector/ledger machinery; per-cue per-third +
  first-contact ticks; scorer with G1/G0/G2b + d=1 replication gate +
  OLS quadratic + OPTIMAL/ESCALATE/DE-ESCALATE/OVERDOSE/FLAT/
  INDETERMINATE). Engine untouched (dose is pure options). 9/9 fixtures
  (`tests/gain-dose-dev.test.mjs`: coupled-dose identity, transplant,
  collector thirds + firstTick, quadFit, all scorer branches incl.
  heterogeneous-pair DE-ESCALATE + tip-over INDETERMINATE, d=4
  finiteness short run on synthetic seed 900001, bank tmp+refusal).
  Implement fixes: missing `=>` on runOne (syntax); m4>=m2 guard on
  peak-right ESCALATE (flat-noise protection). Triage clean (6 known
  baseline only). Bank `evidence/gain-dose-dev/fresh-01/` built
  422001–422054 (54 unique). Single authorized attempt NEXT.
- 2026-10-26: Phase-A EXECUTED → **INVALID (replication gate 1/3)**.
  G1/G0/G2b/null-hygiene/dose-fired pass; d=1−d=0 per pair
  +0.00/+0.05/+0.11 → gate fails → INVALID, no license (monotonic
  pooled means 0.40→0.55 reported but unlicensed). Autopsy: uniform
  baselines elevated (0.36–0.46 vs ~0.33 historic) — bank-dependence
  ate the calibration gate. Timing secondary r=−0.26, low-variance,
  inconclusive (instrumentation banked for meta-analysis). Ledger
  21/0/37632/903168/3.40e9, redone []. Cumulative 7668 (+21). 2026-10-26: timing secondary resolved (n=15 dose rows): partial(firstTick|dose)=+0.49 WRONG-SIGNED for encounter-timing (later contact predicts better); hypothesis not supported. Live alternative: within-run cross-cue generalization via shared bits (specified test needs update logs).
  No V2 licensed.
