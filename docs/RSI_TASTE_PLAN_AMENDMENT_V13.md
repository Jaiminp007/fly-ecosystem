# RSI plan amendment v13: R=4 × retention-first memory

## Why

Every amendment after V8 searched at R=1 (V3 memory, V4 strata, V5
consolidation were all Gen0/R=1 based; only surprise/windows/slots built
on R=4). But R=4 is the SOLE fresh-passing base, and its gain mechanism
(mixture-rate pulling weights toward the historical A/B/C mixture) should
interact with mixture COMPOSITION (what the buffer keeps). The two
retention-first legs — (64,8) holding B descriptively, (32,16) holding A —
each failed fresh alone at R=1 for the opposite leg. At R=4 the mixture
pull is 4× stronger per trigger, which may hold the weak leg while the
larger/older buffer protects the strong one. Untested crossed space with
a direct mechanistic rationale; no new code (capacity/recent already
parameterized, R already parameterized).

## Menu (on R=4 Gen1 flags, all else fixed)

* A (greedy): (capacity,recent) ∈ {(64,8),(32,16)} — the two descriptive
  retention legs.
* B (random, matched): two of {(64,16),(48,8),(32,4)} drawn by
  mulberry32(20261107) — one wider, one in-between, one narrower-younger.

## Rules unchanged

New search bank v14 (bank() scan excludes all prior), `--count 4`,
6 arms `candidate,unlearned,reset,acceptCruise` + Gen1 R=4 baseline cell on
the same bank, ≤96 worlds/procedure, matched A/B. No eval without a cell
beating the same-bank R=4 baseline. Any claimant fresh-evaluated on a new
8-history bank (6 arms, v2 gates + world-cap, copy control). ≥2 successive
accepts + productivity (A faster than B both generations) for any RSI
claim. All prior failures stand, including gen8.

Note for the runner: slots/surprise/streams/consolidation all OFF (S=1,
g=0, K=1, γ=μ=0). Only `capacity`/`recent`/`replayPasses=4` vary.
