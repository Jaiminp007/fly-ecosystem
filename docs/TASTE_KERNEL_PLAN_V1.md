# TASTE-KERNEL PLAN V1 (Track-T1) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code (freeze-before-code rule).
License: `docs/TASTE_KERNEL_SCOPING_V1.md` + interface verifications
(zero worlds, read-only): taste phi 11-dim with |v|≤tasteScale=1/√11≈0.30
(by construction, `tasteFeatures`); record targets BINARY {0,1}
(`target: outcomeSign===1?1:0`); budget V1A-math re-applies (capacity-64:
14,378 ≤ 15,500). No adapter needed (bounds hold natively).

## Question

Does kernel-taste (RBF-gradient prediction over the agent's own
(phi,target) records) beat linear-taste by ≥+0.1 turn-gap on fresh
matched histories?

## Design (new module, taste substrate)

- New file `learning/taste-kernel.mjs`: kernel state per agent
  (program {rbf,gradient}, capacity 64, evict-oldest); predict replaces
  `sigmoid(dot(w,phi))` on the kernel-critic... on the kernel-taste path;
  update on the same live record stream (same targets, same cadence).
  Transplant: coefficients carried, records cleared (V1A rule).
- Null-default: `taste-energy.mjs` untouched; new arm flag selects the
  kernel path (arm wiring mirrors K1: extend taste-experiment arm list +
  dispatch, existing arms byte-identical, triage-guarded).
- No adapter (bounds native): phi |v|≤0.30, targets ∈{0,1}. Fixtures
  assert both bounds mechanically (fail-closed if violated).
- Billing: kernel formula (~192R+90 at R≤64) + linear baseline math;
  fuse re-run at freeze (this plan): 14,378 ≤ 15,500 ✓ (mechanical,
  V1A-identical).

## Arms (matched histories, 12 mains)

Per history (6 fresh histories): baseline linear-taste
('candidate'-family arm, flag off) + kernel-taste (new arm, flag on),
same history seed, 1792 ticks, N=24. 6×2 = 12 mains, 0 probes.
The ONLY difference is the predictor (single-knob discipline).

## Gates (conjunctive, fail-closed)

- G1 join ≥0.99 + integrity. G0 baseline mean ≥0.5 (expected pass —
  V1k replicated 0.82; fail → INCOMPLETE-BASELINE).
- **G2a-PRIMARY**: pooled kernel − pooled baseline ≥ +0.1
  (program yardstick; contact-weighted pooled gaps, V1m-style).
- G2b no-collapse: kernel survival ≥50% AND pause ≤ baseline+0.2.
- G2c null-hygiene fixture-level (construction identity +
  sources-closure static guard, green pre-bank).
- GO-V1 ⟺ G1 ∧ G0 ∧ G2a ∧ G2b ∧ G2c. INVALID/INCOMPLETE per G1/G0.
- DESCRIPTIVE: per-tick ops, projection stats, record counts.

## Fixtures (14, gate before bank)

Module (7): program validation; projection bounds (|v|≤0.30 mechanical);
construction (capacity-64, accepted program); null-identity;
transplant carry/clear; billing exactness + FUSE re-run at 64;
target-binary assert. Instrument (7): collector valence; scorer
GO/NOGO/collapse/INVALID/INCOMPLETE branches; bank-build tmpdir;
mains-caps frozen-design check; runner structural guard.

## Bank, caps, attempt discipline

- Fresh-01 bank `evidence/taste-kernel-dev/fresh-01/`: V1k-family schema
  (TasteExperiment histories), 6 histories, range **452001–452054**.
  VERIFIED clean 2026-11-02 (zero hits docs/scripts/tests/learning/engine
  pre-freeze). attempt-01 + fresh-01 verified free pre-freeze. Builder
  re-verifies at build; fixture-seeds file after build; post-bank refusal;
  union-excluded (spent through 451xxx + own 452001–452054 appended).
- Caps: 12 mains / 0 probes / 21504 worldTicks / 516096 founderSlots /
  10.0e9 scalar ops (1.2× linear est 8.6e9) / 10800s wall. Fail-closed.
- ONE authorized attempt (attempt-01). `redone: []` expected; repair only
  result-independent one-line cap form with dual provenance; any other
  deviation → INVALID, line closes.
- Triage: zero NEW failures vs pre-freeze baseline (record both; ENOSPC
  environmental failures pre-existing).

## What GO/NOGO mean

- GO: embodied benefit DEMONSTRATED (first RSI-paragraph gap closed).
  Does NOT complete RSI (search failed; revisions lack advantage).
- NOGO: kernel adds nothing embodied in the substrate that turns
  (forecast≠action confirmed where it matters most).
