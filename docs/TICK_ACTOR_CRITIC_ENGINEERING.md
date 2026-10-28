# Tick actor-critic engineering evidence

Full validation checkpoint: **201/201 Node tests pass**, with no failures or
skipped tests; `git diff --check` is clean. No performance worlds were collected.

On 2026-10-24 the new [tick-aligned component](TICK_ACTOR_CRITIC_DESIGN.md) passed
ten JavaScript component tests and a separate Python reconstruction check. This
is an engineering checkpoint, not a performance result or learning qualification.

## What was checked

`scripts/tick-actor-critic-engineering.mjs` records four predetermined synthetic
own-energy API schedules: continuing, freeze/reset, terminal debt and neutral
odor. The observer records every choice, motor, charge, payment, observation,
reset/freeze, work bill, restored state and final state. These events are not
accessible to a policy. There are **118 events, 19 decisions and 14 updates**.

`scripts/audit-tick-actor-critic.py` independently reconstructs the 161 weights,
Walsh features, hidden activations, epsilon-mixture policy, xorshift decisions,
actor/critic gradients, own-energy reward, TD error, eligibility, clipped joint
updates, motor outputs, actual abstract work, canonical state bytes, byte-time,
paid/unpaid energy and terminal work debt. It checks every retained state after
each event, initial/final state, prescribed event coverage/order, matching
choice-to-motor application, fixture roles and source hashes. It executes no
JavaScript and imports no learner implementation.

Fourteen mutation types are rejected: reward, chosen action, raw sensor,
gradient, work, fractional work, debt, motor output, motor-action mismatch,
source hash, missing event, missing fixture, final weights and terminal flag.
Both the Node recorder and Python checker refuse output overwrite. The Node
record is regenerated exactly; the component tests additionally cover central
finite-difference gradients, private RNG/body isolation, no hidden-label access,
reset/freeze semantics, actual state billing and a named two-founder 12-tick
physical fixture with exact JSON cold continuation and conservation checks.

The first JSON checkpoint component check exposed signed-zero differences in
retained gradients. The new component now normalizes arithmetic zero before it
is retained; it did not weaken that test to ignore differing live states. A
fixture initially placed more food than patch capacity and failed checkpoint
validation; only that artificial fixture's capacity was corrected before any
performance data. Neither change alters an existing frozen study.

## Reproduction and local artifact

```powershell
$env:SARSA_AUDIT_PYTHON=(Resolve-Path '.venv-research/Scripts/python.exe').Path
node --test tests/tick-actor-critic.test.mjs tests/tick-actor-critic-audit.test.mjs
node scripts/tick-actor-critic-engineering.mjs --output FRESH_RECORD.json
.venv-research/Scripts/python.exe -B scripts/audit-tick-actor-critic.py FRESH_RECORD.json --output FRESH_AUDIT.json
```

The preserved local artifact is
`evidence/tick-actor-critic/20261024-engineering-v1/record.json`, with
`numeric-audit.json` and the nine fingerprinted source/test files under `sources`.
Use its captured Python checker if working files later change:

```powershell
.venv-research/Scripts/python.exe -B evidence/tick-actor-critic/20261024-engineering-v1/sources/scripts/audit-tick-actor-critic.py evidence/tick-actor-critic/20261024-engineering-v1/record.json
```

The nine-file capture is **not a complete transitive Node import closure or a
portable full-study bundle**. No claim is made that the captured Node entrypoint
can execute in isolation. The preserved checker independently verifies all nine
captured hashes and the recorded arithmetic without those omitted imports.

## Limits

The energy schedules are synthetic inputs, not physical energy trajectories.
The Python checker verifies arithmetic conditioned on recorded own inputs; it
cannot establish engine sensor provenance, reachable states, actual food/death
physics, or ecological utility. It uses numerical tolerance for transcendental
reconstruction (relative 1e-10, absolute 1e-12); integer counters and event
coverage are exact. That tolerance is not exact physical replay. The separate
12-tick Node fixture is an engineering world, not a fresh performance history.

Synthetic reinforcement changes a different odor's response through shared
weights. That establishes possible functional coupling, not memory pressure in
the required continuing task. No acquisition, A/B retention, original-ecology
transfer, survival advantage, confirmation result or RSI has been demonstrated.
The opt-in [continuing-world wrapper and controls](TICK_CUE_INTEGRATION.md) are
now implemented and component-tested separately. The prospective pressure
manipulation, frozen performance protocol and full wrapper/physical/statistical
audits remain unimplemented. This older core-only checker does not cover them.
