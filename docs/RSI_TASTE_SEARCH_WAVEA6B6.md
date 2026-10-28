# RSI search wave A6/B6 (consolidation, v6 bank) — family closed, no claimant

Bank `search-20261031-v6` (fresh). Gen0 γ=0 line 4.718 (dual-true).

## A6 greedy (48 worlds)

* γ=0.01 → 3.838 (A-true/B-false)
* γ=0.05 → 4.256 (dual-true, but −0.46 lifetime vs Gen0)
* γ=0.2 → 3.608 (A-true/B-false)

## B6 random (seed 20261031, 96 worlds)

γ=0.08 → 3.031; 0.02 → 3.793; 0.1 → 3.609; 0.005 → 3.532; 0.5 → 1.910;
0.3 → 4.701 (best, still below Gen0 4.718). No productivity edge; no claimant.

## Verdict

Nine γ cells explored: none beats Gen0; the only dual-true (0.05) surrenders
lifetime — the same joint-gate signature that closed the pairwise line in
gen2. Consolidation damps learning faster than it protects skills. No fresh
eval spent (no-claimant rule). Elastic-consolidation family closed.

## Methods note (preserved)

First γ runs crashed with `slowTaste` undefined: `resetTasteEnergyBody`
rebuilt weights without the conditional slow vector (the reset arm inherits
learner options, so it hit the bug right after B/C zeroing). Fixed in
`taste-energy.mjs:223` + regression test
(`consolidation keeps slow weights through reset and restore`; 15 pass).
Post-fix γ=0.2 reproduces its pre-fix score exactly (3.608), and the wave was
re-run uniformly post-fix. Failed partial attempts were deleted, not banked.

Evidence: `evidence/rsi-taste-v1/search-20261031-v6/{gen0-search4,a6-*,b6-*}/`.
Cumulative RSI: prior 1216 + 16 + 48 + 96 = **1376 worlds**. Successive
accepts 0/2. Revisions remain SUSPENDED; Gen0-memory unrevised.
