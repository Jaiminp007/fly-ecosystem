# RSI plan amendment v6: motor consolidation stacked on taste consolidation

## Rationale

All five failed claimants moved taste-memory composition; none broke the joint
margin, and Gen0 (plain 32/8 uniform) remains the Pareto optimum. The
interference may live downstream: A/B/C share motor blocks 0–3 (cue contexts)
and the actor/critic are overwritten every phase with no protection. This
amendment ports the tested elastic mechanism to the motor pathway.

## Change (source `taste-energy.mjs` + `--motor-consolidation-rate` + `--consolidation-rate` stack)

Consolidation lives in shared helper `consolidateMotor(state,m,withCritic)`
called from ALL THREE motor paths (methods correction 2026-11-01: the first
build placed it only in `motorUpdate`, which the qualified
`motorRule='progress'` family never calls — μ was bit-silent; probe-verified
fix, 20 tests pass). `motorUpdate` consolidates actor+critic;
`renewalUpdate`/`progressUpdate` actor-only (critic frozen there). Each call
site guarded by μ>0 so the default path stays bit-exact.

* `motorConsolidationRate` μ ∈ [0,1], default 0 = exact current behavior (no
  slow keys; 20 tests pass; restore round-trips; reset preserves slow vectors
  — the v5 bug class handled from the start).
* μ>0: after each motor TD update, actor/critic pull toward slowActor/
  slowCritic with rate μ, slow follows with rate μ (same single-param design
  as taste consolidation). Extra ops billed via `math(state)`; slow vectors
  billed per storage byte. No labels — slow is a function of the learner's own
  update stream.
* Menu (stacked): taste γ=0.05 (the only dual-true taste setting) ×
  μ ∈ {0.01, 0.05, 0.2}. Hypothesis (falsifiable): motor anchoring holds the
  phase-shared actor/critic while taste consolidation holds the predictor,
  jointly passing both fresh margins without surrendering lifetime net of
  billed cost. If the stack damps behavior (lifetime falls) or shifts the
  tradeoff again, motor consolidation closes with the rest.
* Rules unchanged: new search bank v7, ≤96/procedure, fresh eval banks, v2
  gates, copy control, ≥2 successive + productivity. All prior failures stand.
