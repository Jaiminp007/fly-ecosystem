# GEN1-MUT2 V1 verdict (2026-11-04) — GO (0.05 noise preserves the edge; cost 0.0004)

## Authorization
User-authorized single bounded run (disk floor 1 GB; ~1.4G before,
1G after — floor respected, no further runs until space recovers;
output ~1.3M). Frozen plan `docs/GEN1_MUT2_PLAN_V1.md` (three birth
arms at 0.05; GO iff mut−naive > +0.002 and mut > 0). Fixtures 7/7
green pre-run (zero worlds; stale-constant repairs disclosed); triage
train + three frozen colonies + extract + probes on throwaway
490379–490387 (digests move + 16/17 births + mut digest ≠ exact +
probes at 0.0071/0.0072) BEFORE bank mint. Bank
474937–474954 minted post-triage, verified clean. Single attempt (18
runs), as measured. No rescoring. Not a re-run at 0.01 (different
dose) and not a mate-lineage re-run (no lineage tracking).

## Results (pairs 474937, 474946; pooled macro-average per frozen rule)
A-content PASSES both; skill genuine. Colonies birth 29+34+33 pooled;
matched groups 11/18 per history. All 18 runs complete.
- Birth probes: copy 0.0084 vs mut 0.0080 vs naive 0.0.
- Mut−naive gap +0.0081 > +0.002 and mut > 0 → **GO**
  (`GEN1-MUT2-GO-V1`).
- Mutation cost (copy−mut): +0.0004 pooled — dust-level. Per-seed:
  474937 copy 0.0062 vs mut 0.0062 (EXACT TIE) vs naive −0.0057
  (gap +0.0119); 474946 copy 0.0105 vs mut 0.0099 vs naive 0.0056
  (gap +0.0043, cost 0.0006). 5× the noise, same verdict, both pairs.

## Reading
The lineage-world dose does not break transmission: at 0.05 Gaussian
per weight — five times the mut-V1 load — mutated offspring still
carry the full edge (gap +0.0081 vs +0.0089 at 0.01; cost +0.0004 vs
−0.0002, both dust). One pair ties exact to the fourth decimal. The
dose-response is flat across a 5× range: naturalistic mutation is
not the fragility point of inheritance. (Disk reached the 1G floor
during this run — per standing orders, no further worlds until space
recovers.) Line closed as scored. No further claim.

## Preservation
`evidence/gen1-mut2-dev/fresh-53/` (bank, now spent) +
`evidence/gen1-mut2-dev/attempt-01/` (untracked raw evidence, ~1.3M,
18 rows with tn=0.05 provenance).
