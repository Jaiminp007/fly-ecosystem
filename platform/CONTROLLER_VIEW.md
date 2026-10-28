# Controller view contract

`platform/controller-adapter.mjs` defines the observer's versioned read shape
for compact neural controllers and the separate MaleCNS arena. Both expose an
agent identity, generation, parents, age, energy, body traits, controller size,
and the model's latest measured activity. Model-specific fields remain explicit:
the compact model exposes named abstract inputs/outputs and acquired edge deltas;
MaleCNS exposes spike/readout summaries, immutable topology, and inherited gain
alleles. Missing biological correspondences stay `null` or are omitted.

This is a view contract, not a shared neural interface or evidence that the
models are interchangeable. The current dashboards and runtimes remain separate.
The contract lets future screens share neutral identity/ancestry components
without pretending a compact edge weight equals a synapse or controller output.

The episodic actor additionally exposes bounded `episodic.lastDecision` data:

`controller.traceNormalization` is one for the opt-in exponential-average
architecture and zero for the original clipped additive traces. The mode is
recorded in configuration, inherited actor metadata, acquired actor state and
sensory input genes. The inspector labels the recurrence; it does not imply
that the normalized controller has qualified for adoption. Checkpoints reject
mode or input-gene mismatches. Candidate controls share full founder genomes;
cross-architecture studies must explicitly account for the changed input gains.

The opt-in binary pooled-prior rule exposes `episodic.priorStrength` and each
recalled action's `rawEstimate`, `supportWeight`, `priorEstimate` and
`priorWeight`. The reported `estimate` is the pooled value used for selection
and TD bootstrapping. The prior comes from the union of the selected nearby
records, with relative weights sharing a numerical offset. An unsupported
action shares that local value and ties exactly with the supported action.
When both actions have support, the rule preserves their ordering for fixed
record targets; it changes value magnitudes and subsequent learning. It adds
no stored records or future labels. These are estimated returns, not confidence
intervals or demonstrated survival advantages. The option is incompatible
with joint control and the reserve auxiliary; its disabled value is omitted
from saved parameters for legacy compatibility.
the controller step, normalized observations, sampled choice, choice reason,
and the exact nearest experiences and reward estimates retrieved at that step.
This is captured when choosing, so later experience replacement cannot rewrite
the displayed explanation. `exploration` and `tie` are explicitly distinct from
choosing a larger recalled reward estimate. `actuator` identifies `turn` or
`move`, and `correction` reports the latest applied correction. The legacy
`turnCorrection` field is zero for movement-speed control. A correction can
differ in magnitude from the requested correction because the combined motor
output is bounded. Negative/positive choices mean left/right for turning and
slower/faster for movement. Viewing this data never
draws randomness or changes acquired memory. Old checkpoints without captured
decisions remain readable and begin capturing at their next decision.

`returnMode` distinguishes observed-window reward averages (`mean`) from
normalized bootstrapped targets (`td`). In value mode, `lastUpdate` exposes the
observed contribution, estimated future contribution, combined target, horizon,
and terminal flag. Retrieved value records carry the same labelled components;
their `reward` field is retained for API compatibility and contains the target.
The observer labels it as a value target rather than an observed reward. Death
transitions have an estimated future contribution of zero. The value lookup is
charged separately from the action lookup. These estimates are predictions and
do not establish useful learning or accurate future modelling.

Optional `moveMode: levels` uses `speedLevels` to expose the two configured
fractions of inherited maximum speed. A negative/positive memory choice selects
the slower/faster fraction directly. The observer displays those fractions and
the executed movement output, rather than describing them as residual neural
corrections. Existing checkpoints default to `residual`; parameter/state
mismatches are rejected. This option changes motor choices, not energy prices.

Opt-in `reserveRisk` adds an auxiliary prediction of discounted energy-reserve
shortfall, using the existing energy sensor. Each captured action estimate exposes
`riskEstimate` and `score = estimate - riskWeight * riskEstimate`. Stored `risk`
targets label the observed and predicted contributions, threshold, horizon and
terminal assumption. The energy and reserve heads bootstrap from the same greedy
action. At death, energy future value is zero while reserve cost assumes an unsafe
absorbing state. This is a disclosed modelling choice, not a measured probability
of death. Both heads have bounded storage and charged access; `riskLearning:false`
and zero-weight ablations retain those charges. Old checkpoints default to off.

`bootstrapMode: expected` labels targets that average both actions using the
configured epsilon-greedy exploration distribution. Energy and auxiliary cost
use that same distribution. The target records its exploration rate; mismatched
checkpoint modes/rates are rejected. Existing targets default to `greedy`.
`featureMode: navigation` keeps food, obstacle, scent, intake, energy and bias
channels while masking clocks, age and mate cues in the retrieval vector. The
neural actor still receives every sensor. Both modes are experimental options,
not evidence that prediction or ecological survival improved.

The opt-in joint controller has model `compact-joint-episodic-v7` and actuator
`joint`. Its four options combine slower/faster movement with left/right turn
corrections. It uses one bounded memory; the final coordinate of its 18-field
record is a selected speed-command tag, not a sensory channel. The first 17 fields are
the sensory retrieval vector; `action` records the selected turn-correction sign. The observer shows actual
clipped motor outputs separately. The
permitted radius is below the tag separation, so speed conditions cannot mix.
`lastDecision.retrieval.options` contains four labelled estimates and their exact
recalled records. Each decision and next-value query scans both speed conditions
and charges both scans. `turnCorrection` and `movementCorrection` expose the two
executed corrections; the neural actor receives the same sensors but both motor
plastic updates are disabled to avoid assigning credit to unexecuted samples.
Joint checkpoints use an explicit model/state schema and cannot be read as a
binary-action controller. Acquired memory still starts empty in children.
