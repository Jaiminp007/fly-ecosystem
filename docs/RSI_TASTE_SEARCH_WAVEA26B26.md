# RSI v26 search: rate-split WIDE menu — NO CLAIMANT, line banked

## v28 bank (`6ba8098e…`): strong bank, dial exhausted

Baseline Gen1 R=4 ρ=1: 7.702 dual-true.

| cell | ρ | proc | score | vs bar | A | B |
|---|---|---|---|---|---|---|
| a28-r075 | 0.75 | A | 7.701 | −0.001 | True | True |
| a28-r25 | 2.5 | A | 7.544 | −0.16 | True | True |
| b28-r10 | 1.0 | B | 7.702 | 0.000 | True | True |
| b28-r05 | 0.5 | B | 6.504 | −1.20 | True | True |

B menu draw mulberry32(20261120) → ['1.0','0.5'].

## Findings

* b28-r10 reproduces baseline EXACTLY (7.702) — same procedure + bank +
  flags deterministic across invocations (third bit-exact reproduction
  in the program: V16, V23, V26).
* Plateau extends inward: ρ=0.75 ≈ ρ=1.0 (−0.001). Behavioral plateaus
  now mapped at [0.75,1.0] and [1.25,1.75]; 2.0–2.5 mildly degrading;
  0.25–0.5 bank-dependent (A-kill on v26, A-holds on v28).
* The dial is MAPPED: optimum ρ≈1.0–1.75 bank-dependent, max gain
  +0.27, no setting dominant. Diminishing returns — further ρ
  refinement cannot supply A-direction.

## Verdict: NO CLAIMANT, rate-split line BANKED

No cell beats baseline → 0 eval spent. Round is a tied failure (A best
7.701, B best 7.702=bar). Productivity still 0/2 (V24 B-won, V25 tie,
V26 tie-fail). Per predeclared V26 stakes: the line can never supply
A-direction → BANKED at successive 2/2 (Gen16+Gen17 — program-first
successive pair, stands unclaimed). Program moves to next new-code
idea class. 80 worlds. Cumulative 4224.
