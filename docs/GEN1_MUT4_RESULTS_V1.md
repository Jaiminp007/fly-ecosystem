# GEN1-MUT4 V1 verdict (2026-11-04) — GO (mut fraction 1.05; both pairs ≥0.9)

## Authorization
User-authorized single bounded replication run (disk floor 1 GB; ~17G
before and after; output ~1.4M). Frozen plan `docs/GEN1_MUT4_PLAN_V1.md`
(identical mut-gauntlet + gates/bar). Fixtures 7/7 green pre-run (zero
worlds); triage full pipeline on throwaway 490397–490405 (digests move
+ 24 births + BC full 1024 + pre +0.0090 → post +0.0097) BEFORE bank
mint. Bank 474973–474990 minted post-triage, verified clean. Single
attempt (30 runs), as measured. No rescoring.

## Results (pairs 474973, 474982; pooled macro-average per frozen rule)
A-content PASSES both; skill genuine. Colonies birth 33+34+31 pooled;
matched groups 16/15 per arm per history. All 30 runs complete.
- Birth probes: copy 0.0108 vs mut 0.0109 vs naive 0.0044.
- Post-BC probes: copy 0.0103 vs mut 0.0117 vs naive 0.0048.
- Mut fraction 1.05 > 0.5 AND mut post-gap +0.0069 > edge AND mut >
  0 → **GO** (`GEN1-MUT4-GO-V1`). Copy fraction 0.86 descriptive.
- Per-seed mut: 474973 pre +0.0038 → post +0.0035 (fraction 0.92);
  474982 pre +0.0092 → post +0.0102 (fraction 1.11). Both pairs
  independently ≥0.9 — cleaner than mut3's split (0.49/0.79).
  Copy fractions 0.71/0.90 (exact copies also hold, as in erode2/3).

## Reading
The mutated gauntlet result replicates and strengthens: fractions
0.62 and 1.05, post-gaps +0.0077 and +0.0069, mut arm above bar on
both banks. This bank's split does not reproduce mut3's (no
near-void pair here — both ≥0.9); the pair-level fragility seen in
mut3 looks bank-conditional while the pooled majority replicates.
Copy stays the constant (1.13, 0.86 — exact transmission through
foreign tasks, again). Two banks agree: natural mutation at lineage
dose passes the gauntlet by majority. Line closed as scored. No
further claim.

## Preservation
`evidence/gen1-mut4-dev/fresh-55/` (bank, now spent) +
`evidence/gen1-mut4-dev/attempt-01/` (untracked raw evidence, ~1.4M,
30 rows with tn=0.05 provenance).
