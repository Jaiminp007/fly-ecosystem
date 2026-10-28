# Replay transfer policy census

This post-outcome census reconstructs each frozen current and reset decision
from the saved own weights and the actual inputs recorded in their separate
transfer trajectories. It verifies common physical starts, odor-free routing,
acceptance, action predictions and trace hashes. It does not feed any
counterfactual outcomes into a learner or establish causal effects.

All 16,269 replay-current transfer decisions use full speed and accept food;
5,614 choose the learned midpoint steering. For the same recorded current
inputs, the zero-weight reset law also chooses full speed but always chooses
native steering. Its own separate reset trajectory contains 16,269 full-speed
decisions and no midpoint choices. Thus the current/reset behavioral
distinction on the replay-current observations is steering, not speed or
feeding. Different storage and execution charges also remain relevant.

The original steering arm similarly executes full speed on all 15,814 current
transfer decisions and chooses midpoint 5,657 times; its reset trajectory
contains 15,615 full-speed decisions and no midpoint choices. The populations,
trajectories and death histories differ, so cross-arm action totals and raw
intake/cost totals are not paired individual causal estimates. The replay
candidate's outcome remains +0.115262/founder against reset with only 4/8
positive histories and -0.069508 against cheap native-full, also 4/8 positive.
No change to the failed gate follows.

The complete per-history census, input hashes and source-hashed checker are
in `evidence/steering-replay-development/20261026-v1/transfer-policy-census.json`
and `scripts/census-replay-transfer-policy.mjs`. The next useful question is
whether observed steering decisions carry sufficient factual information to
predict their own future net return across varying local geometry, including
uncertainty and interaction effects. Any prospective predictor must be trained
only on actual own transitions, tested across held-out histories before new
control outcomes, and charged for features, memory and work. Do not infer that
steering alone caused the world-level deficit or select a threshold from these
outcomes. Fresh qualification and functional-pressure requirements remain open.
