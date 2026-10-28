# Own-experience steering prototype

## Acquisition-support failure

The default cue-acquisition environment cannot supply this learner's action 1:
food starts on a 32-unit grid, cue phase initialization and renewal do not move
patch positions, and the selector requires pair distance at most 30. Translation
and rotation preserve that separation, with a two-unit margin over the cutoff.
A four-founder, 80-step fixture observes zero eligible actions and zero action-1
weight updates; all three arms in a separate 40-step terminal fixture produce
identical traces. `tests/own-steering-availability.test.mjs` checks the geometry
and each cue-phase layout. This prototype is not eligible for a full development
comparison on the default acquisition grid; its previous passing integration
tests do not establish readiness or action support.

An opt-in acquisition geometry now uses the existing continual random-layout
procedure once before applying the normal cue phase. The grid remains default.
In one four-founder, 80-step engineering fixture, 258 of 320 decisions have the
guarded midpoint available and the learner executes it 116 times. These are
counts, not evidence that every founder learns or that the policy performs well.
The design and retained transfer requirements are in
`docs/OWN_STEERING_GEOMETRY_DESIGN.md`.

Do not infer that steering is acquired from transfer-only exploration. A future
design must give both learner and controls factual access to the relevant action
during acquisition, while retaining the original-ecology transfer gate and
clearly accounting for any training-layout change. Any revised interface must be
specified before outcomes and pass independent numerical and cost auditing.

The interaction diagnosis motivates a candidate that chooses between native and
the already guarded midpoint steering using only its own actual energy changes.
`learning/own-steering.mjs` implements an experimental learner, now wired to
the acquisition world in `learning/own-steering-experiment.mjs`. It has
separate linear action values, a 10% exploration probability
when midpoint steering is available, one-step discounted temporal-difference
updates and a separate RNG. Its own pending action and previous energy supply
the only reward label; terminal updates use its own final budget energy.

The existing midpoint availability and viability guard is an engineered action
interface, not a learned skill. Acquisition must actually encounter and execute
both available actions; a frozen or reset model alone is not proof of learning.
No intervention outcomes or labels from other bodies enter the model. When a
control forces an action, the pending record explicitly stores that actual action,
not the learner's ignored proposal. Four unit tests cover these invariants,
terminal/frozen state, unavailable actions and decision continuity.

The implemented eight-feature interface is: constant one; own energy/120 clipped
to [0,1]; both existing wall
channels; own previous food signal; existing local social signal clipped to
[-1,1]; midpoint distance divided by the body's sensing radius clipped to [0,1];
and midpoint lateral component divided by its distance (zero at distance zero).
Only the factual current observation and own receipt may be used. Feature
computation, action availability, guard, choice, update, RNG and complete
encoded learner/pending state must be paid in every matched arm, including
terminal work and unpaid debt. The prototype's current work counter has not yet
received an independent exhaustive accounting audit.

The new wrapper trains in actual acquisition phases and gives learned,
forced-native and forced-guarded arms the same sensor, learner and billing
machinery. It records the action actually executed and charges the nested learner
work and complete encoded state, including pending experience and spatial points.
Seven focused tests pass for physical commands, action availability, storage at
decision, terminal debt, observer neutrality and exact checkpoint recovery. No
full multi-history evaluation or independent complete cost audit has been run.

The wrapper now supports frozen and reset forks into A, B, C and original-ecology
transfer from an explicitly supplied acquisition snapshot. It clears pending
cross-boundary transitions, preserves inherited and setup debt, prevents both
steering and taste updates in the probe, and can force the same action access for
matched controls. Ten focused tests pass, including reset weights, frozen weights,
shared physical initialization, setup charges, task boundaries and restoration.
Acquisition snapshot selection and the full retention experiment are still to be
implemented; a fork by itself does not establish retention. Compare candidate
with equal-access matched forced-native, matched guarded and reset/frozen
controls plus the cheap native-full reference. Record actual action support,
initializations, physical receipts, work and checkpoint provenance for each
founder. Maintain all original survival, functional-pressure, retention and
transfer gates; a short transfer-only experiment cannot qualify this project.
First independently audit feature availability and complete billing, then freeze
the development protocol before new outcomes.
This prototype has no physical performance, affordability, retention, transfer
or RSI evidence yet.
