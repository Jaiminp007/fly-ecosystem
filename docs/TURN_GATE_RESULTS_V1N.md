# TURN-GATE RESULTS V1N — PHASE-N-GO

Date: 2026-11-02. Attempt-01 (single authorized): 21/0/37632/903168/3.499e9,
`redone: []`, caps respected (4.0e9/10800s). Bank fresh-15 (453001–453054) SPENT.

## Verdict: PHASE-N-GO (all gates true)

| Gate | Result |
|---|---|
| G1 join+integrity | TRUE |
| G0 train ≥0.5 | TRUE (0.8237 — 8th replication) |
| G2a-PRIMARY best-α ≥ train−0.1 | TRUE (0.9526 ≥ 0.7237, margin +0.23) |
| G2b unlearned flat | TRUE |
| G2c BH floor ≥0.7 | TRUE (0.83–0.86) |
| G2d same floor ≥0.5 | TRUE (0.92–0.93) |

## The peak is a plateau (descriptive argmax 0.1)

HB-seg1 by α: 0.05→0.9502, 0.10→0.9526, 0.15→0.9510, 0.20→0.9513,
0.25→0.9342. The low-dose panel is FLAT at ~0.95 (range 0.018, all
beating train by +0.11–0.13). No interior peak, no cliff edge: the
unlearning effect saturates by α=0.05 and holds through 0.25.
- α=0.25 (0.9342) replicates V1m's 0.9137 to 0.02 (bank variance).
- BH/same guardrails hold everywhere (no overdose, no erosion).

## Licensed interpretation

- Dose-response complete 0.05→0.75 with V1m: plateau (0.05–0.25, ~0.95)
  → step down (0.5, 0.53) → low (0.75, 0.36). The curve has a broad
  flat top, not a sharp optimum: shrinkage anywhere in (0, 0.25]
  recovers transfer to ~0.95.
- No rescoring, no second attempt. Line CLOSED.

## Cumulative: 8103 worlds (8082 + 21 V1n mains).
