# Pair-filter development census

This is an offline, outcome-informed development analysis of the existing eight
guarded tapes. It neither establishes a safe steering policy nor measures a
learned ability. Every prior survival failure and reserve restriction remains.

Consider every original pair in its original order. Skip the distance calculation
only when the absolute x separation exceeds 32, leaving a two-unit margin above
the original 30-unit radius. Otherwise perform the original midpoint ranking.
This avoids a cell index, extra retained lists and sorting, but remains quadratic.
Seven edge examples and all 38,799 recorded decisions matched the original
point, pair and score on the current Node runtime. This is not a proof for every
possible floating-point input or every JavaScript implementation.

The first implementation recomputed the x subtraction for `Math.hypot` and,
under the original scalar-operation accounting plus three filter operations per
pair, cost 130,611,796 versus 127,688,784 operations: 2,923,012 more. The
second implementation reuses the already computed absolute separation in
`Math.hypot`, requiring three additional operations for each remaining distance
check rather than four. It costs 123,137,212 operations: 4,551,572 fewer than
the original, approximately 3.56%. Savings occur in all eight recorded histories.
This second implementation was chosen after examining the first result, so this
is a development finding, not an independent pre-registered comparison.

Scripts: `scripts/check-pair-filter.mjs` and `scripts/check-pair-filter-reuse.mjs`.
Results and tape/source hashes: `evidence/guarded-overlap/20261026-v2/pair-filter-census.json`
and `evidence/guarded-overlap/20261026-v2/pair-filter-reuse-census.json`.
Both scripts ran successfully against the recorded tapes. Their results were
created after the spatial evidence archive and are not included in it.

The accounting compares recommendation operations only, using the existing
four-operation distance and nine-operation midpoint convention. It does not
establish the total paid effect or independently validate the convention, and
the extra temporary scalar's storage policy needs explicit treatment. Next,
freeze a complete algorithm and storage/work specification, audit numerical
equivalence and billing independently, then run matched paid physical trials;
do not infer survival or transfer outcomes from this static census.
