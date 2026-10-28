# RSI plan amendment v16: R=4 x stratified replay (last dial)

## Why

Stratification is the last parameterized dial never tested at R=4 (V4 ran
S in {2,3,4} at R=1; S=4 was the gen5 claimant, failed fresh on B). S>1
upweights older records (uniform across recency strata), i.e. the
concentrate-old direction that silenced Gen9/Gen10 — so the standing
prediction is failure by over-anchor/B-starve. The round is justified
anyway: it completes the full dial x R=4 matrix (memory✓, rate✓,
strata?), and a hold (rather than silence) at some S would bound the
over-anchor mechanism quantitatively. No new code (`replayStrata`
already 1–8 validated).

## Menu (Gen1 R=4 flags, (32,8), all else fixed)

* A (greedy): S in {2,4}.
* B (random, matched): two of {2,3} drawn by mulberry32(20261110).

## Rules unchanged

New search bank v17 (bank() scan excludes all prior), `--count 4`,
6 arms `candidate,unlearned,reset,acceptCruise` + Gen1 R=4 S=1 baseline
cell on the same bank, ≤96 worlds/procedure, matched A/B. No eval without
a dual-true cell beating the same-bank baseline. Any claimant
fresh-evaluated on a new 8-history bank (6 arms, v2 gates + world-cap,
copy control). ≥2 successive accepts + productivity for any RSI claim.
All prior failures stand, including gen10.
Prediction on record: S>1 at R=4 degrades B descriptively (older-upweight
starves the recent leg) with possible exact-zero at S=4; no claimant
expected. If S=2 holds dual-true at level, the over-anchor boundary lies
between strata-weightings, and the program continues there.
