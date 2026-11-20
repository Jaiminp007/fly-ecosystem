# TURN-GATE Results V1f — extinction-targeted surprise replay (single authorized attempt)

Date: 2026-10-26. Plan: `docs/TURN_GATE_PLAN_V1F.md` (no amendments).
Bank: `evidence/turn-gated-dev/fresh-06/` (fresh, 6 histories).
Evidence: `evidence/turn-gated-dev/attempt-06/`.

## Verdict: PHASE-F-GO; intervention moves extinction weakly, below band

Conjunctive gates (pre-registered, uniform arm):

- **G1 integrity 15/15 PASS** — join 1.00 on all 15 mains (3 transplants/pair);
  digests equal; 24 founders.
- **G0 training gate PASS** — train gaps 0.8189 / 0.8225 / 0.8116, all ≥ 0.5
  (SIXTH replication of the 0.81–0.83 learning effect).
- **G2a uniform mean gap 0.5658 ≥ 0.3 PASS** — per-pair 0.5597 / 0.7634 /
  0.4766 (5th replication of the 0.52–0.67 transfer level; wider spread,
  same mean).
- **G2b unlearned flat PASS** — +0.0016 / +0.0033 / −0.0035.
- **Seg1 mechanism replication (descriptive):** same-val 0.947–0.954,
  flipped in band, all three (5th replication).

Ledger (exact): **15 mains, 0 probes, 26880 worldTicks, 645120 founderSlots,
2.44e9 scalarOperations** — within all caps; `redone: []` (single clean run).

Manipulation (pre-registered checks):

- **Null hygiene PASS** — train/uniform/unlearned rows read all-zero
  surprise/replay counters (null arms are null; no INVALID override).
- **Bundle fired** — 627 live `surpriseBoosts` + 497 `replaySurpriseBoosts`
  summed over bundle rows (both paths engaged; comparison valid, not void).
- Tournament rows read zero counters as designed (structural selection,
  nothing to meter).

Directional intervention gaps (HB = harm→ben extinction subset; BH =
ceiling ~0.83–0.86 all arms, no claim; same-val 0.943–0.957 all arms,
retention intact):

| pair | uniform HB | tournament HB (Δ) | bundle HB (Δ) |
|---|---|---|---|
| 411010 | 0.455 | 0.487 (+0.032) | 0.529 (+0.074) |
| 411028 | 0.388 | 0.439 (+0.051) | 0.431 (+0.043) |
| 411046 | 0.390 | 0.434 (+0.043) | 0.464 (+0.074) |
| mean | 0.411 | +0.042 | +0.064 |

## Reading: engages weakly, dose insufficient (descriptive; claims stop here)

D1 (+0.042) and D2 (+0.064) are uniformly positive (6/6) with monotone-ish
dose trend (uniform < tournament ≤ bundle in 2/3 pairs; pair 2 inverts by
0.008, noise-level) — but BOTH fall below the pre-registered +0.1
meaningful band. Per the frozen mapping this is the "both ≈ 0" branch:
**minimal surprise-gating does not move extinction enough.** The band did
its job — a weak-but-real signal is not claimed as a win.

What the signal IS: the machinery engages the right process (497 replay
boosts on exactly the surprising records; null arms silent; retention
untouched; BH ceiling respected) and moves HB correctness upward by ~half
a segment-equivalent. That is "insufficient dose," not "wrong mechanism":
abandonment would misread the evidence; the licensed V1g escalates dose
(stronger tournament, higher gain, and/or surprise through multi-segment
exposure) or changes mechanism if escalation fails. Selection-vs-boost
decomposition remains inconclusive at these doses (tournament ≈ bundle
within noise) — V1g separates them at resolving doses.
