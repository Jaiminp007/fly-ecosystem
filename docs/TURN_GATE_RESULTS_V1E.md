# TURN-GATE Results V1e — vanish-vs-floor trajectory (single authorized attempt)

Date: 2026-10-26. Plan: `docs/TURN_GATE_PLAN_V1E.md` (no amendments).
Bank: `evidence/turn-gated-dev/fresh-05/` (fresh, 6 histories).
Evidence: `evidence/turn-gated-dev/attempt-05/`.

## Verdict: PHASE-E-GO; trajectory SATURATING PARTIAL CONVERGENCE

Conjunctive gates (pre-registered, seg1 = 4th V1c-replication):

- **G1 integrity 18/18 PASS** — join 1.00 on all 18 mains (4 chained
  transplants per pair); digests equal; 24 founders.
- **G0 training gate PASS** — train gaps 0.8150 / 0.8328 / 0.8140, all ≥ 0.5
  (FIFTH replication of the 0.81–0.83 learning effect).
- **G2a seg1 mean gap 0.5489 ≥ 0.3 PASS** — per-pair 0.5361 / 0.6341 / 0.4766
  (4th replication of the 0.52–0.67 transfer level).
- **G2b unlearned flat PASS** — −0.0047 / −0.0005 / −0.0010.
- **Seg1 mechanism replication (descriptive):** same-val 0.9465 / 0.9483 /
  0.9535, flipped 0.6083 / 0.6375 / 0.5259 → confirms all three (4th time).

Ledger (exact): **18 mains, 0 probes, 32256 worldTicks, 774144 founderSlots,
2.95e9 scalarOperations** — within all caps; `redone: []` (single clean run,
no crash, no resume).

Descriptive 4-point trajectory (flipped correctness; same-val 0.947–0.954
THROUGHOUT — extended exposure does not erode retained associations):

| pair | seg1 (1×) | seg2 (2×) | seg3 (3×) | seg4 (4×) |
|---|---|---|---|---|
| 410001→410010 | 0.608 RIGID | 0.694 +0.086 RIGID | 0.776 +0.082 INT | 0.791 +0.015 INT |
| 410019→410028 | 0.638 RIGID | 0.810 +0.172 INT | 0.862 +0.052 CONV | 0.870 +0.009 CONV |
| 410037→410046 | 0.526 RIGID | 0.638 +0.113 RIGID | 0.782 +0.143 INT | 0.805 +0.024 INT |

Mean flipped: 0.591 → 0.711 → 0.807 → 0.822. All 9 link deltas positive;
seg3→seg4 increments collapse to +0.01–0.02 (saturation).

## Reading: saturating partial convergence with pair-specific floors

- **H-plastic-strong (converge at 4×): NOT supported** — 1/3 pairs converged.
- **H-rigid (stay in band): NOT supported** — all pairs exited the band by seg3.
- **Observed: monotone correction with saturation.** The tax closes fast
  then stalls: pair-specific floors at 0.79/0.87/0.81. Convergence is
  POSSIBLE (pair 2 proves the machinery) but not UNIVERSAL — the floor is
  cue-set-dependent, not a universal capacity wall (else all pairs would
  stall at the same level).
- **Pre-registered prediction check:** exponential-closure extrapolation
  predicted seg4 mean ≈ 0.84; actual 0.822 (off by 0.018). The mental model
  held; the LEVEL misses convergence for 2/3 pairs — exactly the
  borderline the plan declined to gate on. The decline is vindicated: a
  0.85 gate would have NOGOd a line whose trajectory is the real finding.
- **No erosion:** same-valence correctness never drops across 4× exposure
  (0.95 throughout) — extended re-exposure corrects flipped cues without
  degrading retained ones (descriptive; no forgetting claim beyond the gate).

Status of the transfer-tax question after V1b–V1e (n=12 pairs, 5 banks):
the tax is real (≈0.3 gap at 1×), shrinks fast with exposure (≈1/3 closure
per doubling through 3×), then saturates at pair-specific floors
(≈0.79–0.87). What sets the floor — which flipped cues resist, and why —
is the next question; it needs cue-level attribution on frozen rows (zero
worlds, read-only) before any structural intervention is licensed. No RSI
claim.
