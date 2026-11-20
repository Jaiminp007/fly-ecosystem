# R-GAP results — Phase-A single attempt (INVALID-BILLING, line CLOSED)

Frozen plan: `docs/R_GAP_PLAN_V1.md` + V1a. Computed verdict per frozen bars:
**INVALID-BILLING** (transfer guard tripped on both S1 configs, all 12
history-arms) → line CLOSED, no Phase B, no qual spent. This is a failed
RUN (confounded measurement), not a failed hypothesis — the distinction is
the finding.

## Verdict table (frozen bars, computed as written)

| Bar | Result | Detail |
|---|---|---|
| G1 improvement | ✗ FAIL | best validated +0.045 (S2-frontload 0.619 vs control 0.574); S1-shared +0.229 is DISQUALIFIED (guard) |
| G2 transfer guard | ✗ BREACHED → INVALID | S1-shared dT 0.32–3.78, S1-appetite dT similar, all 12 history-arms > 0.1. S2/S3/control: exactly 0.0 |
| G3 caps | ✓ | 252 exec (36 mains + 216 probes) ≤300; 8.02e9 ops ≤20e9; 119808 ticks; 2.88M slots |
| G4 baseline sanity | ✓ | control mean gap 0.574 ∈ [0.5, 2.5] (spent scale mean 1.265 — fresh bank reads slightly lower, valid) |
| G5 triage | ✓ | 9/9 fixture green pre-execution (windows/boundaries/behavior/billing/4 battery smokes/scorer branches); suite = 6 shifted-pristine only |

Ledger exact: 36/252, `redone: []` (no crash, no resume). Cumulative: 7396+252 = **7648**.

## What the guard caught (mechanism, post-hoc interpretation — NOT a bar)

S1's transfer gaps are BEHAVIORAL pause-bias, not billing: trained < reset on
all 12 S1 transfer probes (−0.3 to −3.8, consistent sign) — shared/appetite
policies pause in the cue-free ecology while zeroed cruises, and pausing
loses. Three facts jointly rule out billing: (1) transfer is exactly 0.0 for
every symmetric-billing config across THREE studies (M-GATE/S-GATE/R-GAP
controls); (2) the S1 deviations are large, consistent-signed, and
representation-specific; (3) billing moves values, not decisions — and the
frozen-greedy probe decisions are what differ here. The guard worked exactly
as designed: it caught a confound that LOOKED like signal (S1-shared +0.229
would otherwise have been reported as the best proposal).

## Preserved findings (clean nulls, not confounded)

- **S2 scheduling: no effect, cleanly.** Frontload +0.045, recent −0.116 vs
  control, transfer exactly 0.0. Timing of plasticity does not move the
  trained-vs-zeroed gap (first answer to the charter; the mechanism is fair).
- **S3 td+warm: no effect, cleanly** (−0.017, transfer 0.0). Motor-rule +
  critic warm-start does not move the gap either.
- **The gap is robustly ~0.6–0.8 on fresh data** (control 0.574; spent-bank
  mean 1.265 runs hotter — bank dependence, as always).

## Line status: CLOSED

No proposal clears +0.5; the only near-signal (S1) is confounded by
pause-bias the design cannot separate from discrimination. A revisit would
require a bias-controlled design (e.g., action-matched controls) under its
own frozen plan — explicitly NOT authorized here. Negatives preserved:
all 36 anchors, 216 probe endpoints, ledger, bank, fixture suite.
