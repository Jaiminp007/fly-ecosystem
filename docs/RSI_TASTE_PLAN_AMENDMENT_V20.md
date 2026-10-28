# RSI plan amendment v20: second-successive combination (μ=0.5 x tr=0.3)

## Why (the corrected scoreboard changes the game)

The correction (`docs/RSI_FRESH_EVAL_CORRECTION.md`) leaves three
fresh-passing dials: (40,10) Gen10, μ=0.5 Gen12, tr=0.3 Gen13 — all
first-accepts in their lines, all lifetime-attenuated vs base but
retention-whole. The RSI counter needs a SECOND consecutive accept in ONE
line: a revision OF an accepted config that passes fresh. The natural
candidate combines the two most recent accepted dials — motor smoothing
(μ=0.5, Gen12 main-line) with step-size reduction (tr=0.3, Gen13
retention-line) — both attenuate lifetime mildly through different
channels (action-selection smoothing vs update sizing); stacked, they may
hold both legs at lower level. No new code (both dials validated).

## Menu (Gen1 R=4 flags, (32,8), S=1, all else fixed; every cell carries
BOTH dials, one coordinate varies)

* A (greedy, theory-driven): {(μ=0.5, tr=0.3) combination,
  (μ=0.5, tr=0.2) rate-neighbor}.
* B (random, matched): two of {(0.3, 0.3), (0.7, 0.3), (0.5, 0.1)}
  via mulberry32(20261114).

## Rules unchanged + productivity window (predeclared)

New search bank v21 (bank() scan excludes all prior), `--count 4`,
6 arms + Gen1 R=4 (μ=0, tr=1.0) baseline cell on the same bank, ≤96
worlds/procedure, matched A/B. No eval without a dual-true cell beating
the same-bank baseline. Any claimant fresh-evaluated on a new 8-history
bank (6 arms, v2 gates + world-cap, copy control).
This round OPENS a new two-generation productivity window (combination
line): the Gen12 round was B-won, so retroactive productivity on the old
pair is impossible — stated plainly, not reinterpreted. A bounded-RSI
claim additionally requires: (i) V20 claimant is an A-directed cell
(A-wins-V20) AND accepts fresh (1/2), then (ii) a V21 revision of the V20
winner, again A-won, accepts fresh (2/2), with total-budget accounting
throughout. All prior results stand as corrected.
Prediction on record: combination attenuates lifetime further (expect
below-baseline scores, possibly no claimant — the attenuation trend says
stacking costs level); the prize is a dual-true cell at any level above
baseline, which has never stacked before.
