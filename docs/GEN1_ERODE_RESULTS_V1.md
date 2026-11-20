# GEN1-ERODE V1 verdict (2026-11-04) — NOGO (colony life erases 89% of the birth gap)

## Authorization
User-authorized single bounded run (disk floor 1 GB; ~2G before and
after per user-trusted reading; output ~1.3M). Frozen plan
`docs/GEN1_ERODE_PLAN_V1.md` (birth-capture + same-survivor pre/post
probes, no B task; GO iff fraction > 0.5 AND post-gap > +0.002 with
copy > 0). Fixtures 7/7 green pre-run (zero worlds; one zero-world
repair: birth-capture moved to earliest-learner-tick after proving
engine creates learners a tick after flies appear — disclosed, ≤1
update dust, triage-verified 2/5 byte-exact). Triage train + learning
colony + pre/post probes on throwaway 490316–490324 (digests move +
12 births + 5 survivors + both probes complete at 0.0066/0.0075)
BEFORE bank mint. Bank 474811–474828 minted post-triage, verified
clean. Single attempt (18 runs), as measured. No rescoring. Not a
carry3 re-run (birth probe + same-offspring post probe + ratio) and
not a third birth-then-B probe (no B task).

## Results (pairs 474811, 474820; pooled macro-average per frozen rule)
A-content PASSES both; skill genuine. Colonies birth 19+25 pooled;
same-survivor groups 7/5 and 3/3 (matched individuals both ends).
All 18 runs complete.
- Birth probe: copy 0.0125 vs naive −0.0079 → pre-gap +0.0204 (the
  largest birth gap scored in the heir/carry family).
- Post-colony probe: copy 0.0136 vs naive +0.0113 → post-gap +0.0023
  (post-gap clears +0.002 and copy > 0, but...).
- Retention fraction 0.11 < 0.5 → **NOGO** (`GEN1-ERODE-NOGO-V1`) —
  colony life erases 89% of the birth gap.
- Per-seed: 474811 pre +0.0182 → post +0.0041 (fraction 0.23);
  474820 pre +0.0226 → post +0.0006 (fraction 0.03). Both pairs
  erase ≥77%. Naive learn A by living in it (−0.006→+0.013;
  −0.010→+0.009); copy holds steady (0.012→0.017; 0.013→0.010).

## Reading
Carry3's void now has a number and a mechanism, measured on the same
offspring: the birth advantage is real and large (+0.0204, the
biggest yet), and ordinary colony life — no distinct task, just
living and foraging in the birth world with learning on — teaches
the naive almost everything the copies were born with. The remnant
(+0.0023) still clears the residual bar, but the fraction bar holds:
inheritance buys a head-start that a single lifetime of ordinary
experience nearly closes. Against carry4/5 (B leaves the gap):
interference from a distinct task preserves; immersion in the same
task dissolves. Line closed as scored. No further claim.

## Preservation
`evidence/gen1-erode-dev/fresh-46/` (bank, now spent) +
`evidence/gen1-erode-dev/attempt-01/` (untracked raw evidence, ~1.3M,
18 rows with birth-capture/survivor provenance).
