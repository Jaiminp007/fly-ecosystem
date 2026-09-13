# The changing world

This release adds explicit environmental pressures, not an intelligence target.
The original habitat is still available as a comparison control. Networks retain
17 sensory inputs and five outputs; no LLM, hidden planner or scripted solution is
inserted. Brain growth remains subject to the original inheritance rules.

Each phase lasts 180 artificial seconds. The four phases repeat, without getting
harder as populations improve and without rescue when they struggle:

| Phase | Mechanism | Possible behavior to evaluate |
|---|---|---|
| First Light | Original resource renewal | Recover and reproduce |
| The Drift | A moving fertility band multiplies local renewal from 0.45× to 2× | Track changing food availability |
| Lean Season | Renewal is 0.65× normal | Forage efficiently under scarcity |
| The Squall | Moving radius-100 region charges 0.35 energy/second | Avoid costly regions while feeding |

Normal configured renewal and existing seasonality multiply these effects.
The Drift changes renewal, not stored food: resources are not teleported or
silently destroyed. The stress zone appears in the existing local wall/danger
sensors; food and mate sensing remain unchanged. Movement is not forcibly steered.
All energy expenditure, including stress, is included in dissipation accounting.
The existing net-energy learning signal consequently includes stress costs.

## Evidence and interpretation

The dashboard shows current phase, countdown, active zone, and the latest completed
phase outcomes. Up to 64 phase records persist with the checkpoint. Outcomes compare
population, births, deaths, and food consumption; phase differences are descriptive,
not controlled causal estimates. The population and environment change together.

`scripts/challenge-evaluation.mjs` compares founder cohorts against genomes from a
saved live population on three matched seeds, with lifetime learning enabled and
disabled. Both cohorts start at age zero with matched energy and positions.
Descendants inherit body/life-history traits as well as neural structure; their
acquired weights are cleared. This does not isolate brain size or intelligence.
See `evidence/challenge-release/evaluation.json` and `summary.md`.

To reproduce, provide the recorded donor checkpoint at
`evidence/challenge-release/pre-challenge-world.json`, then run
`node scripts/challenge-evaluation.mjs`. Its SHA-256 is recorded with results; that
world JSON is excluded from Git; its compressed copy is attached to the 2.0.0 GitHub release as `challenge-donor-world.json.gz`. Decompress it into the path above. Without that exact checkpoint, reruns are
new experiments, not exact reproductions. Archive a download before conducting
future comparisons.

## Compatibility and deployment

Challenges-off worlds retain `compact-evolving-v1`. Enabled worlds identify as
`compact-challenges-v2`; checkpoints must match their configuration. On deployment,
ACTIVATE_CHALLENGES=cycle archives the restored world before enabling the cycle,
records the intervention and starts phase time at its current tick. It does not
reset neural state, age, lineage, or population, and does not revive extinction.
The intervention is applied only once to an already-enabled world.

## What remains open

Multiple complete cycles, additional donor populations, held-out schedules,
behavior-specific tests and neural ablations are needed before claiming durable
adaptation. No model here guarantees increasingly intelligent agents, civilization,
or indefinite survival. The cloud service remains limited by trial credit.
