# TURN-GATE PLAN V1N — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code (freeze-before-code rule).
License: V1m's explicit open ("peak unmapped between 0 and 0.25, no
interpolation licensed") + M2 MET standing (this line does not re-litigate
MET; it maps the low-dose peak on a fresh bank).

## Question

Where is the shrinkage-dose peak in (0, 0.25]? V1m's curve is monotone
in {0.25, 0.50, 0.75} with best at the boundary (0.25) — the maximum lies
at or below 0.25. Does the unlearning effect hold across low doses, or do
finer doses break it?

## Design (V1m-verbatim machinery, new dose panel)

- 7 tags × 3 pairs = 21 mains, 0 probes: train + lossy-{0.05, 0.10, 0.15,
  0.20, 0.25} + unlearned. α=0.25 re-measured in-line (within-line anchor;
  V1m's 0.9137 never rescored, descriptive comparison only).
- Single alpha-parameterized transplant loop (V1l lesson); lossy-once seg
  chain (V1l design); contact-weighted flip-split + BH/HB/same partitions
  (Amendment A1); E1/D0 +0.1 band fixed (yardstick, not tuning); per-arm
  VOID + null-hygiene INVALID; overdose reading <-0.05; 1792-tick segs.
- Bank: fresh-15 `evidence/turn-gated-dev-v1n/fresh-15/`, 6 histories × 9,
  range **453001–453054**. VERIFIED clean 2026-11-02 (zero hits
  docs/scripts/tests/learning/engine pre-freeze). attempt-01 + fresh-15
  verified free pre-freeze. Builder re-verifies; fixture-seeds file after
  build; post-bank refusal; union-excluded (spent through 452xxx + own
  453001–453054 appended).

## Gates (conjunctive, fail-closed)

- G1 join ≥0.99 + integrity. G0 train ≥0.5 (expected pass — replicated 7×).
- **G2a-PRIMARY**: best-α pooled HB-seg1 ≥ pooled train − 0.1 (MET-bar
  verbatim, V1m-style). Peak location (argmax over 5 alphas) DESCRIPTIVE.
- G2b unlearned flat (|gap| ≤0.1). G2c BH floor ≥0.7 all alphas.
  G2d same floor ≥0.5 all alphas.
- GO-V1N ⟺ G1 ∧ G0 ∧ G2a ∧ G2b ∧ G2c ∧ G2d. INVALID/INCOMPLETE per G1/G0.

## Fixtures (13, gate before bank)

Mirror V1m's 12–14: dose-selection (argmax over 5), mains-cap
(`TM_ARMS.length` × pairs = 21), structural source guard, bank-build
tmpdir (9-schema + union-exclusion incl. 453xxx), scorer GO/NOGO/
collapse/INVALID/INCOMPLETE branches, collector valence, transplant
integrity (exact + scaled), null-hygiene VOID.

## Caps, attempt discipline

- 21 mains / 0 probes / 37632 worldTicks / 903168 founderSlots /
  4.0e9 scalar ops (1.2× linear est 3.4e9) / 10800s wall. Fail-closed.
- ONE authorized attempt (attempt-01). `redone: []` expected; repair only
  result-independent one-line cap form with dual provenance; any other
  deviation → INVALID, line closes.
- Triage: zero NEW failures vs pre-freeze baseline.

## What GO/NOGO mean

- GO: peak mapped + effect robust across low doses (argmax reported;
  completes the dose-response 0→0.75 with V1m).
- NOGO: finer doses break the effect (boundary finding — also informative;
  suggests 0.25 is a cliff edge, not a smooth peak).
