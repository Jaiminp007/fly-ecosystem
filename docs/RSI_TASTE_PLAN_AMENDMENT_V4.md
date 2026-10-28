# RSI plan amendment v4: stratified replay (tradeoff-breaking attempt)

## Diagnosis driving this dimension

Gen3/gen4 showed a shared-buffer A/B tradeoff in both directions on fresh
seeds: uniform replay over one recency-ordered pool lets the current phase's
records dominate — wide-recent (32,16) replays return-A records and holds A
while losing B; big-older (64,8) replays B/C records and holds B while losing
A. The failure is compositional, not capacity: WHO gets replayed, and the
recency order is the learner's own endogenous buffer order (not an observer
label), so stratifying by it is ecologically lawful.

## Change (source: `taste-energy.mjs` + runner `--replay-strata`)

* `replayStrata` S ∈ {1..8}, default 1 = exact current behavior (single
  uniform draw; bit-identical RNG consumption; all 18 tests pass).
* S>1: split `[...older, ...recent]` into S contiguous recency strata
  (oldest-first, sizes differ by ≤1), draw stratum uniformly, then record
  uniformly within. Oldest (A-phase) records keep 1/S replay share no matter
  how much B/C follows. Extra RNG draws and any compute are billed as usual.
* Menu: S ∈ {2, 3, 4} on the Gen0-memory base (32/8, progress/hold1, else
  Gen0), i.e. 3 new configs. Hypothesis (falsifiable): some S holds BOTH
  skills' fresh margins while keeping lifetime — the joint outcome no memory
  size achieved. If S merely moves the tradeoff (A up / B down), the
  single-buffer family is closed.
* Rules unchanged: new search bank v5, ≤96/procedure, fresh eval banks, v2
  gates, copy control, ≥2 successive + productivity. Prior failures stand;
  v4 grid closed (2 claimants, both FAIL fresh).
