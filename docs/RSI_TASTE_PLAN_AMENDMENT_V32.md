# RSI plan amendment v32: eviction-policy direction probe (NEW CODE, sixth class)

## Why (store-time dual of skip)

Every draw-time lever is now mapped: uniform (base), tournament
(concentrate-hard: dead), skip (drop-easy: WON Gen18), gain
(boost-surprising: stillborn). The untouched lever is STORE time:
which records DESERVE buffer slots. `evictBias` b ∈ {−1,0,+1},
default 0 = exact prior reservoir (bit-identical, unit-pinned).
When `older` is full and a record spills from `recent`:

* b=+1 (keep-hard): score all older + displaced by err² under current
  weights (billed `math`, slot-aware, deterministic scan, no new RNG);
  replace the easiest iff displaced is strictly harder. Buffer
  enriches in hard records — skip's effect via reallocation.
* b=−1 (keep-easy): mirror — replace the hardest iff displaced is
  strictly easier. Buffer enriches in mastered records (anti-forgetting
  bet: protect the A-leg the killer keeps taking).

Sizes preserved (capacity/recent split untouched — no memory-dial
confound). `work.evictSwaps` diagnostic. Runner `--evict-bias`.
32/32 tests green. Engagement on real trajectory (v33-hist0): 68 swaps
keep-hard / 3 swaps keep-easy, weights diverge both directions —
LIVE (asymmetric: fresh displacements are rarely the easiest).

## Design: direction PROBE (no productivity ledger entry)

Skip settled the draw-time direction (hard wins), but store-time
keep-easy is a distinct bet (presence ≠ rehearsal: skip keeps easy
records in buffer, keep-easy eviction is its mirror only at draw).
Directions are confounded with procedure in A/B, so V32 probes BOTH
directions + baseline on one fresh bank and the WINNING direction —
if any dual-true beats baseline — goes to a full V33 A/B refinement
(with productivity). If neither beats baseline, eviction closes.

## Menu (Gen1 R=4 flags (32,8) S=1 orthogonal greedy tr=1.0 R=4)

* Baseline: Gen1 R=4 (b=0).
* Probe cells: evict-keep-hard (b=+1), evict-keep-easy (b=−1).

New search bank v34, `--count 4`, 6 arms + baseline same bank =
48 worlds. No eval from V32 (probe by predeclared design). V33
refines the winning direction A/B (or program moves to negative
synthesis if neither direction beats baseline).
