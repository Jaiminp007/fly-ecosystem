# RSI V4 results: data-guided self-improving search — gate PASSED

> Later verdict (2026-11-14): this gate was narrow. The move menu was
> hand-written, the update rule was fixed, and the test stayed in one world
> family. RSI is not met; see [VISION.md](VISION.md) and
> [fable-review/FABLE_REVIEW.md](fable-review/FABLE_REVIEW.md).

Date: 2026-11-12. Plan written and committed before the run:
`docs/RSI_GUIDED_PLAN_V1.md` (commit 856ac1d). Runner `scripts/rsi-guided.mjs`
(committed before launch). Data (local): `evidence/rsi-guided/run-v4.{json,log}`.
91 minutes. Two fresh test banks, 216 test searches.

## What self-improved

Training: 4 odor-chemistry worlds, budget 20 each. The improver started (v0)
with all 10 operators weighted equally. From its own record it found that
guidedReduce (shrink the code to the term the flies' own taste experience
points to) produced the large confirmed wins (+0.22, +0.56, +0.63, +0.62), and
rewrote its own weights twice:

| version | guidedReduce weight | every other operator |
|---|---|---|
| v0 | 1 | 1 |
| v1 | 2.97 | 0.27-0.47 |
| v2 | 4.37 | 0.25-0.37 |

## Gate (b): better subsequent search — PASS (pre-registered rule)

Held-out rules (masks 4, 8, 6, 9, 10, 12, never seen in training), budget 6,
same starts, same histories, same search seeds for every version. Mean final
score:

| bank | start | no search | v0 | v1 | v2 | v2 vs v0 (paired) |
|---|---|---|---|---|---|---|
| 990000 | copied best | -0.010 | 0.210 | 0.173 | 0.624 | 26-0, p = 1.5e-8 |
| 990000 | identity | 0.451 | 0.503 | 0.537 | 0.624 | |
| 995000 (signs flipped) | copied best | 0.072 | 0.292 | 0.714 | 0.714 | 20-4, p = 7.7e-4 |
| 995000 | identity | 0.535 | 0.636 | 0.714 | 0.714 | |

Every pre-registered condition holds in both banks. The copied-improvement
control fails here (the copied sparse code scores about 0 on a new rule), and
the revised improver beats the fixed improver started from that same copy.
v2 recovered the hidden rule term in 72/72 searches. v0 reached a sparse code
containing it in 27/72.

## Successive improver revisions — MET

Pooled over both banks: v1 beats v0 29-10 (p = 0.0017), and v2 beats v1
22-0 with 50 ties (p = 2.4e-7). Each revision of the improver made the next
searches better. In bank 995000, v1 and v2 already tie at the ceiling.

## Gate (c): embodied benefit — MET (small but consistent)

Budget-adjusted energy per founder of the final program: v2 beats v0 in 49/50
untied pairs (+0.34 mean, p = 4.5e-14), and beats the starting program in 72/72
(+0.57). Survival does not separate the arms, because all flies survive these
short worlds.

## Gates (a) and (d)

Met earlier and again here: successive confirmed level-0 revisions, including
representational ones (the feature code itself is rebuilt).

## Scope (what this does not claim)

- Bounded RSI. I wrote the operator menu, including the data-guided operators,
  and the form of the self-revision rule. What the system revised on its own
  is its search policy over that menu: which moves to try, and how often.
  It did not invent new operators.
- The worlds are a constructed family (odor value follows a hidden product
  rule; short phases). The scarce long-curriculum world, where about 3/24 flies
  survive, is not where this was shown.
- The embodied gain is consistent but small in magnitude.
- No claim of human-like cognition or open-ended self-modification.
