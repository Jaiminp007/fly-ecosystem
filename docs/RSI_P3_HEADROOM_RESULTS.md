# RSI P3 headroom check: H1 PASS, H2 FAIL, H3 PASS (weak)

Plan: [RSI_P3_HEADROOM_PLAN.md](RSI_P3_HEADROOM_PLAN.md), frozen in
`17516c2`. Evidence (gitignored): `evidence/rsi-p3-headroom/run.{json,log}`.
Run time: 1.55 h, with no errors. This is the second RSI attempt after the
P2 failure, made on the user's override.

| Check | Needed | Got | Result |
|---|---|---|---|
| H1 headroom, G − U | ≥ 1.5 | **+1.78** (G wins 10 of 12) | pass |
| H2 chain, moves G accepts | ≥ 2 | **1.08** | fail |
| H3 context, modal best-first share | ≤ 75% | **58%** | pass |

The headroom is real and large:

- G − I is +3.56. On single-term rules G − U is +2.13; on gates it is
  +0.72.
- P2 hid this. The new numbers support the P2 review's diagnosis: the
  headroom exists, and P2's eval rule did not use it.

There is no chain. The greedy search accepts `keepOnly/evid/3` (once
`/4`), and almost nothing after it. The program space is one jump from
identity to near-best.

The context effect is small. The best first k varies by rule: k2 on 7
rules, k3 on 3, k4 on 1, k6 on 1. But choosing the best k per rule instead
of always using k3 gains only 0.76 in mean dev gain. That number comes
from one 6-history measurement, and the max is taken over 4 values, so it
is biased upward.

## What this means

- A learner over **this** space can at best learn a near-constant prior:
  "keep the top 2 or 3 evidence terms". That would be a real level-1
  result (search learns from its own history and beats uninformed search).
  It is not a chain of self-improvements.
- Per the frozen plan, H2 failing means the next step is a larger budget
  or a richer program space, not a learner.
