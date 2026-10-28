# Physical projection drift diagnosis

The factual census in `STEERING_PROJECTION_DRIFT_PLAN.md` evaluates each arm's
B, C and D saved steering models on that arm's recorded transfer-current
features. Rates below are unweighted means of the eight per-history rates,
restricted to decisions with an available steering alternative.

| Contrast | Control mean absolute advantage drift | Project drift | Control decision disagreement | Project disagreement |
| --- | ---: | ---: | ---: | ---: |
| C vs B | 0.000683 | 0.000222 | 15.64% | 20.62% |
| D vs C | 0.004693 | 0.003216 | 38.72% | 43.01% |
| D vs B | 0.004554 | 0.003237 | 42.51% | 42.66% |

The project arm exhibits smaller numerical B-to-C drift on its own observed
inputs, consistent with its offline proxy, but its B/C greedy choices still
differ frequently. In both arms the larger numerical drift and many decision
differences appear from C to D. The arms have different bodies and histories;
their rates are not paired causal estimates of projection's effect.

For all D survivors, the absent-cue bank is unchanged from B to C but changes
from C to D: 60/60 control and 63/63 project. Shared weights also change in all
these C-to-D comparisons. The projection only modifies shared updates; it does
not protect the absent bank. These facts motivate a component intervention,
but do not identify which changed component causes the transfer outcome.

On the project arm's own transfer worlds, its current policy records on
average +0.155427 intake and +0.201780 physical cost per founder versus the
cheap native control, alongside -0.098036 budget-adjusted energy. These are
whole-trajectory contrasts, not a causal decomposition of computation and
metabolism; deaths and differing trajectories can also affect endpoints.

Evidence: `evidence/steering-projection-drift/20261026-v1`. An independent
checker recomputes frozen-model arithmetic and endpoint summaries across
30,935 decisions, including 25,129 available decisions, and verifies recorded
trace and checkpoint hashes. A separate checkpoint comparison records bank
changes. Neither establishes counterfactual physical performance, full
low-level energy adequacy or qualification.

Next run a paid frozen 2-by-2 C/D shared-weight and C/D absent-bank crossover
on the same project D worlds and original transfer seeds, retaining equal D
taste and motor models and charging all copies. Measure energy, intake and
survival, including interaction. This can test the components' total-world
effects before designing a new phase-blind learner; it must not promote a
post-hoc checkpoint or open a closed reserve.
