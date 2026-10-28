# RSI plan amendment v22: threshold-aware margin dial (NEW CODE, first class)

## Why (everything old is exhausted; the boundary is the target)

V21 closed the last old-code axis. The corrected picture says revisions
attenuate lifetime while retention detail kills them — and all of it
runs through the greedy .5 threshold: only predictions near .5 change
behavior when weights move. The margin dial concentrates learning where
leverage is maximal: when the live prediction sits within m of the
eating boundary, scale that update's step by (1+k). Far-from-boundary
predictions (confident, behavior-fixed) learn at base rate; near-boundary
ones (behavior-flipping) learn faster. This is threshold-aware
plasticity, endogenous (own prediction only, no observer quantities),
and the first idea class that targets the mechanism instead of the
mixture.

## Code (new, defaults bit-exact)

* `marginWidth` m ≥ 0, default 0 = OFF (no new state, identical ops).
  `marginBoost` k ≥ 0, default 0 = OFF. Both validated, persisted in
  body config (legitimate revision), reset/restore-safe (config-only).
* In `tasteUpdate` live path only (replay stays base rate — replay
  replays history, live faces the boundary): compute pred BEFORE the
  weight step; if m>0 and |pred−.5|<m, step ×(1+k). Bill the comparison
  + arithmetic via `math(state)` every live step (billed even when
  m=0? NO — guard with m>0 exactly like the μ/γ guards so default path
  stays bit-identical; add regression test).
* Runner: `--margin-width`, `--margin-boost`; learnerOptions
  passthrough; `keys()`/clone audit like γ/μ.
* Tests: defaults off/validate; probe that near-boundary steps scale and
  far-boundary steps don't (synthetic body, fixed phi).

## Menu (Gen1 R=4 flags, (32,8), S=1, orthogonal, greedy; k frozen at 1.0
for the round, only m varies)

* Baseline: Gen1 R=4 (m=0).
* A (greedy): {m=0.1, m=0.2}.
* B (random, matched): two of {0.05, 0.15, 0.3} via mulberry32(20261116).

## Rules unchanged

New search bank v23 (bank() scan excludes all prior), `--count 4`,
6 arms + baseline cell on the same bank, ≤96 worlds/procedure, matched
A/B. No eval without a dual-true cell beating baseline. Claimant →
fresh 8-history bank (6 arms, v2 gates + world-cap, copy control). Opens
a new gen-1 window (combination window closed at Gen15): A-won accept =
1/2, then V23 (revision of winner, A-won) accept = 2/2 + budgets → claim.
Prediction on record: m>0 cells alive (mechanism cannot pin predictions);
m=0.1 should hold level near base with better A-retention (boundary
focus helps the A-leg most, since A is where the policy sits nearest
.5 after B/C interference); m=0.3 may thrash (too wide = global gain).
