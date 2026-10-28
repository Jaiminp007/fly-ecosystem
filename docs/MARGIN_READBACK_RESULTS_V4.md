# Margin-readback repair V4 — results (attempt-04, recomputation)

Frozen 2026-10-28. Plan: `docs/MARGIN_READBACK_PLAN_V4.md`.
Verdict: **GO — D1 probe-margin readback ACCEPTED**.
Zero worlds, zero seeds, zero engine runs. Single authorized application.

## What ran

`scripts/margin-readback-recompute.mjs` over the frozen attempt-03 ledger
(`synthetic.json`, `spent-bank.json`, `ledger.json`, `attempt.json`;
plan-ref verified as the V3 plan). Output:
`evidence/margin-readback/attempt-04/recomputation.json`. All clauses true,
conjunctive go:true. (One script path-idiom fix before the successful
application — Windows `C:\C:\` resolve bug, same class as the V2 pre-run
fixes; disclosed, behavior-neutral, no evidence touched.)

## Clause record

- caps: 18 exec / 4864 ticks / 86016 slots / 154641137 ops — all ≤ V3 caps.
- G1: synthetic `A:current` n=1024=events, bad=0, phiLength=96.
- G2pos: reset survivors=4, n=1024, bad=0, minMargin===maxMargin,
  |meanMargin−0.25|=2.8e-17 ≤ 1e-9.
- G3: dOps=100352=1024×(2+96); |Δvalue+billedCost| recomputed ≤ 1e-6
  (same BT_PRICING constant the run used).
- G4: row 604620731, 5 keys n>0 bad=0, digest before===after.
- G2neg (carried): attempt-03 verdict true; expression references only real
  collector fields; `seen`-without-margins semantics pinned by fixture test 5.
- G5 (carried): 515 tests, 6 pre-existing failures (RESULTS_V3 triage).

## What this unlocks (and does not do)

ACCEPTED means: decision-path `motor-margin` emission is proven on synthetic
(full emission, shaped+finite, billed exactly through `m`,
behavior-identical), zero-weight constancy is proven, the fixed-program
negative is proven, and spent-bank readback is proven without digest change.
Margin-gated follow-ups (e.g., actor-margin decision-relevance on a fresh dev
bank) may now be PROPOSED under their own frozen plans — no worlds for them
here. Nothing about H1m/H2/ELSEWHERE changes: this acceptance removes the D1
instrument blocker only. Attempts 01–03 stand with their computed verdicts
(NO-GO per frozen scripts); the acceptance rests on V4's recomputation,
explicitly superseding on the stated mechanical grounds, erasing nothing.
