# MATE-ATTRACT RESULTS V4 — departure-gated taxis (NOGO, arc CLOSED)

Date: 2026-11-02. Plan: `docs/MATE_ATTRACT_PLAN_V4.md` (FROZEN, design only).
Implement: `e8193d4` (gate knob + instrument + 13/13 fixtures + fresh-05 bank).
Attempt-05 (single, authorized): 18 mains / 0 probes / 32256 worldTicks /
774144 founderSlots / 3.50e9 ops. Ledger exact, `redone: []`, G1+G2 true.

## Verdict: MATE-ATTRACT-NOGO-V4

Departure-gated taxis does NOT lift hub compounding: hubAttract gen-2 = 7
vs hub control = 8 (bar: ≥2 AND strictly greater — fails the second prong).
Energy gating is insufficient; the bottleneck is not (only) starvation.
Interference/queuing (cooldown-12 + capacity-240 saturation) becomes the
leading hypothesis for all follow-ups. No V5 without new rationale.

## Per-arm totals (6 histories each)

- hubAttract (hub + k=2 + gate@bar): births 33, gen-1 26, gen-2 7
  per-seed gen-2 [3,1,1,1,1,0] (seeds 438001…438046).
- hub (hub + k=0): births 37, gen-1 29, gen-2 8
  per-seed gen-2 [2,2,1,1,1,1].
- spread (spread + k=0, descriptive): births 36, gen-1 34, gen-2 4
  per-seed gen-2 [1,1,0,0,2,0].

## Descriptive (non-gating)

- firstMatingTick medians: hubAttract ≈ hub per-seed (217/217, 307/325,
  259/257, 230/239, 218/218, 242/242) — gate shifts neither schedule nor
  order. Spread similar range (217–347). Timing never separates, fifth
  bank running (V1, V1b, V2, V3, V4).
- Endpoint energies: hubAttract −36…−46, hub −32…−47 (no rescue; both pay
  the clumped-food price). Spread −9…−36 (cheaper, as ever).
- Contrast with V3 (ungated k=2: hubAttract 0 vs hub 4, uniform-low births):
  gating RESTORES births to control level (33 vs 37) but does not LIFT
  compounding above it (7 vs 8). The gate removes the harm without adding
  benefit — starvation was the harm mechanism (R75 MVT reading confirmed
  in the negative direction), but removing it reveals no latent compounding
  advantage. Encounters were never the constraint; conversion is.
- Bank-dependence note: hub control compounds here (8) after scoring 4–6
  across V1/V1b/V2/V3 — fifth demonstration that control-arm levels drift
  by bank while verdicts key on within-bank contrasts (pre-registered).

## Arc closure

ATTRACT arc fully closed: sensing bypassed (V1) → suppression inert (V1b)
→ steering inert (V2) → interaction harmful (V3) → gating neutral (V4).
Five levels, one direction: the encounter-rate knob does not compound.
Downstream conversion (encounter→birth, birth→gen-2 survival) and
interference/queuing are the licensed frontiers. No RSI claim.
Cumulative program spend: 7893 (+18 ledgered).
