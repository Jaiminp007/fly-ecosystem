# KERNEL-CRITIC RESULTS V1A: INFEASIBLE-BASELINE (substrate-metric mismatch; zero fresh worlds)

Date: 2026-11-02. Plan: `docs/KERNEL_CRITIC_PLAN_V1A.md` FROZEN (+5 pre-code
CORRECTIONS). Implement: `learning/tick-kernel-critic.mjs` (capacity-64 +
carry helper) + `learning/tick-cue-experiment.mjs` wire (7 minimal dispatches,
existing suite 7/7 green) + `scripts/kernel-critic-dev.mjs` (bank/collector/
scorer/runner) + 16/16 fixtures green (6 module + 10 instrument). No fresh
bank built. No attempt run. Worlds spent: ONE spent-bank measurement main
(development context, non-qualifying — feasibility precedent).

## Verdict: INFEASIBLE-BASELINE (G0 unreachable; would-be INCOMPLETE)

Feasibility measurement (single baseline main, arm='candidate', spent-bank
seeds 418001–418008, 1792 ticks, N=24, TickCueExperiment):
- Turn-gap: **0.0008** (join 1.00, 36,864 decisions, 5/24 survivors).
- G0 requires baseline mean ≥ 0.5. Actual ≈ 0. Three orders of magnitude short.

## Mechanism (over-determined, not n=1)

- M-RELEARN V1a: trained ≡ zeroed LIVE (behavior decoupled from weights).
- M-DISCRIMINATE: +1.3 value discrimination exists ONLY in frozen probes.
- CUE-DISCRIMINATE: NOGO (candidate exceeded CPU cap; no live discrimination).
- This probe: live tick-cue turn-gap ≈ 0 with full joins.
Conclusion: tick bodies do not express cue-conditioned turning LIVE.
A kernel-critic cannot demonstrate "better physical choices" on a metric
the substrate scores ~0 on for structural reasons (live behavior decoupled
from learnable weights). Turn-gating lives in taste-energy agents (V1 0.81+),
not tick bodies. Substrate-metric mismatch — the line tested the right
question in the wrong substrate.

## What this does NOT close

- The kernel-critic module stands (built, tested, preserved).
- A survival/energy-gated variant is specified-not-licensed (weak: without
  a behavioral mechanism it is a fishing expedition; needs its own
  rationale + frozen plan if ever pursued).
- The 451001–451054 range REMAINS CLEAN (never built — V1 died at fixtures,
  V1A died at feasibility). Available for any future line.
- The RSI paragraph is unchanged (embodied benefit still untested; now
  known-hard in TWO ways: budget (V1) + substrate (V1A)).

Line CLOSED (V1A invalid as specified). Cumulative program spend:
unchanged (8070 + 0 fresh; +1 spent-bank measurement main, non-qualifying).
No RSI claim.
