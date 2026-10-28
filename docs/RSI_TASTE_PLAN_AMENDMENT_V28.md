# RSI plan amendment v28: error-gated replay skip (NEW CODE, fourth class)

## Why (selectivity, not priority)

V23 tournament reweighted rehearsal toward hard records and failed
(concentration on the hardest overfits). Skip is the DUAL: drop
already-learned records (|err| < τ under current weights) so the fixed
R=4 budget spreads uniformly over UNLEARNED ones. Same information
(|error|), opposite allocation (spread vs concentrate). If rehearsal
budget binds on count, selectivity should beat both uniform (wastes
draws on learned records) and tournament (over-concentrates).

## Mechanism (`replaySkip` τ ≥ 0, default 0 = exact prior behavior)

In `replayGated`: after the (tournament-routed) draw, score
|target − prediction|² via billed `math(state)`; if < τ² skip the update
(`state.work.replaySkips++`, unbilled diagnostic), draw still charged.
τ=0: `err² < 0` never true → bit-identical path (unit-pinned:
weights+ops equal). Validation finite && ≥ 0. Persists/backfills/
restores; `keys()` audit. Runner `--replay-skip`. 30/30 tests green.

Engagement (real trajectory, v29-hist0): τ=0 skips 0/660; τ=0.1 skips
603/660 (91%, 57 updates left); τ=0.3 skips 651/660 (99%, 9 left);
weights diverge (−0.64/0.27 vs 0.86). Live dial, calibrated spread.

## Menu (Gen1 R=4 flags (32,8) S=1 orthogonal greedy tr=1.0 R=4)

* Baseline: Gen1 R=4 (τ=0) — the bar never moves.
* A (greedy, calibrated): τ ∈ {0.05, 0.15} — brackets the 91%-skip
  point from both sides (~200 vs ~30 updates expected).
* B (random, matched): two of {0.02, 0.1, 0.3} via mulberry32(20261122)
  → ['0.3','0.1'].

## Rules/stakes unchanged

New search bank v30, `--count 4`, 6 arms + baseline same bank,
≤96/procedure matched A/B. No eval without dual-true beating baseline.
Claimant → fresh 8-history bank (6 arms, v2 gates + world-cap, copy
control) as new line 1/2 (skip line; rate-split 2/2 stands banked;
combination-2 closed). Bounded RSI iff any line reaches 2/2 successive
with 2/2 A-directed productivity + budgets.
