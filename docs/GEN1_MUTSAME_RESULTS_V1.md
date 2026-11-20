# GEN1-MUTSAME V1 verdict (2026-11-04) — NOGO (shared colony is a near-extinction floor; intake edge persists, survival contrast crushed)

## Authorization
User-authorized single bounded run (disk floor 1 GB; ~29G before and
after; output ~1.2M). Frozen plan `docs/GEN1_MUTSAME_PLAN_V1.md`
(shared-colony fate; GO iff mut−naive survival > +0.10 AND intake >
+0.002). Fixtures 7/7 green pre-run (zero worlds; one stale births
assert repaired with disclosure); triage full pipeline on throwaway
490424–490432 (digests move + 13 births + shared colony completes
13/13/13 with finite per-side stats) BEFORE bank mint. Bank
475027–475044 minted post-triage, verified clean (`475027`,
`475036` heads). Single attempt (10 runs), as measured. No
rescoring. Not a re-run of gen1-heir (separate colonies, exact-copy
scored) and not a third muthome (no tasks, no return).

## Results (pairs 475027, 475036; pooled macro-average per frozen rule)
A-content PASSES both; skill genuine. Birth colonies yield 15+17=32
pooled offspring. All 10 runs complete; birth-Col survival 0.21/0.13.
- Shared colony (45+51 placed, matched 1792, frozen birth weights):
  copy surv 0.033 / intake 0.0016; mut surv 0.029 / intake 0.0018;
  naive surv 0.000 / intake −0.0017 (all per-tick).
- Mut survival gap +0.029 < +0.10 AND mut intake gap +0.0035 >
  +0.002 → survival leg fails → **NOGO**
  (`GEN1-MUTSAME-NOGO-V1`). Copy descriptive only.
- Per-seed: 475027 mut surv 0.000 vs naive 0.000 (gap 0.0), intake
  +0.0035; 475036 mut surv 0.059 vs naive 0.000 (gap +0.059),
  intake +0.0035. Intake edge clears both pairs; survival contrast
  is a floor effect — the shared world kills ~98% of everyone
  (survival 0.022/0.020), so there is almost no survival left to
  differentiate. Naive intake is net-negative both pairs (−0.0016,
  −0.0018) while mut stays positive (+0.0019, +0.0017): the birth
  intake edge persists in the shared colony, it just does not
  convert to lives on this bank.

## Reading
The birth edge is real in flow terms (mut out-eats naive by
+0.0035/tick pooled, both pairs, sharing one world with no
immersion) but it does not buy survival here: the shared colony is
so harsh that placement-level differences drown in colony-level
mortality. This is the same lesson as DENSITY/LOSER at a smaller
scale — when the world kills 98%, who eats +0.003 more per tick
barely matters. A kinder shared world might show the survival leg;
this bank does not, and the bar held. Neither a return-gap claim
(MUTHOME2) nor a shared-fate survival claim is licensed. The intake
edge survives every shared-world test so far (birth probes, shared
colony); the survival edge survives none (shared colony, return).
Line closed as scored.

## Preservation
`evidence/gen1-mutsame-dev/fresh-58/` (bank, now spent) +
`evidence/gen1-mutsame-dev/attempt-01/` (untracked raw evidence,
~1.2M, 10 rows with sideIds + tn=0.05 provenance).
