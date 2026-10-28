# RSI search wave A11/B11: the window saturates — knob is binary

Gen1 base R=4/g=0/W=0 on v11 bank `448837e2…`: 8.093, A-true/B-false.
All four window cells (R=4, g=2) collapse to one regime:

- A: W=16 → 6.267 (seq 5.278 vsR 0.989, A 1.346 vs 1.608 False, B True);
      W=64 → 6.267 (seq differs 1.5e-5 — same regime, not bit-identical).
- B (random {128,8}): W=128 → 6.267; W=8 → 6.267, same rounded profile.

Diagnosis: the trigger stream is DENSE (6% of live steps; anchor: 192 boosts
/ 3018 live). Gaps between triggers are almost all < 8 live steps, so any
W ≥ 8 keeps the timer permanently loaded after the first fire — all four
cells are just "global ×3 taste rate", which overwrites harder (A-leg
breaks, −1.8 lifetime vs base). The knob as menued is binary: W=0 (6%
boosted) vs W≥8 (~100% boosted), with nothing graded in between.

Two findings survive for the next amendment: (1) the graded regime, if it
exists, is W ∈ {1..4} (12–25% coverage); (2) surprise at 6% density is a
background condition, not a rare boundary signal — gating by it gates by
noise, so small windows boost "the surprised + their neighbors", a diffuse
elevation whose value the bank must judge, not the theory.

No claimant (best 6.267 < base 8.093) → no eval spent. Family closed.

Evidence: `evidence/rsi-taste-v1/search-20261104-v11/`
(`gen1-search4`, `a11-w16`, `a11-w64`, `b11-w128`, `b11-w8`).
Round 80 worlds; cumulative **1952 worlds**. Successive still 1/2.
