# TURN-GATE PLAN V1l — lossy-initialized seg-chain convergence (FROZEN, DESIGN ONLY)

Date: 2026-11-02. Status: FROZEN before code (freeze-before-code rule).
License: `docs/TURN_GATE_RESULTS_V1K.md` (GO: lossy seg1 HB 0.372→0.588;
treatment confirmed, cure open). New rationale (V1k demanded one): V1d/V1e
mapped the EXACT trajectory (converge-then-saturate, 0.59→0.71→0.81→0.82
aggregate); NO lossy-initialized trajectory exists anywhere. V1l asks
whether a lossy start changes the ASYMPTOTE (cure direction) or merely
repeats the saturate pattern from a higher floor (palliative).

## Design (V1d-chain × V1k-lossy; lossy ONCE)

Per pair (3 pairs, sequential [(H0,H1),(H2,H3),(H4,H5)] as V1b–V1k —
same family, fresh bank; each test codebook contains BH+HB cues):
1. **train** (1792, H_tr) — snapshot end weights.
2. **lossy-seg1** (1792, H_te + transplant ×0.5 of train-end, +n muls
   billed; V1k machinery) — the treated start.
3. **seg2** (1792, H_te + EXACT transplant of seg1-end weights) —
   V1d chain machinery (tests whether the lossy start propagates).
4. **seg3** (1792, H_te + EXACT transplant of seg2-end weights) —
   the asymptote probe.
5. **unlearned** (1792, H_te) — flat control.
5 runs × 3 pairs = 15 mains, 0 probes, BT_TICKS=1792, N=24.
Lossy applied ONCE (seg1): re-shrinking each link would test dose
accumulation (different question — parked, needs its own rationale).
Rows persist weights (V1d chain requirement); segSummary link-to-link
deltas + classifySeg (V1d machinery, HB-split extended descriptively).

## Gates (conjunctive, fail-closed; within-line — no cross-line comparison)

- G1 transplant-integrity on ALL rows incl. lossy tag (join ≥0.99;
  provenance + α-application proof; V1k-A1 machinery). Fail → INVALID.
- G0 train ≥0.5 all 3 pairs else INCOMPLETE-UNTRAINED.
- **G2a-HBconv (PRIMARY)**: mean HB-seg3 − HB-seg1 ≥ +0.1
  (convergence: the lossy trajectory keeps climbing; yardstick +0.1).
  Fail (G0 intact) → NOGO (palliative: one-shot gain, exact-like saturate).
- G2b unlearned flat ≤0.1 all 3. G2c-BH floor: mean BH-seg3 ≥ 0.7.
  G2d same-val floor: mean same-seg3 ≥ 0.5.
- GO-V1l ⟺ G1 ∧ G0 ∧ G2a-HBconv ∧ G2b ∧ G2c ∧ G2d.
- INCOMPLETE-UNTRAINED on G0 fail; INVALID on integrity/config/geography fail.
- DESCRIPTIVE: per-link HB/BH/same, per-pair trajectories, contact counts,
  op counts, segSummary deltas + classifySeg per link.
- No RSI claim. GO ≠ wound-closed (HB-seg3 ~0.7 expected << train 0.82;
  honesty: convergence toward the stall band, not the train level).
  GO does not fire M4 trigger 2 (overall tax gates it; HB-seg ≠ overall).

## Fixtures (11, gate before bank)

10 V1k-mirror (transplant exact/scaled/fresh-target/integrity/billing;
direction-split scorer unit; HB-lift/BH-floor/same-floor/G2a/G2b branches;
INVALID/INCOMPLETE preserved; bank-build form) + 1 seg-chain trajectory
unit (synthetic 3-seg rows: asserts HB-seg3−HB-seg1 computed across links,
chain weights carried, empty-direction-seg null fail-closed).

## Bank, caps, attempt discipline

- Fresh-13 bank `evidence/turn-gated-dev/fresh-13/`: 6 histories × 9 =
  54 seeds, range **449001–449054**. VERIFIED clean 2026-11-02 (zero
  exact-seed/registry/test hits across docs/scripts/tests/learning/engine
  pre-freeze). attempt-13 + fresh-13 verified free pre-freeze. Builder
  re-verifies at build; fixture-seeds file after build; post-bank refusal;
  union-excluded (spent through 448xxx + own 449001–449054 appended).
- Caps: 15 mains / 0 probes / 26880 worldTicks / 645120 founderSlots /
  4.0e9 scalar ops (1.7× linear from V1k actual) / 9000s wall. Fail-closed.
- ONE authorized attempt (attempt-13). `redone: []` expected; repair only
  result-independent one-line cap form with dual provenance; any other
  deviation → INVALID, line closes.
- Triage: zero NEW failures vs pre-freeze baseline (record both).
