# Factual B-update source decomposition

The predeclared `CONTACT_B_UPDATE_SOURCES_PLAN.md` reconstructs the actual B
updates from own decisions and observed food signals, including the learner's
reservoir draws. Each number is the mean per body of the change in logit,
averaged across all four A cue vectors. A negative logit change reduces the
acceptance prediction on average; without cue-specific outcomes it is not
evidence that physical A performance improved or worsened.

| Arm / body group | Source | Updates | Mean shared-logit change | Mean A-residual change |
| --- | --- | ---: | ---: | ---: |
| Shadow / D survivors (62) | Current B examples | 5,474 | +0.014112 | 0 |
| Shadow / D survivors | A-history replay | 1,357 | -0.061515 | +0.004626 |
| Shadow / D survivors | B-history replay | 4,117 | +0.009582 | 0 |
| Stop / D survivors (70) | Current B examples | 16,504 | +0.015983 | 0 |
| Stop / D survivors | A-history replay | 3,959 | -0.130809 | +0.007539 |
| Stop / D survivors | B-history replay | 12,545 | +0.011233 | 0 |

The reconstructed A-replay updates account for the largest negative average
shared-logit contribution in both survivor groups. The current and B-replay
residual contributions to A cues are zero in this run because the A and B
cue sets are disjoint. These are **actual sequential increments**, not the
effect of removing A replay: gradients, sampling and later states depend on
earlier updates. Averages also mask cue-specific signs and survivor selection.
The full evidence includes all B entrants, including those who died; stop and
shadow worlds differ and their survivor groups are not paired individuals.

Evidence: `evidence/contact-b-update-sources/20261026-v1`. The reconstruction
matches every saved B-final taste state and source sums. A separate checker
uses the captured learner with independently calculated first-update increments,
verifies 49,549 examples, 196,092 own decisions, source hashes and aggregation.
This is neither an independent physical simulation nor a counterfactual,
fresh qualification, or a low-level energy audit.

Next relate cue-specific actual A-probe decisions and own food outcomes to
the reconstructed changes, without feeding diagnostic labels to a learner.
Use this to choose a predeclared causal intervention, not to tune on these
outcome-selected histories or replace the original qualification gates.
