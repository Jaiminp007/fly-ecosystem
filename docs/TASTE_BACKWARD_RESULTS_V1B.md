# TASTE-BACKWARD V1b verdict (2026-11-03) — GO, direction confirmed

## Authorization
User-authorized single bounded replication run (disk floor 1 GB; 5G before
and after; output 949K). Frozen plan `docs/TASTE_BACKWARD_PLAN_V1B.md`
(same contrast/conditions/scorer as V1, fresh bank). Fixtures 7/7 green
pre-run (zero worlds; V1 bank test converted to post-spend refusal guard
per standing order); bank 473046–473063 minted post-fixtures. Single
attempt; V1 untouched, no rescoring.

## Results, histories 473046/473055 (6 mains / 0 probes, G1+G2 pass)
Pooled per-tick food rates (A → return-A):
- candidate: 0.4196 → 0.2876, drop 0.1321.
- frozen (A-weights held): 0.4196 → 0.1441, drop 0.2755.
- unlearned (never learns): 0.7833 → 0.1014, drop 0.6819.
- tol 0.0420. Verdict: **GO** — candidate drop < unlearned drop,
  candidate retA-rate (0.2876) > unlearned (0.1014), candidate drop ≤
  frozen drop + tol.
- A-rates candidate == frozen both histories again (0.4596/0.3797) —
  frozen-A design validated twice; divergence only after B/C.
- Same texture as V1: unlearned eats most in A (0.82/0.75), collapses
  hardest (drop 0.75/0.61); candidate retains best both histories
  (drops 0.19/0.08); frozen middle. Survivors: candidate 11/12, frozen
  4/6, unlearned 2/3. Energy: candidate > frozen > unlearned, all arms.

## Pooled V1+V1b (descriptive, no bar, no rescoring V1)
Candidate drops 0.11/0.13, frozen 0.24/0.28, unlearned 0.51/0.68.
Direction consistent across all four histories individually; unlearned
never retains best, candidate retains best in 4/4. Still claims nothing
beyond licensing V1c (replication + lineage resolution — not started).

## Preservation
`evidence/taste-backward-dev/fresh-02/` (bank, now spent) +
`evidence/taste-backward-dev/attempt-02/` (untracked raw evidence, 949K).
