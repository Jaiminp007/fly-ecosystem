# GEN1-CARRY4 V1 verdict (2026-11-04) — GO (birth gap retained ≥93%; B hurts naive, not copy)

## Authorization
User-authorized single bounded run (disk floor 1 GB; ~2G before and
after per user-trusted reading; output ~1.3M). Frozen plan
`docs/GEN1_CARRY4_PLAN_V1.md` (birth probe via frozen newborns +
B-train + post-probe; GO iff retention fraction > 0.5 AND post-gap >
+0.002 with copy > 0). Fixtures 7/7 green pre-run (zero worlds);
triage full pipeline on throwaway 490280–490288 (digests move + 12
births + 12/12 birth-exact + pre 0.0051 → post 0.0074) BEFORE bank
mint. Bank 474739–474756 minted post-triage, verified clean. Single
attempt (22 runs), as measured. No rescoring.

## Results (pairs 474739, 474748; pooled macro-average per frozen rule)
A-content PASSES both; skill genuine. Colonies birth 41+39 pooled
(frozen newborns birth fine); matched groups 19/19 per history.
- Birth (pre-B) probe: copy 0.0078 vs naive 0.0002 → pre-gap +0.0076
  (the transmitted gap, read before any offspring learning — large,
  positive, both pairs).
- Post-B probe: copy 0.0081 vs naive −0.0011 → post-gap +0.0092.
- Retention fraction 1.2 > 0.5 AND post-gap > edge AND copy > 0 →
  **GO** (`GEN1-CARRY4-GO-V1`).
- Per-seed: 474739 pre +0.0075 → post +0.0070 (fraction 0.93);
  474748 pre +0.0079 → post +0.0114 (fraction 1.44). Both pairs
  retain ≥93%; B-learning drives naive NEGATIVE on both pairs
  (−0.0004→−0.0010; +0.0007→−0.0012) while copy holds or grows.

## Reading
The distinct task does not touch the transmitted skill — it attacks
the naive. B with learning on is itself an interfering experience:
offspring starting from init finish it foraging net-negative on A,
while offspring starting from birth-copies hold their readout and
extend it. Retention over 100% pooled is not a paradox but a
double effect (copy robust + naive damaged). This resolves carry3's
void mechanically: the gap was always there at birth; colony life,
not B, was the equalizer. Line closed as scored. No further claim.

## Preservation
`evidence/gen1-carry4-dev/fresh-42/` (bank, now spent) +
`evidence/gen1-carry4-dev/attempt-01/` (untracked raw evidence, ~1.3M,
22 rows).
