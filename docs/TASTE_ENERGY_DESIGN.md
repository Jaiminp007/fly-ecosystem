# Fixed prospective taste and energy learner

This fixes one human-proposed mechanism before any performance histories. It
does not revise a failed protocol, establish qualification or count as an
autonomous algorithm revision. The previous direct-value bank and its 16-history
reserve remain closed. Software and artificial schedules cannot establish the
scientific claims below.

The user's subsequent [development workflow](DEVELOPMENT_WORKFLOW.md) authorizes
iterative exploratory implementation and development runs with brief checks.
The qualification preflight described below applies to a future scientific
qualification claim; it does not prevent that explicitly labeled development.

The mechanism separates two learned predictions. A logistic odor model learns
the sign of the body's own nonzero intake sensation after a stationary accepting
action at a sensed local patch. A separate binary actor-critic learns whether
to cruise or remain stationary from the body's actual budget-adjusted energy
returns. The existing four motor actions and steering primitive are retained.
Feeding is sampled every tick; the movement bit is held for 16 ticks. This is a
new action-assignment/credit bundle, not a pure change of one learning rate.

## Lawful observations and feedback

Each choice receives raw engine sensors, four odor signs, a local-contact bit
and an odor-present bit. A new local query must expose only the nearest odor
within radius 15 and its presence, irrespective of resource amount, with the
original odor fallback outside contact. Ties retain first patch order. Query
work and all stored bits are physically billed. No amount, patch ID, valence,
task identity, future label or another body's experience enters learning.

Observe receives own energy minus outstanding debt, actual signed `lastFood`
and terminal status. Immediate post-action access to that existing bodily
sensor is an explicit feedback-timing intervention. Only stationary acceptance
with a local pre-action contact and nonzero sensation creates an odor example.
It is an association with net experienced intake, not a guaranteed label of a
single patch in supported mixed-contact worlds. The source cue/tick is retained
through a regime boundary. Movement examples are not assigned their old cue.

An identity-blind control keeps contact and odor-presence bits but masks all
odor coordinates. Its taste model sees a constant feature, not hidden identity.
Thus masking does not invoke the naturally absent-odor fallback. Naturally
absent odor uses an innate always-accept feeding rule in all learned versions,
including reset. This disclosed scaffold is not credited to learning, and the
original-ecology transfer comparison against always-accept cruise remains
mandatory. Transfer superiority must come from acquired movement behavior.

## Taste prediction and bounded factual replay

Use eleven features: one constant, four odor signs and six distinct pairwise
products, divided by sqrt(11). This partial quadratic map has shared parameters;
it deliberately does not allocate an independent exact-identity table. Eleven
zero-initialized learned weights predict `sigmoid(log(3) + w dot phi)`. The
positive prior is innate and shared by reset. The actual feeding probability
is `.05 + .9*p`, except the absent-odor rule above. A fresh private draw samples
feeding on every choice.

A qualified stationary sensation supplies target one for positive and zero for
negative. Apply logistic stochastic-gradient update `.1*(target-p)*phi`, clipping
each learned weight to [-8,8]. No energy normalization or latent valence label
is substituted for the experienced sign. Zero sensations are not positive or
negative examples. Keep eight recent examples and a 24-slot unbiased reservoir
over displaced examples, using an independent retention stream. One uniformly
sampled replay update follows each new live taste example and each completed
movement-learning interval when memory is nonempty. Replay uses current weights,
the same rate and stored own factual labels. No task/reward prioritization.

Capacity displacement and shared parameters do not prove functional pressure.
A fresh study must still demonstrate useful A/B skills, actual A impairment
after B training, a physical intake contrast and final separate 95% retention.
It may fail those requirements even if this component fits taste observations.

## Movement actor-critic and own energy credit

Sixteen motor features are `[1, .25*raw[0..13], .25*contactPresent]`. They omit
the external sine/cosine clock and never include a phase label. Separate
zero-initialized 16-weight actor and critic rows use this same feature vector.
Cruise probability is `.05+.9*sigmoid(log(3)+actor dot x)`. A separate private
draw samples cruise at the first choice and every 16 actual actions thereafter.
Holding movement does not hold steering or feeding.

The pending interval retains initial own energy, source feature, sampled bit
and its exact base/mixed probability. It matures before the next movement draw;
a terminal observation closes an incomplete interval immediately. Reward is
`(finalOwnEnergy-initialOwnEnergy)/120`, including the recorded terminal loss
and carried debt. No terminal is invented at a surviving boundary or final stop.
Bootstrap is current critic value, zero for a terminal. Discount and trace decay
are `.95^(duration/16)` and `(.95*.9)^(duration/16)` respectively.

Let delta be reward plus discounted next value minus current critic prediction
at the source feature. Maintain delta-square EMA `.96875*old+.03125*delta^2`.
The actor's advantage is `clip(delta/max(1e-6,sqrt(EMA)),-4,4)`. This adapts actor
step scale using only experienced errors; it does not change endpoint utility,
erase terminal costs or provide a favorable outcome label. The explicit
normalization-off control uses raw delta and does not compute/update that EMA.

For base cruise probability q and mixed probability pi, the actor score factor
is `.9*q*(1-q)/pi` after cruise and `-.9*q*(1-q)/(1-pi)` after stationary. Actor
eligibility receives factor*x; critic eligibility receives x. Both old traces
decay by the duration-adjusted factor above. Apply `.05*advantage*actorTrace`
and `.1*delta*criticTrace`, clipping weights to [-8,8]. Critic reward stays in
the original own-energy units; the actor does not infer advantage from labels.

## State, freeze/reset and honest accounting

The 43 learned parameters are taste11, actor16 and critic16. Keep bounded own
taste memory, motor traces, pending own interval, movement hold state and four
independent PRNG streams (feeding, movement, retention and replay). Saved learned
versions must include all three weight rows. Freeze disables both acquisitions,
clears unfinished learning intervals/traces and retains actual acquired weights.
Reset zeros all learned rows, clears acquired memory/traces/holding and pending
state, and preserves lifetime counters, RNGs and every charge/debt/payment.
All learned probe versions must apply identical inference compaction.

Every arithmetic, transcendental and policy/sampling comparison is metered,
including auxiliary learning, normalization, reservoir/replay and terminal work.
Array allocation, copying, counters, indexing, validation and control-flow
bookkeeping retain the existing declared abstract convention. Canonical bytes
price actual complete state, not merely the number of taste records. Original
per-operation and byte-time prices are retained. Work after a terminal feedback
remains debt even if no body can pay. Update work is charged when performed;
no learner pretends its own not-yet-performed calculation was an earlier reward.

No integrated candidate is authorized for performance until complete source-
bound independent arithmetic, lifecycle/cost/corruption checks, full-world
integration/replay, matched controls and prospective inference pass preflight.
The old method's inapplicable lambda ablation cannot be copied as an identical
new arm: the new mechanism requires explicit taste-learning and actor-scaling
ablations, while retaining meaningful prior-method references. All goal-level
energy, survival, acquisition, retention, pressure and transfer obligations stay.
The exact new family, multiplicity, fresh exclusions and budgets must be fixed
before outcomes; failed banks cannot become development input for tuning.

## Exploratory greedy-feeding revision

The user authorized iterative development after the original fixed-core design.
The first full eight-history development run produced small whole-sequence gains
but weak final retained-skill probes and substantial mortality. A concrete
selection-rule hypothesis is that probability matching wastes learned class
information: it continues sampling likely-harmful food in proportion to predicted
positive-class probability. The new `feedingRule: greedy` option instead feeds
with probability .95 when predicted positive probability is at least .5 and .05
otherwise. Naturally absent odor still invokes the disclosed always-accept rule.
The original `matching` rule remains the default and all original attempts are
preserved. This is exploratory human-led method development, not a fresh
qualification result or an autonomous learning-algorithm revision.
