# RSI plan amendment v5: replay consolidation (dual-weight pull)

## Why this algorithm (not another grid point)

Four fresh-evaluated claimants fail the joint retention margin in alternating
directions; stratification moved the tradeoff without breaking it. The common
mechanism is unopposed overwriting in a single fast weight vector. This
amendment adds a genuinely new dynamic: a slow weight vector that consolidates
replay experience and elastically anchors the fast weights.

## Change (source `taste-energy.mjs` + `--consolidation-rate`)

* `consolidationRate` γ ∈ [0,1], default 0 = exact current behavior (no
  `slowTaste` key, no extra ops; all 18 tests pass, restore round-trips both
  shapes, invalid γ rejected).
* γ>0: on REPLAY updates only, fast += γ·(slow−fast), then
  slow += γ·(fast−slow) (single-param; live plasticity untouched; prediction
  still uses fast). All extra arithmetic flows through the `math(state)`
  wrapper, so consolidation compute is honestly billed per op; the slow vector
  is honestly billed per storage byte. No labels, no exogenous information —
  slow is a pure function of the learner's own replay stream.
* Menu: γ ∈ {0.01, 0.05, 0.2} on the Gen0 base (32/8, S=1, progress/hold1).
  Hypothesis (falsifiable): some γ lifts BOTH fresh retention margins by
  slowing phase-overwrite without surrendering lifetime net of billed cost.
  If γ merely damps learning (lifetime falls) or shifts the tradeoff again,
  the elastic-consolidation family is closed with the rest.
* Rules unchanged: new search bank v6, ≤96/procedure, fresh eval banks, v2
  gates, copy control, ≥2 successive + productivity. All prior failures stand.
