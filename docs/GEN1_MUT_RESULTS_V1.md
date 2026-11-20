# GEN1-MUT V1 verdict (2026-11-04) — GO (natural mutation preserves the full edge)

## Authorization
User-authorized single bounded run (disk floor 1 GB; ~2G before and
after per user-trusted reading; output ~1.3M). Frozen plan
`docs/GEN1_MUT_PLAN_V1.md` (three birth arms, a-priori noise 0.01;
GO iff mut−naive > +0.002 and mut > 0). Fixtures 7/7 green pre-run
(zero worlds); triage train + three frozen colonies + extract +
probes on throwaway 490370–490378 (digests move + 10/10 births + mut
digest ≠ exact + probes at 0.0097/0.0092) BEFORE bank mint. Bank
474919–474936 minted post-triage, verified clean. Single attempt (18
runs), as measured. No rescoring. Not an heir re-run (mutated arm is
new) and not a cue re-run (no relabel).

## Results (pairs 474919, 474928; pooled macro-average per frozen rule)
A-content PASSES both; skill genuine. Colonies birth 52+46+45 pooled;
matched groups 25/20 per history. All 18 runs complete.
- Birth probes: copy 0.0091 vs mut 0.0093 vs naive 0.0004.
- Mut−naive gap +0.0089 > +0.002 and mut > 0 → **GO**
  (`GEN1-MUT-GO-V1`).
- Mutation cost (copy−mut): −0.0002 pooled — zero to slightly
  negative. Per-seed: 474919 mut +0.0038 over naive (0.0060 vs
  0.0022, copy 0.0059); 474928 mut +0.0140 over naive (0.0125 vs
  −0.0015, copy 0.0124). Mut tracks copy within 0.0001 both pairs.

## Reading
The experimenter paste is not load-bearing: the engine's own
mutated offspring (maternal + 0.01 Gaussian per weight) carry the
full transmitted edge, indistinguishable from exact copies on both
pairs and well above naive on both. A point-mutation load at this
scale is free — the inherited skill sits in a flat enough region
that per-weight jitter does not dislodge it. This answers the last
standing objection to the heir/carry family (paste artifacts): with
naturalistic transmission the benefit persists undiminished. Line
closed as scored. No further claim.

## Preservation
`evidence/gen1-mut-dev/fresh-52/` (bank, now spent) +
`evidence/gen1-mut-dev/attempt-01/` (untracked raw evidence, ~1.3M,
18 rows with tn provenance per colony row).
