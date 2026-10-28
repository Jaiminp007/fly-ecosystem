# Factual delayed-return diagnostic result

The fixed 16-transition census covers 260,850 actual acquisition decisions in
eight reused histories. It completes 260,370 windows, including 2,592 windows
truncated at a terminal observation; 480 unfinished nonterminal windows are
censored. An independent buffered-trajectory implementation reproduces the
counts and discounted return sums. Terminal windows overlap, so 2,592 is a
window count, not a death count.

For windows that start away from contact and do not cross a phase boundary,
mean discounted budget-energy change over the actual subsequent trajectory is:

| Phase | Initial stationary | Initial full speed | Histories where stationary mean is less negative |
| --- | ---: | ---: | ---: |
| A | -0.704 | -0.716 | 6/8 |
| B | -0.722 | -0.728 | 4/8 |
| C | -0.695 | -0.747 | 7/8 |

These windows follow whatever actions the agent actually takes after the first
decision. They do not hold speed fixed or compare alternative actions in the
same state. Different bodies, locations, future actions and deaths contribute to
each group; this is not a causal comparison. The results do not show that simply
extending the horizon to 16 will favor full speed or solve the transfer failure.
The source-known horizon was fixed before this calculation and was not swept.

Per-history bins, phase-crossing counts, terminal/censor counts, trace hashes
and the independent readback are in
`evidence/own-steering-delayed-census/20261026-v1`. The full-speed physical
intervention remains separate: it improved all seven available current transfer
forks but failed the strong-control survival comparison. The original full
retention, pressure, transfer and fresh qualification criteria remain unmet.
