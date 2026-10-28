# RSI search wave A7/B7 (motor consolidation stacked on γ=0.05, v7 bank)

Bank `search-20261101-v7` (fresh). Gen0 γ=0/μ=0: 6.369 (seq 5.358, vsR +1.011,
dual-true) — strongest Gen0 line yet.

## Methods error found and fixed (preserved)

The first two "stack" runs (`a7-stack001/005`, kept as γ=0.05-on-v7 references,
3.992) ran with μ **silently inert**: the consolidation block was placed only
in `motorUpdate`, but the qualified family uses `motorRule='progress'`, which
routes through `progressUpdate` — `motorUpdate` never fires. A unit probe
showed `motorUpdates: 0` and bit-identical weights/ops across μ values, which
traced to the routing branch, not the plumbing. Fix: shared
`consolidateMotor(state,m,withCritic)` helper called from all three motor
paths (`motorUpdate` with critic, `renewalUpdate`/`progressUpdate`
actor-only), each guarded by μ>0 so the default path stays bit-exact
(20 tests pass). Lesson: mechanism placement must match the family's live
code path — verified by probe, not assumed.

## A7 proper stacks, γ=0.05 × μ (48 worlds)

* μ=0.01 → 2.678 (dual-true, vsR −0.59)
* μ=0.05 → 2.228 (dual-true, vsR −0.90)
* μ=0.20 → 3.194 (dual-true, vsR −0.07)

## B7 random (seed 20261101, matched 96 worlds)

μ=0.005 → 3.038; 0.08 → 3.640; 0.3 → 2.235; 0.02 → 2.339; 0.1 → 3.331;
0.5 → 3.789 (best, still −2.58 below Gen0). No productivity edge; no claimant.

## Verdict

All nine stack cells are descriptively dual-true yet surrender large lifetime
(−2.6 to −4.1 vs Gen0) — the sixth mechanism with the same joint-gate
signature: smoothing buys descriptive retention with behavior. Motor
consolidation closes with the rest. No fresh eval spent (no-claimant rule).

Evidence: `evidence/rsi-taste-v1/search-20261101-v7/{gen0-search4,a7-stack001,a7-stack005,a7m-*,b7-*}/`.
Cumulative RSI: prior 1376 + 16 + 48 + 48 + 96 = **1584 worlds**. Successive
accepts 0/2. Revisions remain SUSPENDED; Gen0-memory unrevised.
