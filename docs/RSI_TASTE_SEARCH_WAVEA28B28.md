# RSI v28 search: error-gated replay skip — B-WON, claimant b30-s03

## v30 bank (`b7a93287…`): selectivity works, B finds the robust cell

Baseline Gen1 R=4 τ=0: 7.370 dual-true.

| cell | τ | proc | score | vs bar | A | B |
|---|---|---|---|---|---|---|
| a30-s005 | 0.05 | A | 7.582 | +0.21 | False (1.38/1.67) | True |
| a30-s015 | 0.15 | A | 7.669 | +0.30 | True (1.471/1.467, +0.004) | True |
| b30-s03 | 0.3 | B | 7.669 | +0.30 | True (1.657/1.593, +0.064) | True |
| b30-s01 | 0.1 | B | 7.669 | +0.30 | True (twin of a30-s015) | True |

B menu draw mulberry32(20261122) → ['0.3','0.1'].

## Findings

* Selectivity BEATS uniform: three dual-true cells +0.30 over baseline.
  Spread-not-concentrate (skip-learned) succeeds where concentrate
  (tournament) failed — the budget binds on count, and uniform wastes
  draws on learned records while argmax overfits the hardest.
* Score plateau 7.669 across τ∈{0.1,0.15,0.3} with DIFFERING retention
  profiles (thin-A vs strong-A) — score-saturation again, profile
  visible underneath. τ=0.1≡τ=0.15 bit-identical (plateau twin).
* B-won round (B found two claimants incl. the robust one; A's sole
  claimant holds A by +0.004). Per Gen16 precedent: evaluate the best
  claimant regardless of procedure, track productivity separately.

## Claimant → Gen18

b30-s03 (τ=0.3, strongest A-leg) fresh-evaluated as skip-line 1/2. If
ACCEPT: line 1/2, productivity 0/1 (B-won) — two subsequent A-won gens
still required. 80 worlds. Cumulative 4384.
