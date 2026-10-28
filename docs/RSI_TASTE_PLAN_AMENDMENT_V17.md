# RSI plan amendment v17: R=4 x motor consolidation (last cross)

## Why

The taste/mixture dial x R=4 matrix is complete (memory✓ rate✓ strata✓ —
every cross silences or fails fresh). Motor consolidation μ is the only
parameterized dial never tested at R=4, and the only one whose R=1 failure
mode was NOT silencing but behavioral poisoning (smoothing toward backward
anchors: +62–85 harmful eaten, large negative lifetime deltas, all cells
alive). That makes it the single remaining cross with a live empirical
question rather than a foregone zero: does a strong R=4 taste mixture
rescue motor smoothing, or does motor poisoning dominate regardless of
taste? No new code (`motorConsolidationRate` already 0–1 validated,
all-three-paths placement fixed).

## Menu (Gen1 R=4 flags, (32,8), S=1, all else fixed)

* A (greedy): μ in {0.05,0.2} — the V6 stack values on the γ=0.05 base,
  here WITHOUT γ (pure motor test: `--consolidation-rate 0`).
* B (random, matched): two of {0.01,0.1,0.5} drawn by mulberry32(20261111).

## Rules unchanged

New search bank v18 (bank() scan excludes all prior), `--count 4`,
6 arms `candidate,unlearned,reset,acceptCruise` + Gen1 R=4 μ=0 baseline
cell on the same bank, ≤96 worlds/procedure, matched A/B. No eval without
a dual-true cell beating the same-bank baseline. Any claimant
fresh-evaluated on a new 8-history bank (6 arms, v2 gates + world-cap,
copy control). ≥2 successive accepts + productivity for any RSI claim.
All prior failures stand, including gen11.
Prediction on record: μ>0 at R=4 degrades behaviorally (harmful-eating
signature, negative vsR deltas, NO exact-zero — μ moves actions, it does
not silence them); no claimant expected. UNLESS a μ cell passes fresh
eval, this round CLOSES the revision family: every parameterized dial
will have been crossed with R=4 and failed, and the program writes the
negative synthesis (singular base + universal silencing/poisoning) rather
than opening new dials.
