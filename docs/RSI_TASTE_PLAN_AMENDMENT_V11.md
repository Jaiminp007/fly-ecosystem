# RSI plan amendment v11: small surprise windows

## Why

A11/B11 proved W≥8 saturates (dense 6% trigger stream → timer permanently
loaded → global ×3 rate → A-leg breaks). The graded regime, if it exists,
is W ∈ {1..4}: 12–25% coverage, boosting the surprised plus their immediate
neighbors. No code change — `surpriseWindow` already accepts any integer ≥0.

## Menu (R=4 + g=2 base, all else Gen1-fixed)

* A (greedy, predeclared) W ∈ {2,4}.
* B (random, matched) two of {1,3} drawn by mulberry32(20261105).
* Prediction: coverage rises monotonically W=1..4 and at least one cell
  beats the R=4/g=0/W=0 baseline on the new bank; W=4 must not yet show the
  A11 saturation signature (A-leg descriptive fail with B-true).

## Rules unchanged

New search bank v12, ≤96/procedure, fresh eval banks, v2 gates, copy
control, ≥2 successive + productivity. Claimant must beat the Gen1 baseline
on the new bank. All prior failures stand. If small windows also close, the
conclusion is that within-phase plasticity scheduling is exhausted and the
A-leg needs its own representational resource.
