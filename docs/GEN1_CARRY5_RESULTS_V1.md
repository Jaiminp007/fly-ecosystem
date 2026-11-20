# GEN1-CARRY5 V1 verdict (2026-11-04) — GO (fraction 0.57; both pairs retain >50%)

## Authorization
User-authorized single bounded replication run (disk floor 1 GB; ~2G
before and after per user-trusted reading; output ~1.3M). Frozen plan
`docs/GEN1_CARRY5_PLAN_V1.md` (identical birth-probe pipeline +
gates/bar). Fixtures 7/7 green pre-run (zero worlds); triage full
pipeline on throwaway 490289–490297 (digests move + 13 births + 13/13
birth-exact + pre 0.0079 → post 0.0075) BEFORE bank mint. Bank
474757–474774 minted post-triage, verified clean. Single attempt (22
runs), as measured. No rescoring.

## Results (pairs 474757, 474766; pooled macro-average per frozen rule)
A-content PASSES both; skill genuine. Colonies birth 28+27 pooled;
matched groups 13/13 per history. All 22 runs complete.
- Birth (pre-B) probe: copy 0.0082 vs naive 0.0 → pre-gap +0.0082.
- Post-B probe: copy 0.0078 vs naive 0.0031 → post-gap +0.0047.
- Retention fraction 0.57 > 0.5 AND post-gap > edge AND copy > 0 →
  **GO** (`GEN1-CARRY5-GO-V1`).
- Per-seed: 474757 pre +0.0067 → post +0.0034 (fraction 0.51);
  474766 pre +0.0097 → post +0.0060 (fraction 0.62). Both pairs
  independently clear 0.5 — cleaner than carry4 (no pair-level
  reversal or tie anywhere in the comparison).
- Texture differs from carry4: here B IMPROVES naive (0.0 → +0.0031
  pooled; worst-naive −0.0048 → −0.0003) rather than damaging it, so
  the fraction is smaller (0.57 vs 1.2) while the post-gap stays well
  above bar (+0.0047 vs +0.0092). The double effect is bank-dependent;
  the retention majority is not.

## Reading
Two banks, same instrument: the transmitted birth gap survives the
distinct task by majority on both (1.2, 0.57), post-gap above bar on
both (+0.0092, +0.0047), pre-gap positive on all four pairs. What
varies is B's effect on naive (damage vs tutoring) — the copy arm is
the stable one (0.0081, 0.0078 post-B). Repeatability satisfied with
the mechanism's bank-conditional texture stated. Line closed as
scored. No further claim.

## Preservation
`evidence/gen1-carry5-dev/fresh-43/` (bank, now spent) +
`evidence/gen1-carry5-dev/attempt-01/` (untracked raw evidence, ~1.3M,
22 rows).
