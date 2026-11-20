# GEN1-MUTHOME V1 verdict (2026-11-04) — GO (mut fraction 0.72; post-gap clears by dust)

## Authorization
User-authorized single bounded run (disk floor 1 GB; ~16G before and
after; output ~1.4M). Frozen plan `docs/GEN1_MUTHOME_PLAN_V1.md`
(mut gauntlet + return; GO iff mut post-gap > +0.002 and mutPost > 0
and mutFrac > 0.5). Fixtures 7/7 green pre-run (zero worlds; stale
asserts repaired with disclosure); triage full pipeline on throwaway
490406–490414 (digests move + 11 births + BCR full 1280 + pre +0.0028
→ post +0.0024) BEFORE bank mint. Bank 474991–475008 minted
post-triage, verified clean. Single attempt (30 runs), as measured.
No rescoring. Not a home re-run (mut arm scored) and not a third
immediate post-task probe (return-practice first).

## Results (pairs 474991, 475000; pooled macro-average per frozen rule)
A-content PASSES both; skill genuine. Colonies birth 33+38+28 pooled;
matched groups 8/20 per history. All 30 runs complete; BCR survival
0.4–1.0 (harsh middle tasks, disclosed).
- Birth probes: copy 0.0062 vs mut 0.0051 vs naive 0.0023.
- Post-BCR probes: copy 0.0063 vs mut 0.0053 vs naive 0.0033.
- Mut fraction 0.72 > 0.5 AND mut post-gap +0.0020 > +0.002 AND mut
  > 0 → **GO** (`GEN1-MUTHOME-GO-V1`) — by dust on the post-gap
  (+0.0000 over bar at 4dp; float-held).
- Copy fraction 0.8 descriptive (exact copies lose a fifth through
  gauntlet + return here vs holding flat in mut3 — bank-conditional).
- Per-seed mut: 474991 pre +0.0049 → post +0.0039 (fraction 0.80);
  475000 pre +0.0007 → post +0.0002 (fraction 0.29 — thin pair near
  the floor). Pair 1 carries; pair 2 is noise-grade.

## Reading
The mutated edge survives gauntlet + return pooled (0.72), but this
is the thinnest GO in the family: the post-gap clears the bar by
float dust, one pair is noise-grade, and the exact copies (0.8) also
erode here — unlike mut3, where copies held at 1.13. Return-practice
taxes mutated inheritance harder than exact (naive catch up
differentially against the noisier start). The verdict holds per the
frozen bar, stated at full thinness: GO, barely, pooled, carried by
one pair. Line closed as scored. No further claim.

## Preservation
`evidence/gen1-muthome-dev/fresh-56/` (bank, now spent) +
`evidence/gen1-muthome-dev/attempt-01/` (untracked raw evidence,
~1.4M, 30 rows with tn=0.05 + BCR provenance).
