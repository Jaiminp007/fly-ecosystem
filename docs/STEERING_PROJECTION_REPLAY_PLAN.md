# Own-transition steering projection screen

Use the eight reused shared-plus-cue histories and select only D survivors.
Warm the projection's per-action means using those bodies' actual A/B executed
steering actions and features, excluding each B checkpoint's pending decision.
Start two copies of each body's saved B steering weights and pending decision.
Replay the recorded C decisions with their actual cues, energy, features,
availability and executed actions. The baseline reconstructs the original
SARSA updates; the candidate projects only the shared increment, and updates
the context bank normally. Both use the same recorded trajectories. Verify
baseline C weights and recorded per-decision predictions exactly within
floating tolerance. No counterfactual reward or action is invented.

On the two existing B-steering and C-steering transfer traces, evaluate both
post-C models and the B reference on each recorded own feature vector in the
absent route. Compare mean absolute drift of action-value difference from B,
per history, and compare C factual online squared TD error. Count action support
and declared extra work/storage. A fixed screen requires lower drift in at
least six of eight histories on each trace and no higher squared TD error in
at least six histories; missing data fails. These are diagnostic proxies, not
physical performance or qualification. The candidate has not actually lived
these trajectories, extra energy is not charged to the recorded bodies, and
the survivor-selected reused corpus cannot establish generalization.
