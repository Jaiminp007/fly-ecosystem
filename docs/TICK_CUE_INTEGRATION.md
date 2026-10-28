# Tick learner continuing-world integration

Current full validation: **208/208 Node tests pass**, with no failed or skipped
tests. `git diff --check` is clean. No performance bank was collected.

## Engineering checkpoint, not qualification

`learning/tick-cue-experiment.mjs` connects the
[audited learner core](TICK_ACTOR_CRITIC_ENGINEERING.md) to continuing physics,
resource phases, comparison controls and read-only probes. It is opt-in; the
platform, old study sources and frozen evidence are unchanged. There is no new
performance collector, registered seed bank, frozen statistical protocol or
performance result. Seven new integration tests pass. They are named synthetic
engineering fixtures, not evidence of useful acquired skills or RSI.

The [new independent wrapper audit](TICK_CUE_WORLD_ENGINEERING.md) now checks
19 named main fixtures and 23 short probes, with 27 corruption types rejected,
complete captured sources and exact Node replay. The earlier checker remains
core-only. Neither checker establishes independent physics or performance
statistics; pressure controls and the final protocol still require extensions.

## Continuing worlds and controls

The existing cue/resource substrate continues A512 / B512 / C512 / return-A256
with no food or body-energy refill, replacement founder, reproduction or mutation.
All matched interventions retain the existing episodic native controller's
background physical costs but disable its native neural/memory acquisition.

The thirteen implemented main arms are:

| Arms | Semantics |
| --- | --- |
| candidate | tick actor-critic, own trajectory throughout |
| frozen | acquire in A, freeze at B entry, remain frozen |
| reset | reset initial weights and traces at B and C entry; retain own RNG, counters and debt |
| cueBlind | neutral odor, all permitted raw physical sensors unchanged |
| shuffled | independently assigned family cue each body/tick, no hidden valence input |
| nullCandidate / nullBlind | balanced hidden valences within each cue identity, with/without odor |
| incumbent | original native acquired controller; explicitly a different-interface reference |
| acceptCruise / refuseCruise | fixed respective intake/steering at normalized speed .5 |
| acceptStationary / refuseStationary | fixed respective intake/steering with zero translation |
| random | own private RNG chooses uniformly across the same four-action menu every tick |

All non-incumbent policies use the declared tick cadence and menu. Raw sensory
access is the same for matched learned and fixed policies; fixed policies simply
do not use irrelevant inputs. The incumbent retains its original native outputs
and input pathway and is **not** represented as a matched tick-menu policy.
Its external bookkeeping is observer-only; native physical controller costs
continue to be charged by the engine rather than paying for a fictitious extra
policy circuit. Ordinary matched main arms have identical initial physical
checkpoints. The null pair shares its own valence-shuffled physical checkpoint.

Fixed controls retain no unused neural weights, eligibility or gradients.
One fixed menu decision costs one abstract scalar operation. Uniform random
selection adds nine operations (six RNG, division, multiplication and floor).
Both pay their actual six/nine-operation motor and full retained-state byte-time.
The body-private RNG never draws from physical, resource or another body streams.
Observation scrambling/hashes and trace copies are experimental/observer work,
not policy computation; future total CPU/wall budgets must include that work.

Observer events are cloned before delivery. A recording callback cannot mutate
the actual own observation, raw inputs, selected outputs or policy state. This
is tested by deliberately corrupting callback inputs and comparing continuation.
Observers cannot supply experiences to a policy through the wrapper API.

## Phase snapshots and paired probes

After A and B, observer-only archives save every original founder's weights.
End-C saves a complete joint checkpoint for the candidate. No archive is passed
to a policy. The final nonterminal interval at a phase boundary remains pending,
as specified in the core design: copying or freezing a model does not fabricate
a terminal reward. Phase interventions clear pending gradients as declared.

Fourteen implemented probe specifications use common end-C physical bodies and
physical RNG within each family:

- A: saved A, end-C and reset.
- B: saved A, saved B, end-C and reset.
- C: saved B and end-C.
- Original ecology: saved A, end-C, reset, always-accept cruise and always-accept
  stationary. Transfer makes food all-beneficial and hides odor without refill.

Default length is 256 ticks. Shorter lengths are an explicit engineering-only
test option, not permission to change a future locked study. Weights never
change during probes; no probe state or reward feeds the original checkpoint.
The same current body RNG is used for each weight version, independent of the
RNG at which an old model was originally saved. Saved versions replace only
weights; current physical state, lifetime counters and outstanding cost remain.

Both always-accept translation modes are retained so a stationary learned policy
cannot clear transfer merely by beating the weaker cruising comparator. A new
performance protocol must require learned end-C to beat reset **and both**
matched always-accept modes. Saved-A transfer is descriptive, not a substitute
for the end-C transfer gate.

Reset performs its actual deterministic initialization for living bodies and
bills those 1189 operations. Dead bodies are never reinitialized. Returned
`resetInitializationOperations` and `resetInitializationEnergyPerFounder`
separately disclose this difference; it remains in primary honest cost accounting.
Before qualification, the new protocol must also rule out an apparent skill
advantage explained solely by reset-construction costs, for example with a
predeclared conservative initialization-cost-neutral skill comparison. It may
not quietly count this bookkeeping difference as useful acquired behavior.

The currently implemented thirteen main arms plus fourteen probes would require
27 worlds and at most 26,880 collection world-steps per history before any extra
pressure manipulations. This is arithmetic for the implemented surface, **not**
a frozen study ceiling or authorization to launch those worlds. Pressure forks,
audit computation, development/confirmation histories and total resource caps
remain to be prospectively budgeted together.

## All-founder energy, debt and extinction

Every endpoint retains the original founder denominator. Main value is surviving
body energy minus original body energy minus outstanding policy debt, divided
by original founders. No selected-survivor average is substituted.

Probe policies all inherit the same existing debt, including debts of previously
dead founders. Fixed probe controls carry that ledger without retaining the
unused learner. Probe value is the **incremental** budget-adjusted energy:

`(finalBodyEnergy - startingBodyEnergy - (finalDebt - startingDebt)) / founders`.

This does not forgive starting debt: living bodies still pay it physically.
Subtracting the debt change prevents counting a historical cost twice when it
was already charged before the probe. New probe costs, including reset
initialization and unpaid terminal work, remain losses. Additional operation
counts use a corresponding start counter so a fixed control's counter reset
does not hide or invent probe computation.

Death causes no replacement. Positive remaining energy discarded at age death
is recorded separately from the preceding per-step physical receipt. Terminal
learning work is billed even when no body remains to pay it. Dead retained
records are observer evidence, not active bodies charged future policy byte-time.
Their existing debts nevertheless remain in endpoints. If extinction precedes
end-C, absent-checkpoint probes return explicit all-dead zero incremental values;
these cannot clear positive acquisition/skill gates. Probing an existing extinct
checkpoint preserves its debt and costs zero additional actions/initializations.

## Verification and remaining work

`node --test tests/tick-cue-experiment.test.mjs` covers:

- common starts, private random draws, actual fixed/random work and no unused
  learner circuit in fixed controls;
- exact joint checkpoint continuation for all thirteen arms and observer-mutation
  isolation;
- A/B boundary continuation, both B/C resets, unchanged physical inventory/RNG
  at phase entry, saved versions and the full return-A stop;
- all fourteen short common-body probes, neutral transfer observations, no
  acquisition/refill/backflow, frozen weights and reset-cost disclosure;
- complete age extinction, discarded energy and terminal work debt; partial
  mortality with common inherited debt and original founder denominators;
- rejection of missing/revived founders, foreign identity mappings, corrupted
  saved versions and unused fixed-control weights.

The long-phase engineering fixture deliberately supplies artificial initial
energy, zero speed/metabolism, long lifespans and initially empty resources to
exercise lifecycle boundaries. It must not be interpreted as original-ecology
survival, a reachable learner state or a performance sample. Its resource clocks
and prices still execute normally. No model/parameter selection used its scores.

Next: define a substantive functional-interference/pressure manipulation, extend
the audited wrapper/scorer for it, then freeze the complete fresh
development/confirmation protocol, multiplicity, unchanged retention/survival
requirements, cost-neutral reset checks and full audit/mutation rules. No useful
continuing learner, per-skill retention, original-ecology transfer, persistent
autonomous revision, copied-improvement result or RSI is established here.
