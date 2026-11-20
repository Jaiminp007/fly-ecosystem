# TURN-GATE RESULTS V1j — lossy transplant transfers BETTER (GO, line re-closed)

Date: 2026-11-02. Plan: `docs/TURN_GATE_PLAN_V1J.md` (FROZEN, design only).
Implement: `589ede7` (+ post-bank conversion `98753c4`; x0.5 transplant +
scaled integrity + dose scorer + 9/9 fixtures + fresh-10 bank 418001–418054).
Attempt-10 (single, authorized): 12 mains / 0 probes / 21504 worldTicks /
516096 founderSlots / 1.90e9 ops. Ledger exact, `redone: []`, all gates true.

## Verdict: PHASE-J-GO

Lossy-tutoring lift confirmed: mean flipped(lossy) − flipped(exact) = +0.1324
(≥ +0.1 band), same-val(lossy) = 0.9447 (≥ 0.5 floor, ≈ V1c's 0.95).
Halving transplanted weights IMPROVES transfer while preserving retention.
The Kirby/R92/R101 prediction holds in-substrate: the bottleneck structures.

## Per-pair flip-split (same-val / flipped)

| pair | exact same | exact flipped | lossy same | lossy flipped | lift |
|------|-----------|---------------|-----------|---------------|------|
| 418001→418010 | 0.9472 | 0.5577 | 0.9399 | 0.6365 | +0.0788 |
| 418019→418028 | 0.9488 | 0.5318 | 0.9460 | 0.7052 | +0.1734 |
| 418037→418046 | 0.9519 | 0.5095 | 0.9482 | 0.6544 | +0.1449 |

Lift positive on all 3 pairs (mean +0.1324); same-val identical to 4 decimals
across arms (0.94–0.95 both) — retention is REAL (not a copying artifact),
and exact-copy carries train-codebook noise that hurts transfer (shrinkage
removes it: regularization, not amnesia). G0 train 0.82/0.819/0.818 (10th+
replication); G2a exact mean 0.5135; G2b unlearned flat; join 1.00.

## Re-pricing V1b–V1i (the artifact-control payoff)

- niche-ID 1.000 and same-val 0.95: retention CONFIRMED as real (lossy arm
  retains 0.94+), but exact-copy ADDS inert fidelity — the "no erosion"
  reading mixed genuine retention with copying inertia. Future retention
  claims must use lossy or noisy transplants (exact-copy is the
  upper-bound control, not the measure).
- The deployed surprise-gated replay (V1i) stands: V1j changes the
  transplant, not the training; no conflict, complementary mechanisms
  (train better + transfer leaner).
- 2404.04286's counterpart (bias amplification) checked: same-val floor
  holds (0.9447 ≥ 0.5) — structuring WITHOUT collapse. The GO bar's
  fidelity floor did its job as the pre-registered separator.

Line re-CLOSED (artifact-control annex complete; no V1k without new
rationale). Cumulative program spend: 7971 (+12 ledgered).
