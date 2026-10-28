# Tick-aligned shared actor-critic candidate

## Status and scope

Update: [continuing-world integration](TICK_CUE_INTEGRATION.md) now implements
thirteen main arms and fourteen paired probe specifications, with named
engineering tests. The [wrapper engineering audit](TICK_CUE_WORLD_ENGINEERING.md)
now passes independent policy/ledger reconstruction and captured-source replay.
Pressure manipulation, performance statistics and the locked protocol remain
outstanding; no performance collector or seed bank has been opened.

This is a new human-proposed, opt-in learner component, following the
[cue/credit diagnosis](CUE_CREDIT_DIAGNOSIS.md). It is not yet connected to a
performance runner, qualified in an ecology, or an autonomous algorithm revision.
No development or confirmation histories have been registered or opened for it.
Failed studies and their unopened reserves remain immutable. Engineering records
and the independent reconstruction are described in
[TICK_ACTOR_CRITIC_ENGINEERING.md](TICK_ACTOR_CRITIC_ENGINEERING.md).

Unlike the previous eight-tick cue learner, this component receives its own raw
engine sensors and cue observation, chooses an action every tick, and closes a
one-tick energy transition at the next own observation. This is a joint
observation/cadence/representation/learner/action-menu intervention, not an
isolated test of reward timing. Sampling more often cannot guarantee that a
contact cue labels the patch eventually eaten, and no supervised label is added.

## Fixed component semantics

`learning/tick-actor-critic.mjs` exports the component; it is not installed in
`embodied-programs.mjs` or imported by the simulator/platform.

Inputs are all seventeen finite raw engine coordinates plus sixteen exact Walsh
odor coordinates, for 33 total. The cue-observation channels that should match
raw sensors are validated, including its remapped proximity. Absent odor is
sixteen zeros; physical direction, proximity, own previous-food, energy, clocks,
walls and other lawful local sensors remain present. Neither task ID, hidden
valence, patch identity, another body's rewards, nor an observer trace is a
learning input. Raw direction access is explicit, not smuggled through odor slots.

Four shared tanh hidden units receive 33 inputs and a bias each (136 parameters).
Four policy heads and one value head each receive four hidden outputs plus a
bias (25 more parameters): **161 trainable parameters** total. There is no
recurrent hidden state, replay buffer, oracle codebook or factual experience
archive. Persistent plastic memory is the weights and two eligibility vectors;
a pending decision retains its two gradients, own initial energy, value, action
and tick until its interval closes. A shared hidden layer does not by itself
prove actual memory pressure, an information bottleneck, or successful retention.

All bodies use the same deterministic hidden initialization, with xorshift seed
`0x74616331` and weights `.2*(draw-.5)`. Hidden biases and output weights start
zero. The accept-cruise output bias starts at `log(3)`; other output biases are
zero. Policy probabilities are `.025 + .9*softmax(logits)`, giving initial
probabilities .475/.175/.175/.175. This disclosed initial preference is not
acquired behavior. One private body xorshift draw samples each action. Reset
restores exactly this initialization without rewinding exploration or lifetime
counters. Initialization is not fitted from any performance bank.

The four actions form the complete two-by-two menu:

| Index | Intake / steering | Translation |
| --- | --- | --- |
| 0 | existing accept primitive | cruise (`move=0`, normalized speed .5) |
| 1 | existing refuse primitive | cruise |
| 2 | existing accept primitive | stationary (`move=-1`) |
| 3 | existing refuse primitive | stationary |

Steering is the existing `motorPrimitive`, including its known sine-direction
ambiguity; it is not the separately failed exact-bearing pursuit bundle.
Reproduction output remains -1 and signal output 0. No threshold sweep,
intake-triggered stopping rule, privileged target selection or new reflex is
embedded. Stationary accept can still turn and incur native background costs.
This menu's original-ecology utility has not been established.

## Credit, update and lifecycle

For a nonterminal action at tick `t`, the next choice at `t+1` first closes the
pending interval using the supplied own budget-adjusted energy difference
divided by 120. It evaluates the next state's value using **pre-update weights**.
With `delta = reward + .99*nextValue - previousValue`, each actor/critic
eligibility vector becomes `.99*.9*oldTrace + pendingGradient`. Actor gradient
is the exact gradient of the log of the epsilon-mixture action probability;
critic gradient is the semi-gradient of the preceding state's value. Each
parameter receives `.01*delta*actorTrace + .05*delta*criticTrace`, clipped to
[-4,4]. Both losses update the shared hidden parameters. Rates, discount,
eligibility decay, width and initialization are fixed component constants, not
runtime search options. Finite-difference checks cover all 161 actor and critic
coordinates for each of four actions.

After the update, the current action and its retained gradients use the updated
network. An `observe` call must follow each choice at that same tick. A terminal
observation closes the last interval immediately with zero bootstrap, including
negative own energy representing unpaid debt, and clears traces. There is no
future-observation or counterfactual reward access. Reward is not the sign of
food or a supervised cue target. Actual compute/storage obligations must remain
in the supplied own-energy accounting, including work billed after death.

Nonterminal `observe` validates lifecycle but does not mature a transition;
the next `choose` does. Thus twelve live ticks produce twelve actions and eleven
updates. A saved end-of-phase snapshot may contain the last unresolved interval.
The future runner must declare this boundary explicitly, save at the same point
for all versions, and never invent a terminal transition or allow probe outcomes
to feed training. Freezing clears that pending interval and both traces without
changing weights. Reset restores initial weights and clears traces/pending while
preserving the current acquisition flag, RNG, debt and lifetime counters.

## Explicit accounting

Existing prices are unchanged: `operationEnergy=5e-6/17` and
`byteEnergyPerSecond=1e-5/(17*8)`. `chargeForStep` and `billSarsaWork` price the
entire actual canonical state, not just weights. Native controller, metabolism,
movement and other background costs remain additional physical costs.

| Work item | Charged scalar operations |
| --- | ---: |
| Initialization / reset | 1189 |
| Odor features / neutral features | 21 / 6 |
| Forward network | 340 |
| Forward plus both action-conditioned gradients | 678 |
| One transition, including weight clipping | 1618 |
| Body RNG advance plus conversion | 7 |
| Cumulative action selection | 2 per inspected action |
| Existing accept / refuse motor | 6 / 9 |

The current implementation deliberately recomputes a full network evaluation
when retaining gradients. That actual additional work is billed, not optimized
away in the accounting. A live choice with a pending interval also pays for its
separate pre-update bootstrap evaluation. Frozen inference skips gradients and
learning but still pays for features, forward evaluation, action sampling and
the motor. Every retained field, including config, counters, traces and pending
gradients, contributes byte-time. Terminal work remains outstanding debt.

These are abstract scalar-operation prices, not CPU-instruction or wall-time
claims. Validation, indexing, assignments, object construction, loop/control
bookkeeping and counter maintenance are excluded, as in the declared accounting
model. Each explicit mathematical primitive in metered network/update arithmetic
costs one; clip uses min and max. Signed zero is normalized in arithmetic results
as representation bookkeeping so a JSON checkpoint preserves the live state.
Actual CPU, wall time and audit computation still require separate reporting.

## Before any performance seeds

The following are required work, not already satisfied by component tests:

1. Independently validate the now-implemented opt-in continuing-world wrapper with complete joint
   checkpointing, no food/body refill, no dead-founder replacement, native
   acquisition disabled in matched arms, and per-tick observer-only receipts.
2. Freeze and independently verify the implemented frozen/reset/cue-blind/shuffled/null and fixed-action/random
   controls. All prospective controls must use the same raw observation access,
   decision cadence and four-action menu. Fixed controls must not pay for unused
   learner storage. Retain legacy references descriptively rather than weakening
   same-interface always-accept. Declare each control's actual RNG/work bill.
3. Demonstrate meaningful interference/pressure with a prospective functional
   manipulation and audit. Orthogonal cue support, parameter reuse, a synthetic
   cross-cue response change or receipt count alone is insufficient. The new
   component has no slow-synapse transfer mechanism; old transfer/activity checks
   cannot be copied with renamed fields and called satisfied.
4. Lock the complete protocol, arms, multiplicity family, fresh seed exclusions,
   world/step/budget ceiling, endpoint rules and confirmation reserve before
   outcomes. Preserve the A512/B512/C512/return-A256 sequence, separate A/B
   skill-over-reset and >=95% retention requirements, own-trajectory acquisition,
   null equivalence, all-founder cost/death accounting and survival guards.
5. Require original-ecology learned end-C to beat reset and both same-interface
   always-accept translation modes with no odor. Rule out skill advantages solely
   explained by the disclosed reset-initialization cost. A zero neutral odor block is not transfer; physical
   context learning or the motor menu has to earn any advantage. Failure closes
   the new bank; do not tune or extend it using its outcomes or older reserves.
6. Extend independent arithmetic from the synthetic API tapes to the actual
   wrapper's per-tick observations, motor application, billing, physical receipts,
   deaths, probes, endpoints, statistics and full role/founder coverage. Require
   exact captured-source Node physical replay separately. Freeze only after
   mutation/omission checks pass on complete named engineering fixtures.

No protocol has yet passed this freeze checklist. Even an eventual qualified
learner would leave successive persistent autonomous method revisions,
copied-improvement controls and improved subsequent search at matched total
budget unachieved. This candidate does not establish RSI.
