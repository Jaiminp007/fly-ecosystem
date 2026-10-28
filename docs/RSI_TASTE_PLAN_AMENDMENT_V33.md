# RSI plan amendment v33: evict × skip interaction (evict line opens)

## Why (redundant or complementary?)

V32: keep-hard +2.16, keep-easy +1.78, both dual-true beating a 4.303
A-false bar. Skip (draw-filter) × keep-hard (store-filter) both
concentrate rehearsal on hard records by different routes: skip wastes
buffer slots on never-rehearsed easy records; keep-hard frees them.
Redundant → the pair ≈ max(single). Complementary → super-additive
(draw-concentration × store-reallocation). Either answer is a finding;
super-additive opens the evict line with A-direction in play.

## Menu (Gen1 R=4 flags (32,8) S=1 orthogonal greedy tr=1.0 R=4)

* Baseline: Gen1 R=4 (b=0, τ=0) — the bar never moves.
* A (greedy, skip-plateau range × keep-hard): {(b=1,τ=0.15),
  (b=1,τ=0.3)}.
* B (random, matched, with skip-alone ablation in pool):
  two of {(b=1,τ=0.05), (b=1,τ=0.5), (b=0,τ=0.3)}
  via mulberry32(20261127) → ['(1,0.5)','(1,0.05)'] (ablation stays out).

## Rules/stakes unchanged

New search bank v35, `--count 4`, 6 arms + baseline same bank,
≤96/procedure matched A/B. No eval without dual-true beating
baseline. Claimant → fresh 8-history bank (6 arms, v2 gates +
world-cap, copy control) as Gen19 (evict line 1/2 — V32 probe not a
generation).

* V33 A-won + fresh accept → evict line 1/2, productivity 1/2 → V34
  (A-directed around V33 winner) decides.
* V33 B-won/tie/no-claimant/REJECT → evict line stillborn/banked;
  program moves to negative synthesis (all predeclared classes
  exhausted: 21 old-code axes + margin + tournament + rate-split +
  skip + surprise-gain + replay-gain + 3 combinations + eviction).
* Bounded RSI iff any line reaches 2/2 successive with 2/2 A-directed
  productivity + budgets.
