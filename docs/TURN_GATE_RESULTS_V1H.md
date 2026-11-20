# TURN-GATE Results V1h — gain deployment + confirmation with compounding (single authorized attempt)

Date: 2026-10-26. Plan: `docs/TURN_GATE_PLAN_V1H.md` (no amendments).
Bank: `evidence/turn-gated-dev/fresh-08/` (fresh, 6 histories).
Evidence: `evidence/turn-gated-dev/attempt-08/`.

## Verdict: PHASE-H-GO; gain REPLICATES and COMPOUNDS

Conjunctive gates (pre-registered, uniform arm):

- **G1 integrity 15/15 PASS** — join 1.00 everywhere; digests equal; 24 founders.
- **G0 training gate PASS** — train gaps 0.8118 / 0.8129 / 0.8189, all ≥ 0.5
  (EIGHTH replication of the 0.81–0.83 learning effect).
- **G2a uniform mean gap 0.6442 ≥ 0.3 PASS** — per-pair 0.5462 / 0.7960 /
  0.5904 (7th transfer replication).
- **G2b unlearned flat PASS** — +0.0051 / +0.0040 / +0.0002.
- **Seg1 mechanism replication (descriptive):** same-val ~0.95, flipped in
  band, all three (7th replication).

Ledger (exact): **15 mains, 0 probes, 26880 worldTicks, 645120 founderSlots,
2.42e9 scalarOperations** — within all caps; `redone: []` (single clean run).

Manipulation (pre-registered): null arms all-zero (no INVALID); gain arm
fired (628 live + 308 replay); gain-seg2 arm fired (424 live + 428 replay).
Both comparisons valid, no voids.

HB correctness (extinction subset) per arm:

| pair | uniform | gain (Δ=D1) | gain-seg2 (Δ vs gain = D2; Δ vs uniform = D3) | same-val (all arms) |
|---|---|---|---|---|
| 413010 | 0.237 | 0.425 (+0.187) | 0.609 (+0.184; +0.371) | 0.944–0.949 |
| 413028 | 0.279 | 0.377 (+0.098) | 0.701 (+0.324; +0.422) | 0.944–0.955 |
| 413046 | 0.205 | 0.321 (+0.116) | 0.592 (+0.271; +0.386) | 0.939–0.946 |

- **D1-replication: +0.187 / +0.098 / +0.116 (mean +0.134) ≥ +0.1** —
  REPLICATED. The V1g pair-2 non-responder (−0.004) becomes small-positive
  (+0.098); heterogeneity shrinks (range 0.172 → 0.089). The stop rule
  does NOT trigger.
- **D2-compounding: +0.184 / +0.324 / +0.271 (mean +0.260)** — the second
  boosted segment adds ~2× the first segment's gain. Boost COMPOUNDS
  (strongly, all pairs).
- **D3-deployment: +0.371 / +0.422 / +0.386 (mean +0.393)** — boosted 2×
  closes ~55% of the gap to same-val levels (0.705 → 0.315 remaining).
- Same-val diffs ≈ 0 (max |0.011|; retention intact across arms AND
  segments). BH ceiling: monotone dose trend again (unclaimed, consistent).

## Reading: surprise-gating is a replicated, compounding extinction lever

The V1g borderline (+0.104, heterogeneous) replicates upward (+0.134, all
pairs positive, tighter spread) on a fresh bank with HARDER flips
(uniform HB 0.24 vs V1g 0.41 — replication across difficulty levels, not
just banks). Compounding (+0.26) exceeds the first-segment effect
(+0.13): surprise makes each additional exposure segment ~2× as
productive for unlearning. No overdose (minimum gap +0.098 across D1;
nothing negative anywhere), no retention cost, no voids.

Status of the surprise-replay line after V1f–V1h (n=6 pairs, 2 banks):
minimal doses move extinction weakly (+0.04–0.06); gain at 1.0/3 moves it
substantially (+0.10–0.13); boosted exposure compounds it (+0.26/segment);
the residual floor (~0.3 gap to same-val) is cue-dependent (floor
attribution stands). The line has answered its chartered questions.
Licensed next and last for this arc: V1i gain-seg2 vs uniform-seg2
(isolating the boost×exposure interaction cleanly at matched 2× exposure),
then CLOSE the transfer arc as answered (8 GO verdicts, replicated
mechanism, attributed floor, working lever with known dose-response) and
redirect program effort to the floor mechanisms (PID-guided cue analysis,
noisy replay, macroscale) or the population track. No RSI claim.
