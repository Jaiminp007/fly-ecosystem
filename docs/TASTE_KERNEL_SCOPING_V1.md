# Taste-kernel scoping V1 (DESIGN, not frozen — no bank, no code, no worlds)

Follows Track-K1 V1 (INFEASIBLE-BUDGET in tick substrate) + V1A
(INFEASIBLE-BASELINE: tick bodies don't turn-gate live). New rationale:
the TASTE substrate HAS the behavior (train turn-gap 0.82, V1k 6th
replication) AND the budget fits at capacity ≤69 (V1A fuse math,
substrate-independent). Same kernel, substrate with something to improve.

## Design (candidate T: kernel-taste predictor)

- Replace the linear readout `sigmoid(dot(w,phi))` with kernel prediction
  over the agent's own (phi,target) records: program {rbf,gradient}
  (THE accepted revision), capacity 64 (V1A fit: 14,378 ≤ 15,500),
  evict-oldest. Same records the linear update already consumes
  (`tasteUpdate` record stream) — no new data source.
- Inputs: taste phi, 11 dims (1 + 4 cue + 6 pairwise), |v|≤tasteScale.
  VERIFY at freeze: tasteScale ≤ 1 (else tanh adapter per K1 precedent).
  Dims ≤128 ✓ (kernel bound).
- Targets: `record.target` (same targets as the linear update).
  VERIFY at freeze: |t|≤1 for all records (clamp + count if not, with
  the clamp disclosed as adapter behavior).
- Update cadence: every live `tasteUpdate` (same cadence, same records).
  Billing: kernel formula (~192R+90 at R=64 → ~12.4k/tick) + linear
  baseline math kept for the flag-off path. Fuse re-run at freeze.
- Transplant: coefficients carried, records cleared (V1A rule verbatim;
  no transfer in this design — rows persist records for audit only).
- Null-default: separate module (`learning/taste-kernel.mjs`);
  `taste-energy.mjs` untouched; flag off ≡ current linear path exactly
  (fixture-verified identity + sources-closure static guard).

## Why this succeeds where K1 failed (both prongs addressed)

- Budget: V1A fuse math re-runs here (same per-tick cost class;
  capacity 64 fits; re-verify mechanically at freeze).
- Substrate: taste agents turn-gate at 0.82 (proven, repeatedly) —
  there IS behavior for the kernel to improve (vs tick's 0.00).

## Gates sketch (for the future frozen plan)

(a) Kernel-taste pooled turn-gap − linear pooled turn-gap ≥ +0.1
(program yardstick, matched histories, fresh bank); (b) G0 baseline
≥0.5 (expected pass — V1k replicated); (c) null-hygiene fixture-level;
(d) no-collapse (survival/pause, V1A operationalization). GO = first
RSI-paragraph gap closed (embodied benefit, finally testable); NOGO =
kernel adds nothing embodied (forecast≠action confirmed behaviorally).

## Status

SCOPING (thinking, not freezing). Next: verify phi/target bounds in
code (read-only, zero worlds) → freeze Track-T1 plan (taste-kernel V1)
→ implement → attempt. The open core narrows to execution.
