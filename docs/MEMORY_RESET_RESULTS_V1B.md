# MEMORY-RESET V1b verdict (2026-11-04) — NOGO (scored: benefit survives full wipe)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 2G before and
after; output 785K). Frozen plan `docs/MEMORY_RESET_PLAN_V1B.md`. V1b =
V1-verbatim factorial on joint-bank reuse (fresh-11 histories, disclosed
second measurement, zero new seeds — NOT a new bank, NOT the joint
instrument, NOT fresh-12). Fixtures 3/3 green pre-run (zero worlds;
reuse-reader accept/reject + scorer smoke); no triage (V1-verbatim, no
new ops). Single attempt, as measured. No rescoring.

## Results (joint seeds 474163, 474172 — benefit-positive bank)
Pooled return-A: intact 0.488 vs unlearned 0.132 (guard passes — benefit
replicates 3.7×). Full wipe (both) 0.660 — does NOT erase (exceeds naive
5× and intact 1.35×). Verdict: **MEMORY-RESET-NOGO-V1** (benefit is
memory-independent). G1 pass (10 mains, integrity + accounting clean).
Factorial (pooled, both pairs same direction):
wreset 0.695 / sreset 0.485 / both 0.660 vs intact 0.488 vs naive 0.132.

## Reading (deterministic matching makes this a clean decomposition)
- Same-history deterministic replay matches world trajectories to tick
  1536 across intact/wreset/sreset/both (same program, same seeds —
  identical depletion/positions; only the 1536 op differs). So: store
  wipe changes NOTHING (0.485 ≈ 0.488 — replay store irrelevant);
  weight wipe HELPS substantially (0.66–0.70 vs 0.49 — trained weights
  actively interfere with return-A reading, both pairs).
- The benefit (intact > naive) therefore decomposes: +trajectory
  familiarity (having depleted/navigated this world through A/B/C —
  the only thing intact retains over naive once weights/store are
  accounted) −weight harm (trained weights hurt novel-layout reading)
  +store null. Net positive because familiarity outweighs weight-harm;
  erasing weights removes the harm → best of all.
- This CONFIRMS the master pattern at its strongest (even where a
  benefit exists, carried weights hurt it) while explaining backward-GO
  without weight content: the GO is trajectory-familiarity, not
  memory. Combined with V1-void (no benefit on fresh-12: no familiarity
  advantage there — floor layouts) and joint-DISAGREE (regime-dependence),
  the return-A effect is fully mapped: familiarity × regime, never
  weight/store content.
- Line CLOSED as scored (factorial complete; no licensed follow-up).
  No transfer/RSI/population claim.

## Preservation
`evidence/memory-reset-dev/reuse-01/` (re-use protocol, joint seeds,
now second-measured) + `evidence/memory-reset-dev/reuse-01/attempt-01/`
(untracked raw evidence, 785K). V1 fresh-12 bank/attempt untouched.
