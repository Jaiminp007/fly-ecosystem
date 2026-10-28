# Fixed steering geometry information test

The replay transfer census identifies steering as the recorded current/reset
action difference, but does not establish its causal effect. Before another
policy revision, test one fixed state-sufficiency hypothesis on the eight
already reused histories, with no closed reserves. Each founder receives its
own separate predictors trained only on its own factual replay-arm A and B
acquisition decisions. No labels, observations or parameters are shared
between founders or histories. The eight histories are independent held-out
evaluation cases for this fixed feature hypothesis; they are not fresh
qualification histories. Freeze at B and evaluate C and the current transfer
fork separately without fitting either evaluation stream.

The target is the next own pre-decision budget energy change divided by 120,
or the terminal own observation at death. Drop the final nonterminal pending
transition at each tape boundary; never bridge unobserved phase/fork edges.
Only the executed steering action receives a label. These are factual
one-step predictions, not unobserved outcomes for alternative actions or
estimates of long-horizon steering value.

The three fixed linear two-action models start at zero and share the same
eight recorded steering features. `geometry` appends three current observable
recommendation quantities: `tanh(score)`, clipped forward/100 and clipped
lateral/100. `delayed` appends the same quantities from the previous factual
decision of that body; its initial context is zero and transfer restores the
actual A/B history state, never the C evaluation state. `base` adds none.
Each transition applies normalized SGD, rate 0.1, denominator
`1 + sum(feature^2)`, and weights clipped to [-8,8]. No replay, feature search,
rate sweep or evaluation adaptation. Geometry is available before the action;
no hidden patch state, outcome, timer or fork label enters a feature.

The fixed descriptive gate requires geometry to have lower equally weighted
mean per-history MSE and
at least 6/8 lower per-history MSE against both base and delayed, separately
in C and transfer. Missing histories fail. Report action counts, censoring,
per-history MSE and unpooled per-founder training support. Capture inputs,
sources, prediction records and hashes; independently reconstruct training,
evaluation and frozen states. This offline test does not incur physical costs
or demonstrate affordable control, functional pressure or qualification. Even
if it passes, an embodied prospective test must pay all features, learning,
state, terminal work and debt against unchanged strong controls.
