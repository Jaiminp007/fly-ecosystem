# Fixed travel-horizon information test

The one-step geometry test failed, but geometry may influence later food
contact rather than the next tick. Before another controller, test one fixed
16-step factual return on the same eight reused development histories. This
is a new hypothesis, not a sweep or an upgrade of the failed one-step result.
The engine's 0.1-second tick, founder speeds 22–34 and food-grid spacing 32
make 16 full-speed ticks roughly 35–54 distance units, before turning and
obstacles. It is a fixed physical-timescale choice, not a tuned optimum.

Use only each founder's actual replay-arm A/B trajectories for its own
two-head normalized-SGD predictors, freeze, and independently evaluate its C
and transfer trajectories. No parameter or label sharing across bodies or
histories. Compare the same base, current-geometry and delayed-geometry feature
sets and rates as the frozen one-step protocol. For each executed steering
action, label the factual change in own budget energy over the next 16 ticks,
divided by 120. If the body dies before the horizon, use its terminal budget
energy as an absorbing endpoint for all pending actions; do not fabricate
future observations. Drop unresolved nonterminal pending actions at tape
boundaries and report them. Training updates occur only when labels become
available; a model cannot use a future label before its factual endpoint.

The return includes intervening own actions, other bodies and changing food;
it is not an isolated action effect, counterfactual value or policy outcome.
Report terminal and tape-boundary censoring, per-action support and per-history
MSE. The fixed gate requires lower mean per-history MSE and at least 6/8 wins
against both base and delayed in both C and transfer. No evaluation training,
threshold tuning, reserve use, physical cost or qualification claim follows.
