# Own-history steering projection prototype

The B/C checkpoint diagnostic identifies drift in shared steering weights while
the absent-cue bank remains unchanged. Test a phase-blind candidate that keeps
an online mean of each action's own previously executed feature vectors. Before
applying a shared update for that action, project its proposed increment onto
the subspace orthogonal to that action's prior mean; then incorporate the
current factual vector in the mean. The first sample uses the unmodified update.
This protects only a mean linear prediction before weight clipping, not every
past decision, return, context or skill. It may suppress useful transfer or
learning; no improvement is assumed.

The standalone prototype must not access phase labels, counterfactual rewards,
other bodies or hidden cues. Count all retained numeric values and conservatively
meter its arithmetic. Test no-history, nonzero and zero-mean cases, factual
per-action isolation, orthogonality, bounded-storage behavior and serialization.
It is not physically integrated, not an acquired skill demonstration, and not
a validated energy price. Before promotion, integrate storage and work billing
including reset, terminal and snapshot paths, run matched controls and own-data
independent readbacks, and test the original pressure, retention, transfer and
fresh qualification gates without opening closed reserves.
