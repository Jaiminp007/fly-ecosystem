# RSI plan amendment v31: skip × rate-split (combination-3, no new code)

## Why (the two winners together)

Gen18 (τ=0.3 skip) and Gen16/17 (ρ≈1.25–1.5 rate-split) are the only
new-code dials that ever won fresh accepts — and both beat same-bank
R=4-alone on level (+0.07, +0.02), breaking attenuation. Their
combination is the last untested accepted×accepted pair (μ×tr failed,
tr×ρ failed). Mechanisms are complementary, not redundant: skip
reallocates the rehearsal BUDGET (which records), rate-split rescales
the STRIDE (how far each pull moves). If level gains add while
retention holds, combination-3 opens; if the third compositional
negative appears, combinations as a class are dead (0/3) and V32 goes
to eviction-policy new code.

## Menu (Gen1 R=4 flags (32,8) S=1 orthogonal greedy tr=1.0 R=4)

* Baseline: Gen1 R=4 (τ=0, ρ=1.0) — the bar never moves.
* A (greedy, joint winners + stronger rehearsal): {(τ=0.3, ρ=1.5),
  (τ=0.3, ρ=2.0)}.
* B (random, matched, bracketing pool): two of {(τ=0.15, ρ=1.5),
  (τ=0.5, ρ=1.25), (τ=0.2, ρ=2.0)} via mulberry32(20261125) →
  ['(0.5,1.25)','(0.15,1.5)'].

## Rules/stakes unchanged

New search bank v33, `--count 4`, 6 arms + baseline same bank,
≤96/procedure matched A/B (`--replay-skip` + `--replay-rate` flags).
No eval without dual-true beating baseline. Claimant → fresh 8-history
bank (6 arms, v2 gates + world-cap, copy control) as combination-3
line 1/2 (all prior lines banked/closed, never cross-credited).

* V31 A-won + fresh accept → combination-3 1/2, productivity 1/2 → V32
  (A-directed around V31 winner) decides.
* V31 B-won/tie/no-claimant/REJECT → combinations 0/3 CLOSED as a
  class; V32 = eviction-policy new code (store-time dual of skip).
* Bounded RSI iff any line reaches 2/2 successive with 2/2 A-directed
  productivity + budgets.
