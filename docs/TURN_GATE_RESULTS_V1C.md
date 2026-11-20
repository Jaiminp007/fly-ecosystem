# TURN-GATE Results V1c — replication + flip-split mechanism (single authorized attempt)

Date: 2026-10-26. Plan: `docs/TURN_GATE_PLAN_V1C.md` + Amendments
[A1](TURN_GATE_PLAN_V1C_AMENDMENT_A1.md) (flip-split metric) +
[A2](TURN_GATE_PLAN_V1C_AMENDMENT_A2.md) (range 408001–408054).
Bank: `evidence/turn-gated-dev/fresh-03/` (fresh, 6 histories).
Evidence: `evidence/turn-gated-dev/attempt-03/`.

## Verdict: PHASE-C-GO, mechanism CONFIRMED

Conjunctive gates (pre-registered, bars identical to V1b):

- **G1 integrity 9/9 PASS** — join 1.00 on all 9 mains; transplant
  digests equal; 24 founders.
- **G0 training gate PASS** — train gaps 0.8130 / 0.8303 / 0.8085, all ≥ 0.5
  (third replication of the 0.81–0.83 learning effect: V1, V1b, V1c).
- **G2a transferred mean gap 0.6087 ≥ 0.3 PASS** — per-pair
  0.5193 / 0.7394 / 0.5674 (all three independently above bar).
- **G2b unlearned flat PASS** — −0.0028 / +0.0019 / −0.0020, all |·| ≤ 0.1.

Ledger (exact): **9 mains, 0 probes, 16128 worldTicks, 387072 founderSlots,
1.44e9 scalarOperations** — within all caps; `redone: []` (single clean
run, no crash, no resume).

Pre-registered DESCRIPTIVE flip-split (Amendment A1 metric:
contact-weighted correctness; band from plan, unchanged):

| pair | same-valence | flipped | replayed-vs-train |
|---|---|---|---|
| 408001→408010 | 0.9516 (≥0.85 ✓) | 0.5269 (∈[0.4,0.7] ✓) | 0.7187 |
| 408019→408028 | 0.9410 ✓ | 0.6822 ✓ | 0.6797 |
| 408037→408046 | 0.9465 ✓ | 0.6722 ✓ | 0.4467 |

**mechanismConfirmed: true** — all three pairs satisfy the confirm
criterion. Both pre-registered falsifiers avoided: flipped is nowhere near
full relearning (≈0.9) nor pure replay (≈0.1).

## Reading (descriptive; claims stop at the gate)

The V1b post-hoc structure replicates on a fresh bank almost exactly:

| line | train | same-val | flipped | transMean |
|---|---|---|---|---|
| V1b (407xxx) | 0.91 | 0.944–0.951 | 0.590–0.640 | 0.578 |
| V1c (408xxx) | 0.81–0.83 | 0.941–0.952 | 0.527–0.682 | 0.609 |

Same-agent carried weights retain still-valid associations at/above train
level while flipped cues sit in near-chance partial correction; transfer
tax ≈ 0.2–0.3 both lines. Internal consistency note (unclaimed): pair 3
adapted most on both lenses (flipped 0.672 highest, replayed 0.447 lowest =
furthest from train valences); pair 1 least (0.527 / 0.719) — the two
lenses agree within every pair, which is what partial adaptation predicts.

Status of the mechanism: PROMOTED from post-hoc observation (V1b) to
replicated finding (V1b+V1c, n=6 pairs, two fresh banks). What it is NOT:
an intervention (no rigidity/plasticity manipulation tested), a
capacity account (IB diagnostic from Round 14 not yet run), or an RSI
claim. Licensed next steps (each needs its own frozen plan): extended-run
plasticity probe (do flipped cues converge with more ticks?), IB capacity
diagnostic on frozen rows (zero worlds), GS-style hyperparameter test.
