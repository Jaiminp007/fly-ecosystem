# RSI plan amendment v18: taste step-size x R=4 (virgin rate dial)

## Why (outside the closed family)

V2–V17 exhausted every COMPOSITION/CHANNEL dial at R=4 (memory ratio,
memory scale, strata, surprise, windows, slots, streams, consolidation
x2, rate-passes) — all silence or fail fresh through the greedy-threshold
nonlinearity. Untested at R=4: the PER-STEP SIZE. `tasteRate` ∈ (0,1]
scales every live and replay taste update without touching WHAT is
sampled (same (32,8) buffer, same uniform mixture, same 4 passes):
smaller steps = finer-grained pull toward the same mixture fixed point,
less overshoot/oscillation around the 0.5 action threshold. It is the
complement of V14 (number of passes): V14 scaled pull COUNT at fixed step;
V18 scales pull SIZE at fixed count. Same class as the lone transfer
success (rate, not composition) — the highest-prior virgin direction.
No new code (`tasteRate` already (0,1]-validated; Gen1 base runs 1.0).

## Menu (Gen1 R=4 flags, (32,8), S=1, all else fixed)

* A (greedy): tasteRate in {0.1, 0.5}.
* B (random, matched): two of {0.2, 0.3, 0.7} drawn by mulberry32(20261112).

## Rules unchanged

New search bank v19 (bank() scan excludes all prior), `--count 4`,
6 arms `candidate,unlearned,reset,acceptCruise` + Gen1 R=4 tasteRate-1.0
baseline cell on the same bank, ≤96 worlds/procedure, matched A/B. No
eval without a dual-true cell beating the same-bank baseline. Any
claimant fresh-evaluated on a new 8-history bank (6 arms, v2 gates +
world-cap, copy control). ≥2 successive accepts + productivity for any
RSI claim. All prior failures stand, including gen12 and the family-closure
stakes (this round re-opens the program ONLY on a fresh pass; a fail
returns to the negative synthesis, next new-code class: threshold-aware
margin dial, V19).
Prediction on record: step-size scales smoothly (no exact-zero expected —
mixture identical, only gain changes); small steps hold the joint gate at
some level cost; a claimant needs level + gate together.
