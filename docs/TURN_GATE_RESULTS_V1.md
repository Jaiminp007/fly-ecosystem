# TURN-GATE results — Phase A (GO: cue-conditioned turning replicates)

Frozen plan: `docs/TURN_GATE_PLAN_V1.md`. Single authorized Phase-A attempt:
12 mains (candidate/unlearned × 6 histories, fresh bank 395019–395072),
zero probes. No crashes, no resume (`redone: []`).

## Verdict: PHASE-A-GO (conjunctive, all bars pass as frozen)

- G1 integrity: join rate 1.00 on all 12 runs (≥0.99 required) — the
  per-tick decision+intake join is proven lossless on fresh data.
- G2a turn-gating (candidate): turn|harmful − turn|benign = 0.81–0.83 on
  ALL 6 histories (bar: ≥0.5 on ≥4/6). Near-identical magnitudes across
  histories (sd < 0.01) — a tighter replication than the CUE pilot suggested.
- G2b unlearned control: |turn|harm − turn|ben| ≈ 0.00–0.01 on all 6
  histories (bar: ≤0.1). The flat control holds: the effect is learning,
  not ecology.
- Ledger exact: 12 mains / 0 probes / 21504 ticks / 516096 founder-slots /
  1.88e9 ops — all caps. Dual provenance recorded.

## What this decides (and what it doesn't)

CONFIRMED on fresh, pre-registered grounds: trained flies turn on
harmful-cue contact (82–83%) and cruise through beneficial cues; untrained
flies turn at a flat ~5% regardless of cue. The CUE-DISCRIMINATE "pause"
null is now explained — pausing was the wrong readout; the behavior is
turn-gated avoidance, and it replicates exactly where predicted.

NOT claimed: no intervention was tested. GO licenses a V1b follow-up ONLY:
cue-conditioned avoidance TRAINING (accelerate, sharpen, or transfer the
turn response) under its own frozen plan + fresh bank + fresh goal. No
Phase-B machinery exists yet; none is started here.

## Cumulative: 7423 + 12 = 7435 (all ledgered, zero duplicates)
