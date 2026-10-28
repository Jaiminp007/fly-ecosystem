# RSI plan amendment v15: ratio-preserving memory scale-up at R=4

## Why

Gen9's silencing confounds two changes: (32,8)→(48,8) altered the
old:recent RATIO (3:1 → 5:1) AND the scale (32 → 48). The over-anchor
reading blames the ratio (older-heavy mixture). The clean test holds the
winning (32,8) ratio at 3:1 and scales only depth: (40,10), (48,12),
(56,14), (64,16). Same composition proportion, deeper history, honestly
billed storage. If scale-up at fixed ratio holds the joint gate, Gen9's
failure was ratio, and a larger same-ratio buffer may even gain. If it
silences, depth itself (older records entering the mixture) hurts, and the
(32,8) point is optimal in scale as well as rate. No new code.

## Menu (Gen1 R=4 flags, all else fixed)

* A (greedy): (capacity,recent) in {(48,12),(64,16)} — 3:1 ratio, larger.
* B (random, matched): two of {(40,10),(56,14)} drawn by
  mulberry32(20261109) — 3:1 ratio, intermediate/larger.

Five-point scale curve at fixed 3:1 composition: 32 (baseline), 40, 48,
56, 64.

## Rules unchanged

New search bank v16 (bank() scan excludes all prior), `--count 4`,
6 arms `candidate,unlearned,reset,acceptCruise` + Gen1 R=4 (32,8) baseline
cell on the same bank, ≤96 worlds/procedure, matched A/B. No eval without
a dual-true cell beating the same-bank baseline. Any claimant
fresh-evaluated on a new 8-history bank (6 arms, v2 gates + world-cap,
copy control). ≥2 successive accepts + productivity for any RSI claim.
All prior failures stand, including gen9.
Prediction on record: fixed-ratio scale-up holds the joint gate
descriptively (no exact-zero — proportion preserved); score peaks at or
below 48, with storage billing dragging the largest buffers.
