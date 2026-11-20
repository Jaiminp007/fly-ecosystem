# RSI P3-A plan: learned search prior, with both P2 flaws fixed (frozen before the run)

Date: 2026-11-15. History:

- P2 failed all four gates ([RSI_P2_DEV_RESULTS.md](RSI_P2_DEV_RESULTS.md)).
- The user overrode P2's stopping rule.
- The P3 headroom check passed H1 (+1.78) and failed H2 (1.08 accepted moves
  per search): [RSI_P3_HEADROOM_RESULTS.md](RSI_P3_HEADROOM_RESULTS.md).
- The user chose path A, a fast narrow test, knowing it contradicts the P3
  plan's rule that a failed H2 means no learner. This is the **third RSI
  attempt** on this program space. Any writeup must say so.

## Claim being tested (narrow)

The search learns from its own history which move to try first, and on
unseen problems that learned prior beats an uninformed search.

This is a learned, near-constant prior. It is not a chain of
self-improvements, and it is not level 2.

## Changes from P2 (only these)

Runner: `scripts/rsi-p3a-dev.mjs`, a diff against `scripts/rsi-p2-dev.mjs`.

1. **Eval order (fix for P2 flaw 2).** Frozen libraries order moves by
   posterior mean sum/(n+1), descending, with ties broken by a uniform
   shuffle. There is no Thompson noise at eval. Training is unchanged:
   Thompson with online updates.
2. **Oracle (fix for P2 flaw 1).** O is the fixed greedy order
   `keepOnly/evid/` 3, 4, 2, 6, 8, 1, then the hyper moves. P3 headroom
   showed this order beats uniform order by +1.78.
3. **Fresh banks.** Training banks use seeds 998000 + 97L for rule draws
   and 998000 + 10L + i for bank seeds. Dev rules (seeds 998901–998906) are
   s8+, s13−, s14+, s6−, OR(2,3)+ and AND(0,3)−.
4. The output records every proposed move, not only accepted ones.

Everything else is P2 as frozen in `fc7cb87`: 6 libraries, budgets 16 and
8, B_L paired per library, the energy objective and threshold decisions.

## Dev gate (P2's gate, unchanged)

1. O − B ≥ 1.5.
2. A_L − B_L > 0 for at least 5 of the 6 libraries.
3. Mean A_L − B_L ≥ 1.0.
4. ⌈10.03·(sd/mean)² + 2.7⌉ ≤ 12.

If the gate passes, the test (12 new libraries, 12 unseen rules, sign-flip
test at p < 0.01, mean A − B ≥ 1.0) is frozen separately before it runs.
If it fails, the narrow path A is closed, and only path B, a richer program
space, remains.

The smoke run used real seeds (training bank 998010, dev rule 998901).
This is disclosed here.
