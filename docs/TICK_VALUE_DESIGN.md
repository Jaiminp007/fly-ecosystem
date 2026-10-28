# Fixed tick-aligned direct action-value component

This specifies one new human-proposed experimental component before any of its
performance outcomes. It is not installed in the engine/platform, a qualified
learner or an autonomous revision. Failed studies, archives, reserves and
paused habitats remain unchanged. The [observation/mechanism design](CONTACT_CUE_VALUE_DESIGN.md)
still requires matched factorial controls and a fresh complete protocol.

## Fixed representation and action selection

The same four actions are accept-cruise, refuse-cruise, accept-stationary and
refuse-stationary. Retain the existing tick motor primitive, including its
disclosed direction ambiguity. No new stopping reflex, privileged target,
reproduction or valence input is added.

Each own decision receives the same seventeen raw lawful engine sensors and a
seventeen-coordinate cue observation. Its current base is raw17 plus the exact
sixteen-coordinate Walsh odor code, neutral odor all zero. The previous own
decision contributes its 33 base coordinates multiplied by .5 and a four-entry
previous-action one-hot with value .5. Append one previous-observation-present
flag. Missing history is 38 zeros. Total: **71 coordinates**. Normalize the
whole vector by `max(1,sqrt(sum(x*x)))`. Raw coordinates must be finite within
[-1,1]. History is one previous own observation/action only, not a task label,
replayed record, hidden patch identity or another body's experience.

Four zero-initialized linear rows contain **284 value parameters**. Values are
the four row/feature dot products. Policy assigns `.1/4` to every action plus
`.9/ties` to each exact maximizing action. Thus all-zero initialization yields
uniform [.25,.25,.25,.25], not the earlier actor-critic prior. One private
xorshift draw samples the categorical policy every tick. Exact ties have no
epsilon tolerance or fixed-index preference. Expected bootstrap is the dot
product of all four values and these same nominal probabilities.

This mechanism/representation/history/replay bundle differs from the failed
actor-critic and earlier two-speed SARSA. A subsequent comparison cannot isolate
one ingredient merely by calling it a pure selection-rule intervention. No
configuration is chosen by rerunning a failed bank. The fixed constants are
epsilon .1, discount .99, live lambda .9, live rate .05, replay rate .01 and
per-weight clipping [-4,4]. Rates reuse the earlier disclosed engineering SARSA
defaults, not a new sweep. A separate lambda=0 body is an allowed matched
ablation; all other constants remain fixed. No stability/performance guarantee
is claimed for this clipped function approximator.

## Own credit and task-blind bounded replay

A choice at tick t stores its normalized phi, action and own budget-adjusted
initial energy. Nonterminal observe at tick t validates lifecycle but does not
mature that interval. Choice at t+1 first builds the current feature from the
previous own observation/action, then closes the pending duration-one record.
Reward is `(currentOwnEnergy-pendingInitialEnergy)/120`; own energy is physical
energy minus outstanding policy debt. The pre-update target is reward plus .99
times current expected value. Predicted value is the chosen previous row at phi.

For all four rows, eligibility becomes `.99*lambda*oldTrace + phi` in the chosen
row and `.99*lambda*oldTrace` elsewhere. Each parameter receives
`.05*delta*eligibility`, clipped to [-4,4]. A terminal own observation closes its
current interval immediately, has zero bootstrap and zero next-phi, then clears
traces. No terminal is invented at a surviving phase boundary or final stop.

Only that completed own factual transition enters memory, with body identity,
tick, duration one, phi/action/reward/nextPhi, energy endpoints, terminal flag and
lifetime experience serial. Keep sixteen recent records. Displaced records enter
a forty-eight-slot unbiased reservoir over all displaced records since acquired
reset, using a separate private retention stream. Once full, draw uniform index
in `[0,olderSeen)` and replace only if below 48. No phase or reward priority.

After every live transition, sample uniformly from older followed by recent
records using a third private replay stream. One fresh one-step semi-gradient
update affects only its action row with `.01*recomputedDelta*storedPhi`, clipped
to [-4,4]. It uses current weights/nominal policy and never propagates live
eligibility through unrelated records. The newly completed record is eligible;
unfinished intervals are not. Neither replay nor the observer receives a fork,
future label, another body's record or external gradient.

Only after live update, memory insertion and replay does the next actual choice
use freshly recomputed values. Previous observation/action is then updated to
the actual current decision, including frozen inference decisions.

## Lifecycle and accounting

Freeze disables acquisition, clears pending and eligibility, and retains value
parameters, previous own context, factual memory, private streams and counters.
Reset zeros weights/traces, clears pending/previous/memory and resets acquired
memory counts. It preserves acquisition state, all three RNG streams, lifetime
decisions/transitions/work and every debt/payment. Initialization/reset allocates
zero arrays; allocations are excluded from the abstract scalar model and bytes
are priced when active. Initializing the two extra streams costs two XOR
operations; unsigned representation normalization and branch bookkeeping are
excluded. Terminal replay/update work remains debt even if no body can pay.

Every explicit arithmetic/transcendental primitive in features, dot products,
target/update/clipping, probability calculation and sampling is metered.
Comparisons used for max/tie/sample decisions are counted. Xorshift costs six
operations plus conversion; replay/reservoir index multiplication and floor
are additionally counted. Counter/array/index/validation/loop bookkeeping and
copying are excluded, as in the existing declared abstract model. Full actual
canonical state—including parameters, eligibility, own previous context,
pending phi, every replay feature record, config, counters and streams—pays
byte-time under existing prices. This is not a heap or biological energy claim.

The new contact query's actual work is additional to this learner and must enter
the same body ledger before billing. Fixed policies must not pay for unused
value arrays/replay. Native background cost remains physical. Actual whole-run
CPU/wall and audit costs must be separately reported. Record count is not total
memory size, and overflow/shared physical weights alone do not prove pressure.

Complete restoration validates body identity, feature sizes/norms, finite clipped
weights, exact config, lifecycle, three streams, distinct ordered factual serials,
recent/reservoir counts since reset, completed-record ownership and energy reward,
live/replay counters and charge ledger. JSON signed-zero normalization preserves
exact continuation. Freeze/reset/terminal/restore are part of the component
contract, not evidence of successful learning.

## Before performance

Independently reconstruct complete named engineering tapes, including normalized
history, exact ties, greedy choice, targets/traces, actual reservoir replacement,
replay, bills, terminal debt, reset/freeze and restoration. Reject altered/missing
records and source mismatches. Then implement continuing-world integration,
matched original/contact observation and actor-critic/value controls, frozen
common-body skill/pressure/transfer probes and complete checkpoint restoration.
Freeze all statistics, exclusions and total budgets before fresh outcomes.
No new performance bank is registered by this component specification.

Require the unchanged honest standards: useful A/B skills, B/C acquisition,
separate >=95-percent A/B advantage retention, actual functional pressure,
original-ecology transfer over reset and both always-accept modes, exact-count
survival guards and all-founder cost/death denominators. A pass would still not
supply persistent autonomous revisions or copied-improvement search productivity.
