# RSI plan amendment v10: sustained surprise window

## Why

A10/B10 proved the surprise gate fires (192 boosts, ~6% of live steps) but
single-step elevation washes out (g=2 vs g=4 differ at 1e-8). A
neuromodulatory burst must outlast its trigger: on surprise, hold the
boosted rate for W live steps so boundary phases get dozens of accelerated
acquisitions, not one. Same endogenous gate (own squared error vs its EMA),
one added duration parameter, no labels or observer quantities.

## Change (source `taste-energy.mjs` + `--surprise-window`)

* `surpriseWindow` W ≥ 0 integer, default 0 = exact current single-step
  behavior (W=0 path executes identical billed ops; prior tests must pass
  unchanged).
* State `surpriseTimer` iff g>0 (init/reset 0, restore-checked): live step
  with timer>0 stays boosted (unbilled decrement); surprise fire sets
  timer=W and boosts. W=0 fires boost only, timer stays 0.
* All boost accounting stays in unbilled `work.surpriseBoosts`; EMA/threshold
  ops billed as before.
* Menu on R=4 + g=2 base (all else Gen1-fixed): A (greedy) W ∈ {16,64};
  B (random, matched) two of {8,32,128} drawn by mulberry32(20261104).
* Rules unchanged: new search bank v11, ≤96/procedure, fresh eval banks, v2
  gates, copy control, ≥2 successive + productivity. A claimant must beat the
  R=4/g=0 Gen1 baseline on the new bank. All prior failures stand.
