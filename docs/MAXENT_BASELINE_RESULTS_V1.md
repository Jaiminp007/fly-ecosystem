# MAXENT-BASELINE V1 — RESULTS (read-only measurement, zero new worlds)

**Outcome: debt retired.** TURN-GATE V1's headline in bits, with its MaxEnt null:
candidate turn-gating carries **0.5753 bits** of cue-valence information per contact
(58% of the 0.996-bit ceiling at these base rates); the unlearned arm carries
**0.0000 bits** — the marginal-matched MaxEnt null describes it exactly
(pre-registered consistency check holds). No gates, no verdict, no claim beyond
the numbers. Cumulative program spend: unchanged (zero worlds).

## Data (frozen, untouched)

`evidence/turn-gated-dev/attempt-01/rows/*.json` (12 rows, TURN-GATE V1 Phase-A:
6 histories × {candidate, unlearned}). Read-only driver
`maxentBaselineOnFrozenRows`; deterministic recomputation verified bit-identical
(fixture 6 asserts deepEqual across two runs).

## Numbers (Laplace α=1 per cell, pre-registered)

| arm | contacts H/B | turns Th/Tb | pTurnHarm | pTurnBen | marginal | I (bits) |
|---|---|---|---|---|---|---|
| candidate | 61367 / 71052 | 53432 / 3535 | 0.8707 | 0.0498 | 0.4302 | **0.5753** |
| unlearned | 77812 / 76203 | 3877 / 3882 | 0.0498 | 0.0509 | 0.0504 | **0.0000** |

- MaxEnt null (marginal-matched, I≡0): candidate would turn at 0.4302 on BOTH
  valences; unlearned at 0.0504 on both. Coin-flip null (0.5) shown for scale in the
  instrument output.
- The R46 comparison, as specified: MaxEnt baseline (0 bits by construction, 0.43
  turn rate) vs greedy/learned (0.5753 bits, 0.87/0.05 split) on the same frozen rows.
  Learning's entire contribution over the least-biased null is 0.58 bits/contact of
  valence information — substantial (58% of ceiling) but bounded: 42% of available
  cue information goes unused (the contact-residue the CONCENTRATION doc attributed
  to hardest-cue floors, now quantified informationally).
- Unlearned ≈ MaxEnt EXACTLY (0.0000 bits at 4dp, flat 0.0498/0.0509): the null is
  not a strawman — it is the measured behavior of the control arm. This validates
  both the row schema reading and the null construction in one check.

## What this does and does not do

- DOES: put the program's oldest headline effect in Shannon units (R46 prescription);
  provide the null future information-use claims must beat (any "uses X" claim now
  has a bits scale and a 0.5753-bit reference point on this bank).
- DOES NOT: gate anything, license any claim, touch any bank, or imply anything
  about RSI. Any use of these bits in a gate needs its own frozen plan.
