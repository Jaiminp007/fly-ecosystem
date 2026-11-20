# GEN1-CARRY3 V1 verdict (2026-11-04) — INCOMPLETE-NOGAP (void; no inherited gap to retain)

## Authorization
User-authorized single bounded run (disk floor 1 GB; ~2G before and
after per user-trusted reading; output ~1.3M). Frozen plan
`docs/GEN1_CARRY3_PLAN_V1.md` (11 runs/history: train, skill pair,
2 colonies, pre-probes, B-trains, post-probes; GO iff retention
fraction > 0.5 AND post-gap > +0.002 with copy > 0; pre-gap ≤ 0 →
INCOMPLETE-NOGAP void). Fixtures 7/7 green pre-run (zero worlds);
triage full pipeline on throwaway 490271–490279 (digests move + 23
births + all stages complete, pre 0.0106 → post 0.0104) BEFORE bank
mint. Bank 474721–474738 minted post-triage, verified clean. Single
attempt (22 runs), as measured. No rescoring.

## Results (pairs 474721, 474730; pooled macro-average per frozen rule)
A-content PASSES both; skill genuine. Colonies birth 33+33 pooled;
matched groups 18/11 per history. All 22 runs complete, survival 1.0
on all B/probe stages.
- Pre-B probe: copy 0.0064 vs naive 0.0068 → pre-gap −0.0004 ≤ 0 →
  **INCOMPLETE-NOGAP** (`GEN1-CARRY3-INCOMPLETE-NOGAP`, void — not a
  retention failure; nothing to retain).
- Per-seed (descriptive, not scored): 474721 pre +0.0023 → post
  +0.0021 (fraction ≈ 0.91 — retention nearly complete on this pair);
  474730 pre −0.0030 → post −0.0006 (naive ahead throughout; no gap
  either side of B). Pooled post-gap +0.0008.

## Reading
The void is informative, not empty. Pre-probes measure POST-COLONY
weights (up to 1792 ticks of colony life): on this bank, naive
offspring foraged their way to parity-or-better on A before
extraction (both arms ~0.0066 pooled) — colony life equalizes what
birth differentiates, on some banks. Where a pre-gap existed (474721),
B left 91% of it in place — consistent with carry/carry2's residuals
being large fractions of small gaps rather than small fractions of
large ones. The retention question stays open (needs a bank with a
pooled pre-gap); this bank cannot ask it. Line closed as scored
(void, not a failure).

## Preservation
`evidence/gen1-carry3-dev/fresh-41/` (bank, now spent) +
`evidence/gen1-carry3-dev/attempt-01/` (untracked raw evidence, ~1.3M,
22 rows).
