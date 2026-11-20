# BRAKE-LIFT Results V2 — NOGO (brake bites, release recovers only partially, never beats uniform)

Date: 2026-10-27 (UTC). Plan: `docs/BRAKE_LIFT_PLAN_V2.md` (no amendments).
Bank: `evidence/brake-lift-dev/fresh-02/` (6 histories, 424001–424054).
Evidence: `evidence/brake-lift-dev/attempt-02/`. Single attempt, 18/18
mains, `redone: []`, ledger exact (18/0/32256/774144/2.89e9).

## Verdict: BRAKE-NOGO (manipulation passes, lift fails; no license)

- **G1 integrity ✓** — 18/18 complete, join ≥ 0.99, ledger exact.
- **G0 train-learned ✓** — train gaps 0.82/0.81/0.82 (V1 reference
  again).
- **G2b unlearned flat ✓**; null-hygiene clean (all null arms zero,
  all brake arms fired).
- **G-manipulation PASSES** — nolift HB 0.179 vs uniform 0.334:
  gap −0.155 (bar: nolift < uniform by ≥0.05). The brake BITES this
  time (replay-gated, as designed) — the V1 failure mode
  (live-only, no bite) is fixed at the mechanism level.
- **G-lift FAILS** — fast HB 0.230 vs uniform 0.334: −0.104
  (needs +0.1; repWins 0/3). Per-pair uniform/fast:
  [0.40/0.32, 0.36/0.15, 0.24/0.22] — no pair clears the bar.

Monotonic dose-response holds (uniform 0.334 > fast 0.230 > slow
0.206 > nolift 0.179): the knob works in the predicted direction —
more braking hurts more, faster release recovers more — but fast
never reaches baseline, let alone beats it. The explicit brake+release
machinery cannot beat what the system already does implicitly.

## Reading: uniform already lifts faster (descriptive, no new claim)

Uniform (no explicit brake) outperforms even the fastest explicit
release. The parsimonious reading, consistent with everything on
record: the implicit LI dynamics (whatever implements them — replay
mix, error-driven rates) already release the brake faster than our
explicit schedule; adding an explicit brake only adds drag that the
release can't fully undo within one segment. The LI signature itself
replicates on the fresh bank (uniform partial −0.271 — third bank
showing it), so the phenomenon stands; this intervention doesn't move
it. Brake-arm LI gradients (nolift −0.21, slow −0.41, fast −0.43)
differ from uniform's but are uninterpretable as mechanism (brake
presence confounds contact with treatment; descriptive only, as
pre-registered).

## Line status: CLOSED (no V3 without a new rationale)

Per the frozen plan, NOGO closes the line. The two-track program
narrows to its surviving arm: associability-side help that does NOT
work by slowing-then-releasing (tried twice: V1 never bit, V2 bites
but can't beat baseline). Open specified directions that this verdict
does not touch: per-cue associability RESET on contingency change
(Mackintosh proper — a step change, not a decay), brake-lifting via
disinhibition rather than rate (Bavelier), and the HB value-lead
puzzle (behavior ahead of values). None are licensed; each needs its
own frozen plan. Cumulative 7665 + 18 = 7683 (+18 ledgered;
per-line authoritative). No RSI claim.
