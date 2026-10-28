# Steering projection factual replay

The fixed screen in `STEERING_PROJECTION_REPLAY_PLAN.md` passes on eight
reused development histories. B-to-C updates are replayed from recorded own
transitions for 62 eventual D survivors; executed actions and trajectories
are held fixed. The unmodified replay reproduces saved C weights and recorded
predictions. The prototype's means are warmed on factual A/B action features,
excluding the pending B decision until its update in C.

| Recorded transfer feature set | Mean baseline advantage drift | Mean projected drift | Histories improved |
| --- | ---: | ---: | ---: |
| B-steering trace | 0.000804612 | 0.000249968 | 8/8 |
| C-steering trace | 0.000772156 | 0.000257130 | 8/8 |

The projected replay also has lower mean squared factual online TD error in
8/8 histories. Warm-up includes 40,361 action-0 and 23,065 action-1 factual
examples. These quantities are proxies: drift is change in predicted action
advantage relative to B, not retention of physical energy or survival; TD
error uses bootstrapped estimates on the recorded baseline trajectory.

An independent implementation of projection and encoding reconstructs all
31,744 C updates, stored summaries and trace hashes. It shares the experiment's
replay structure and does not independently simulate physics. Evidence is in
`evidence/steering-projection-replay/20261026-v1`; the runner captures its
sources and verifies acquisition and transfer tapes against their stored
hashes. The corpus is outcome-selected, reused and not fresh qualification.

The prototype's accumulated declared 12,182,876 operations include mean
warm-up and C updates across survivors, and its final encoded states total
16,244 bytes; neither has been charged to a physical body. The counterfactual
learner did not generate the recorded states or rewards, and no alternative
action, additional energy expense, reset or terminal effects are simulated.
There is consequently no evidence yet that projection improves a real learner,
retains B under pressure, or beats paid and cheap transfer controls.

Next integrate this as an opt-in physical steering learner with actual pending
own-action credit and matched controls, independently audit all storage,
initialization, per-step, terminal, freeze, reset and snapshot charges, and
run the unchanged original developmental gates. Do not treat this offline
screen as a pass of those gates or open a closed qualification reserve.
