# Exact overlap-index feasibility

## Correction: three-by-three indexing is not exact

An additional floating-point boundary witness disproves the original index's
general equivalence. For points `[-1e-15, 0, 10]` and `[30, 0, 10]`, the
computed separation rounds to 30, but their cell indices are -1 and 1. The
three-by-three search misses the eligible pair: exhaustive selection chooses
its midpoint with score 0.5714285714285714, while the index chooses the first
point with score 0.5. The original 85.28% avoided-check figure therefore
describes an incorrect general algorithm and must not be used for promotion.

`scripts/check-index-boundary.mjs` reproduces the discrepancy. A five-by-five
candidate neighborhood matches five boundary cases and all 38,799 recorded
guarded decisions; it visits 9,010,440 of 26,975,324 pairs, avoiding 66.60%
before index and storage overhead. The wider neighborhood is still empirical,
not a proof across arbitrary inputs. Result and input hashes are in
`evidence/guarded-overlap/20261026-v2/index-boundary-check.json`. Both the
original census and this subsequent correction are retained; neither is part
of the earlier spatial archive. Do not run a paid physical trial until the
index's floating-point domain, work, and temporary memory are fully specified.

Status: offline implementation feasibility only; no new ecological success,
acquired skill, qualification or autonomous revision.

The original fixed30-unit spatial hash enumerates neighboring cells, then sorts candidate
indices into the original first/second order before applying unchanged distance,
midpoint and strict score comparisons. Ordering preserves existing tie behavior.
No ranking, radius or guard threshold is tuned.

scripts/census-overlap-index.mjs compared complete point/pair/score results with
the original exhaustive implementation on1007 deterministic synthetic cases
(including negative coordinates, duplicate points, exact radius boundaries and
ties) and all38,799 captured guarded decisions across eight development histories.
Every comparison passed. This is empirical equivalence, not a proof for arbitrary
floating-point inputs or unobserved physical trajectories.

The tapes contain1,348,564 observed points and26,975,324 exhaustive pair checks.
The index visits3,971,047 candidate pairs, avoiding23,004,277 checks (85.28%).
At the original four operations per distance check this avoids92,017,108 counted
operations, before new index overhead. Coordinate division/floor alone requires
at least5,394,256 operations. Maps/keys, nine lookups per point, enumeration,
sorting and dynamic index memory have NOT been fully priced. These figures are
not a net energy saving or a performance qualification.

Raw result: evidence/guarded-overlap/20261026-v2/index-census.json. It contains
the script SHA-256 and input-tape SHA-256 values for reproducibility. This later
diagnostic is NOT included in the earlier389-member spatial archive; original
tapes and failed-study snapshots remain untouched.

Next: specify a fully metered, checkpoint-safe implementation, check numerical
boundary behavior and memory billing, then conduct matched paid physical replay.
Do not promote the optimization based on offline skipped work alone. Prior
guarded policy still fails its survival gate; all scientific obligations remain.
