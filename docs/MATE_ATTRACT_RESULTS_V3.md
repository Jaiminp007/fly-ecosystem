# MATE-ATTRACT V3 — RESULTS (single authorized attempt)

**Verdict: MATE-ATTRACT-NOGO-V3** — no interaction: hubAttract gen-2 = 0 vs hub 4.
Forced taxis on clumped food does not lift compounding — it eliminates it (0 gen-2
in 6/6 histories vs 4 in 3/6 for the control). ATTRACT arc CLOSED: sensing bypassed,
steering inert on spread, actively harmful on hub. Cumulative program spend: 7875 (+18).

## Attempt (ONE, authorized, 2026-11-02)

- Bank: `evidence/mate-attract-dev/fresh-04/` (437001–437054, 6 histories × 9 seeds), built post-freeze, force-added.
- Runner: `runMateAttractV3` — 3 arms (hub/attract k=2 vs hub control k=0 + spread anchor)
  × 6 histories = **18 mains**, ZERO probes, BT_TICKS=1792.
- Ledger (`attempt-04/ledger.json`): 18 mains / 0 probes / 32256 worldTicks / 3.37e9 ops. No crash, no resume, `redone: []`.
- Integrity: G1 true (18/18, 6/arm, finite endpoints). G2 true (topo/bias/sense/geography per-arm maps). Residuals < 1e-7.

## Per-arm outcomes

| arm | births | gen-1 | gen-2 | gen-2/seed | energy |
|---|---|---|---|---|---|
| hub/attract k=2 | 19 | 19 | 0 | [0,0,0,0,0,0] | −42.2 |
| hub/k=0 | 28 | 24 | 4 | [0,0,0,2,1,1] | −38.8 |
| spread/k=0 | 27 | 26 | 1 | [1,0,0,0,0,0] | −25.2 |

- Interaction (the verdict): 0 vs 4 — taxis on hub does not merely fail to lift; the
  treatment arm is childless at gen-2 while the control compounds normally.
- Births tell the mechanism story: hub/attract births are UNIFORM-but-low (3,4,3,3,3,3 —
  zero variance across histories) vs hub control variable (2,2,5,8,5,6). Forced
  attraction homogenizes mating downwards: agents cluster, deplete local food faster
  (worst energy −42.2), and convert nothing to gen-2.
- firstMatingTick medians are NOT shifted (hubAttract ≈ hub: 248/225/275/278/271/207 vs
  248/249/344/241/248/207) — same timing, failed conversion. Not an encounter story at all.
- Spread anchor gen-2 = 1 (dead-bank check: bank supports SOME compounding — hub control
  proves it; no INCOMPLETE ambiguity).

## Interpretation (honestly held)

- The Emlen-Oring cell is now filled on the interaction term: encounters × clumped food
  = NEGATIVE (0 vs 4), not merely neutral. Combined with PROXIMITY-V1b (food irrelevant
  given breadth) and V2 (encounters irrelevant given spread), the complete reading is:
  encounters are neither sufficient nor amplifying — and forced encounters under food
  limitation are actively harmful (energy-mediated: taxis burns the margin that
  compounding needs).
- This reframes the mating arc's terminal finding: the binding constraint was never
  encounter RATE (sensing range, mating range, taxis all move it without effect) but
  the energy→survival conversion downstream. Births respond to food (hub 28-57 vs
  spread 24-33 across banks); NOTHING responds to encounter manipulations (0/0/2/4
  treatment gen-2 vs controls across V1/V1b/V2/V3).
- V1-direction on this bank: hub 4 > spread 1 (6/7 banks).

## What did NOT happen

- No second attempt, no rescoring, no pooled gating, no tuning (k=2 parity pre-registered, sign verified pre-freeze).
- No RSI/population claim. No transfer claim.

## Status

MATE-ATTRACT V3 CLOSED AS NOGO-V3. Mating arc: transmission inert + topology insufficient-alone + sensing bypassed + steering inert-or-harmful + proximity dose replicates + food-is-gate-not-gradient + informed never establishes. The experimental mating program is COMPLETE as a closed evidentiary unit (one replicated positive: the proximity dose).
