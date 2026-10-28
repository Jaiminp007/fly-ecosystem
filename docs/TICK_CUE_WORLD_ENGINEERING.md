# Continuing-world engineering audit

## Result and evidence

The named synthetic wrapper fixtures pass independent policy/ledger arithmetic
and exact captured-source Node replay. This closes the wrapper engineering
checkpoint, not the performance-study freeze or scientific qualification.

- 19 main cases cover all 13 arms, mixed intake, full/partial age mortality,
  A/B/C/return-A progression, freezing and both boundary resets.
- 23 short probes cover the 14 declared specifications, partial/extinct transfer
  checkpoints and an absent end-C checkpoint.
- Python reconstructed 7,863 decisions and physical receipts, 6,694 learning
  transitions and three terminal observations.
- All 27 altered/missing-trace variants were rejected. Coverage includes choices,
  cue/raw inputs, work/storage/native costs, motor application, physical receipts,
  death/debt, founder denominators, horizons, saved models, paired physical worlds,
  reset charges and unused fixed-control circuits.
- The complete Node suite passed **211/211**, with no failures/skips;
  `git diff --check` passed.

Local evidence: `evidence/tick-cue-world/20261024-engineering-v1/` contains
`record.json`, `numeric-audit.json`, `replay-audit.json`, `full-tests.log` and
29 captured source files. Unlike the earlier core-only tape, this includes the
complete local ESM import closure. Tests independently copy that closure outside
the checkout and run both entrypoints there.

Record SHA-256:
`6e4317dfc7f4b2dbe379c57d852ad95f6fa85d8c2e36016daed082470a4cffc0`.

The ignored local evidence is also preserved in the portable, hash-verified
`handoff/tick-cue-world-20261024/manifest.json` and its archive chunk. That manifest
covers 33 files; earlier evidence and archive manifests remain unchanged.
This work remains local/uncommitted, not newly published on PR #2.

## What is independently checked

`scripts/audit-tick-cue.py` reconstructs learner initialization, features,
body-private exploration, policy gradients, eligibility, updates, actual abstract
work, serialized-state byte-time and payments. It verifies native background
cost arithmetic from recorded counters, intake/energy/death accounting,
discarded energy, terminal debt, phase resets/freezes, saved models, endpoints,
complete live-founder coverage, matched physical starts and frozen probes.
Reset construction costs and inherited all-founder debt remain explicit.

The observer now records the source cue, applied outputs/native memory counters,
phase endpoints and full physical probe starts. These cloned diagnostics are
not policy inputs. Probe pairing checks actual checkpoint content, not just
matching declared hash strings.

Python does **not** independently implement sensor geometry, heading noise,
resource supply/regrowth or the native policy. Resource conservation and native
cost checks are conditional on recorded supply/counters. Exact Node replay binds
those records to captured engine execution; it is not an independent physics
implementation. The same-runtime replay here used Node v22.19.0 on Windows;
cross-runtime floating-point equality is not established.

The long fixtures use two artificially energetic, motionless, low-metabolism,
long-lived bodies and initially empty food. They exercise lifecycle semantics,
not realistic survival, learner-reachable states or useful acquired behavior.
Short probe scores were not used to select a learner or parameters.

## Recheck without overwriting evidence

Restore missing archived evidence with the existing generic manifest reader:

```powershell
.venv-research/Scripts/python.exe -B scripts/package-sarsa-evidence.py restore handoff/tick-cue-world-20261024/manifest.json
```

Despite its historical filename, restore reads the supplied manifest and refuses
to replace different existing evidence. For numerical/replay checks, choose
fresh output paths; both entrypoints refuse to overwrite outputs:

```powershell
.venv-research/Scripts/python.exe -B evidence/tick-cue-world/20261024-engineering-v1/sources/scripts/audit-tick-cue.py evidence/tick-cue-world/20261024-engineering-v1/record.json --output NEW-NUMERIC-AUDIT.json
node evidence/tick-cue-world/20261024-engineering-v1/sources/scripts/tick-cue-engineering.mjs --replay evidence/tick-cue-world/20261024-engineering-v1/record.json --output NEW-REPLAY-AUDIT.json
```

## Remaining qualification blockers

No new performance histories or confirmation reserves were opened. There is no
performance collector, frozen statistical protocol or performance scoring audit
for this candidate yet. Before collecting outcomes:

1. Specify and implement a substantive functional pressure intervention and
   matched causal controls. Shared parameters, orthogonal odor codes or changed
   readouts alone do not establish memory pressure.
2. Lock fresh seed exclusions, full world/step/compute budgets, multiplicity,
   null equivalence, survival guards and the separate A/B skill-over-reset and
   at-least-95% retention requirements before outcomes.
3. Require original-ecology end-C to beat reset and both same-interface
   always-accept modes. Rule out gains explained only by reset initialization
   costs; do not weaken comparators after outcomes.
4. Extend the scorer and independent checker to that final protocol, statistics
   and pressure controls; require full captured-source replay and altered-record
   rejection before the freeze.

Useful learning, per-skill retention, original-ecology transfer, successive
autonomous learning-method revisions and improved subsequent search against
copied-improvement/matched-budget controls remain unachieved. No RSI claim follows.
