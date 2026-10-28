# RSI plan amendment v9: surprise-gated plasticity on the R=4 base

## Why

Gen6 accepted at 1/2 successive with aRetention exactly 4/8 — the A-leg is
the fragile one. Return-A relearning is slow on some seeds; B must also
survive C on a low base rate. Both wants are served by one endogenous rule:
plasticity gated by the learner's own surprise (squared prediction error vs
its EMA). Boundaries spike error → boosted acquisition exactly where
relearning happens; stable phases run at the low base rate → less
overwriting where protection happens. Fast at boundaries, slow within
phases. No labels, no phase counters, no observer quantities — only own
taste errors, billed per op.

## Change (source `taste-energy.mjs` + `--surprise-gain`)

* `surpriseGain` g ≥ 0, default 0 = bit-exact prior behavior (new ops fully
  guarded; all prior tests must pass unchanged).
* Live taste updates only (replay stays at base rate — mixture consolidation
  must not accelerate): squared error feeds an EMA (α=0.05); if the EMA is
  warm (>1e-4) and current error > 2×EMA, that step learns at
  base×(1+g). Cold start never boosts (errors expected while naive).
* State `surpriseEma` iff g>0; zeroed on reset; frozen bodies don't learn so
  probes are unaffected; restore-checked.
* Menu on the accepted R=4 base (all else Gen0-fixed):
  A (greedy, predeclared) g ∈ {2,4}; B (random, matched) two of {1,3,6}
  drawn by mulberry32(20261103).
* Rules unchanged: new search bank v10, ≤96/procedure, fresh eval banks, v2
  gates, copy control, ≥2 successive + productivity. A claimant must beat the
  R=4 Gen1 baseline on the new bank. All prior failures stand.
