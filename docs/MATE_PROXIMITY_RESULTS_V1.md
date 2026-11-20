# MATE-PROXIMITY V1 — RESULTS (single authorized attempt)

**Verdict: MATE-PROXIMITY-GO-V1** — dose-monotone: narrow gen-2 5 ≤ normal 9 ≤ wide 17,
wide ≥ 2 and > narrow. Proximity breadth orders compounding. First clean dose-response
in the mating program — the structural finding pointed at the right level.
Line CLOSES (no V2 without new rationale). Cumulative program spend: 7797 (+18).

## Attempt (ONE, authorized, 2026-11-01)

- Bank: `evidence/mate-proximity-dev/fresh-01/` (432001–432054, 6 histories × 9 seeds), built post-freeze, force-added.
- Runner: `runMateProximityDev` — 3 arms (hub mating-range 13u/26u/52u, sensing HELD 1×)
  × 6 histories = **18 mains**, ZERO probes, BT_TICKS=1792.
- Ledger (`attempt-01/ledger.json`): 18 mains / 0 probes / 32256 worldTicks / 3.60e9 ops. No crash, no resume, `redone: []`.
- Integrity: G1 true (18/18, 6/arm, finite endpoints). G2 true (hub/topology, sense 1×,
  range per-arm map, centers==1 all rows). Residuals < 1e-7.

## Per-arm outcomes

| arm | range | births | gen-1 | gen-2 | gen-2/seed |
|---|---|---|---|---|---|
| hub/narrow | 13u | 32 | 27 | 5 | [1,0,0,2,0,2] |
| hub/normal | 26u | 46 | 37 | 9 | [2,0,2,2,1,2] |
| hub/wide | 52u | 57 | 40 | 17 | [3,0,4,4,1,5] |

- Dose shape: MONOTONE on births (32<46<57) AND gen-2 (5<9<17) — both panels order.
  Wide wins or ties on 5/6 histories (seed 432010 childless everywhere — bank floor).
- Scaling (descriptive): births 1 : 1.44 : 1.78 for radii 1:2:4 — SUBLINEAR, not
  Smoluchowski-linear. Consistent with 2D moving-agent encounter kernels (rate ∝
  radius × speed with saturation) rather than naive area scaling (which would predict
  1:4:16). The R66 diffusion-limited-reaction literature anticipated exactly this
  comparison — recorded, not gated.
- Gen-2 per birth: 0.16 / 0.20 / 0.30 — rate rises with breadth too (not just rolls).

## Interpretation (honestly held)

- The structural finding (ATTRACT-V1b) located causality at the proximity gate; the
  dose confirms it moves compounding monotonically. Together: decoupled mating IS
  proximity-gated AND the gate breadth orders lineage outcomes. This is the first
  mating-line result where mechanism sketch (funnel → proximity → births → gen-2 rolls
  at rising rate) survives contact with a fresh bank on every link.
- Emlen-Oring status: the encounter side is now established at the RIGHT level
  (proximity, not sensing). The food side remains confounded (all arms share hub food).
  The clean Emlen-Oring split is now: hub-wide-range vs spread-wide-range — same
  proximity breadth, different food geography. That design is specified, not executed
  (needs fresh rationale + frozen plan + fresh bank).
-Hub advantage: V1-direction holds again on this bank for the normal arm context
  (hub1 gen-2 9 would beat every spread arm measured to date: 3,2,4,4,6,2).

## What did NOT happen

- No second attempt, no rescoring, no pooled gating, no tuning (monotonicity held on
  the frozen bar with ties allowed but none needed — strict ordering throughout).
- No RSI/population claim. No transfer claim.
