# RSI P3-A dev check: FAILED all four gates (third RSI attempt on this program space)

Plan: [RSI_P3A_PLAN.md](RSI_P3A_PLAN.md), frozen in `32dbc91`. Evidence
(gitignored): `evidence/rsi-p3a-dev/dev.{json,log}`. Run time: 5.5 h, with
no errors. All numbers below were re-checked against `dev.json` rows.

This is the **third** RSI attempt on this program space. P2 failed, then the
user overrode its stopping rule, then the P3 headroom check passed H1 and
failed H2.

| Gate | Needed | Got | Result |
|---|---|---|---|
| 1. O − B | ≥ 1.5 | **1.27** | fail |
| 2. Libraries with A_L − B_L > 0 | ≥ 5 of 6 | **3 of 6** | fail |
| 3. Mean A_L − B_L | ≥ 1.0 | **0.19** | fail |
| 4. Libraries needed for power | ≤ 12 | **615** | fail |

The differences A_L − B_L were −0.05, +0.25, −1.52, −1.05, +0.95 and
+2.55.

## What changed from P2, and what it showed

**The eval fix worked as designed.** Every A library proposed its learned
top move first, on all 6 rules. P2's failure, where the learned ranking was
never expressed, is gone.

**The failure moved to training.** Only 1 of 6 libraries learned an
evidence-guided keep-only move as its top move:

| Library | Learned top move | evid moves accepted at test | A − B |
|---|---|---|---|
| A1 | `remove/highOrder/6` | 0/6 | −0.05 |
| A2 | `keepOnly/lowOrder/6` | 1/6 | +0.25 |
| A3 | `remove/antiEvid/2` | 0/6 | −1.52 |
| A4 | `remove/random/4` | 0/6 | −1.05 |
| A5 | `remove/antiEvid/6` | 0/6 | +0.95 |
| A6 | `keepOnly/evid/2` | 5/6 | **+2.55** |

The library that learned the right move got +2.55, which matches the
measured headroom. The libraries that learned noise lost to random order.

**Diagnosis: winner's curse in training.**

- Training makes about 128 proposals across about 94 moves, so most moves
  are tried once or twice.
- The prior adds only one pseudo-observation (N0 = 1), against single-
  proposal noise with an sd of about 3 energy.
- So the move with the highest posterior mean is mostly the luckiest
  single draw.
- P2's libraries happened to land on `keepOnly/evid`. P3-A's, on fresh
  banks, mostly did not. Neither outcome was a stable learned preference.

Headroom is still there:

- O − I is +2.6.
- O − B fell to 1.27, from P3's 1.78. These are different rules, and the
  gap was close to the 1.5 bar both times.

## Decision

Path A is closed, as the plan says. Fixing the training rule, for example
by pooling credit across move families or using stronger shrinkage, would
be a **fourth** attempt on the same space. It would be justified only by
these results, so it would need fresh banks and full disclosure.

The P3-B chain probe ([RSI_P3B_CHAIN_PROBE.md](RSI_P3B_CHAIN_PROBE.md))
found no second move after the first jump. Even a perfect learner here
learns one jump.
