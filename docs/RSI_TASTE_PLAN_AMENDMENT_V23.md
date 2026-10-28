# RSI plan amendment v23: prioritized replay (NEW CODE, second class)

## Why (the last untried leverage point)

Every dial so far changes how FAR each update moves (rates, gains,
margins, smoothing) or WHAT is stored (capacity, strata, slots,
streams). None changes WHICH memories get replayed: `replay()` draws
uniformly. The learner's own prediction errors mark which records still
hold information — replaying high-|error| records more often is the
textbook use of endogenous surprise, and it is entirely untested here.
If retention dies from under-rehearsed B/C records, priority replay
should resurrect exactly those legs.

## Code (new, defaults bit-exact)

* `replayTournament` T ∈ {1,2,3}, default 1 = exact current behavior
  (single uniform draw, bit-identical RNG). T>1: draw T candidate
  records (each draw RNG-charged as today), score each by
  |target − prediction| under CURRENT weights via billed `math(state)`
  (no learning, prediction only), replay the argmax (ties → first).
  Applies to both live and motor-update call sites (same loop both
  use), all draws billed. Guard T>1 exactly like the μ/γ guards so the
  default path stays bit-identical; regression test pins it.
* State: none (no new keys — tournament is stateless within a draw).
  Config-only, persists in body (legitimate revision), reset/restore
  trivially safe. Runner `--replay-tournament`; learnerOptions
  passthrough; `keys()`/clone audit.
* Tests: defaults off/validate; synthetic: T=2 replays the higher-error
  record of the pair (seeded draw check via work counters or a
  two-record buffer with known errors); T=1 path bit-identical to
  no-option body.

## Menu (Gen1 R=4 flags, (32,8), S=1, orthogonal, greedy, tr=1.0)

* Baseline: Gen1 R=4 (T=1).
* A (greedy): {T=2, T=3}.
* B (random, matched): two of {T=2, T=3} via mulberry32(20261117)
  (duplication across procedures reported, V16 precedent; pool is
  inherently size-2 — the dial has three settings and T=1 is the
  baseline).

## Rules unchanged

New search bank v25 (bank() scan excludes all prior), `--count 4`,
6 arms + baseline cell on the same bank, ≤96 worlds/procedure, matched
A/B. No eval without dual-true beating baseline. Claimant → fresh
8-history bank (6 arms, v2 gates + world-cap, copy control). Gen-1
window rules (V22 doc): A-won accept = 1/2, then V24 revision of winner
A-won accept = 2/2 + budgets → claim.
Prediction on record: T=2 should hold level near base with BETTER
B-retention (B/C records carry the largest errors at test time, so
priority rehearses exactly the returning leg); T=3 risks overfitting
the hardest records (narrow rehearsal → A-leg erosion). Either
direction is informative.
