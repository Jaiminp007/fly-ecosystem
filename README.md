# Afterwing

**Small lives. Long histories.**

[Open the live observatory](https://afterwing-production.up.railway.app) · [Releases](https://github.com/Jaiminp007/fly-ecosystem/releases)

The Railway deployment runs on limited trial credit with a persistent volume.
Public controls are read-only; availability beyond the trial is not guaranteed.

A local artificial-life experiment with two-parent inheritance, individual neural
state, structural mutation and a persistent habitat. The visible ecosystem uses
**compact artificial recurrent networks**, not the biological fly connectome.
A separately runnable MaleCNS assay is included and clearly distinguished.

## The changing world

Four repeating challenges change food renewal and introduce a moving stress zone.
Watch phase outcomes in the observatory, or start an original-habitat control locally.
[Challenge design and limitations](docs/CHALLENGES.md) · [Measured comparison](evidence/challenge-release/summary.md)

## Project status

Versioned artificial-life observatory. Public viewing is supported; hosted writes
require an owner bearer token. The Render Free configuration is an ephemeral demo,
not an always-on or durable research deployment.

- [Model and architecture](docs/ARCHITECTURE.md)
- [Release checklist](docs/RELEASE_PLAN.md)
- [Vercel deployment design](docs/DEPLOYMENT.md)
- [Extinction investigation](evidence/extinction/report.md)
- [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

## Run

Requires Node.js 22 or newer. The compact simulator has no package dependencies.

```sh
npm start
```

Open [the local control panel](http://127.0.0.1:8765/). On macOS, `start.command`
is also a launcher. The server binds only to localhost. No cloud account or API
key is required. Use `PORT=8766 npm start` if the normal port is occupied.

The local world starts paused on first launch. Subsequent restarts preserve the saved pause state. Choose **Run world**, then a requested speed. “Maximum”
uses available computation; the achieved rate is measured separately. Closing the
browser leaves the server running. Stopping the server saves its state; it does not simulate elapsed time while off.

## Controls

- Click a fly, or select its ID, to inspect parents, inherited traits and current memory.
- Pause or advance exactly one world second. World seconds are artificial units.
- Change resource renewal to conduct a recorded environmental intervention.
- Save a checkpoint, restore it, export it as JSON, or import it later. Restoration is paused.
- Start a new seeded world with mutation, lifetime learning and seasonality independently selectable.
- Inspect population history, recent ancestry, birth/death notes and accounting residuals.

The server saves automatic recovery snapshots every 15 seconds, retains twelve
rolling checkpoints at five simulated-minute intervals, and archives terminal
worlds. Corrupt recovery files stop startup instead of being overwritten. User checkpoints
are stored in `runs/`. A new world first saves the previous world. Capacity pauses
the simulation; increasing it is an explicit intervention. There is **no reseeding
after extinction**. Low-resource worlds may die out, and this is a valid result.

## What is implemented

`engine.mjs` is a deterministic fixed-step model with an explicit pseudorandom
state. Local food and agent queries use a spatial index. All neural proposals are
calculated before movement, then individuals consume resources in a reproducibly
shuffled order so fixed IDs do not always get first access.

Each founder starts with a small network containing sensory inputs, hidden units
and action outputs. A disclosed food-attraction reflex is encoded in founder
weights. It is scaffolding for a viable population, **not an evolved finding**.
Movement noise, simplified collision handling and a periodic environmental signal
are model choices. Food-target sensing is an engineered abstraction, not a
reconstructed compound eye or olfactory pathway.

Eligible nearby parents of opposite simulated sexes transfer energy to a child.
The child inherits homologous node/connection genes and selected trait alleles
from both parents. Sex is assigned probabilistically, not by a real chromosome
model. Maturation and lifespan are artificial parameters; eggs, larvae and
metamorphosis are not simulated. One genome describes all life-history traits.

Mutation can alter inherited weights and traits, split an edge with a new neuron,
add/remove edges and remove hidden neurons. Structural innovations receive unique
IDs. Brain topology has no fixed fly-anatomy template. Runs and checkpoint imports
still have finite operational limits, including a local population ceiling and
checkpoint size limits. This is not unbounded evolution.

Lifetime learning uses an explicit candidate reward-modulated Hebbian rule with
eligibility traces, a reward baseline and bounded individual weight deviations.
The teaching signal is food energy received minus immediate expenditure.
Children do **not** inherit acquired deviations or recurrent activity. Mechanical
weight change does not prove useful learning; read the experiment results.

Food renewal is an external energy source. Metabolism, movement and remaining
energy at death are accounted as dissipated energy. Birth energy is transferred
from parents, never created. Lifeline depth is `max(parent depths) + 1`, not a
population-wide discrete generation count. A richer world was selected during
development; low-resource controls are retained in evaluation.

See [measured validation results](evidence/validation.md) for outcomes and limitations.

## Verify and reproduce

```sh
npm test
npm run experiment
```

Tests cover deterministic checkpoint continuation, energy balance, two-parent
inheritance without acquired-memory transfer, valid structural mutations, frozen
learning, extinction, capacity handling, and the HTTP save/restore workflow.

The experiment compares learning plus mutation, frozen lifetime weights, no
inherited mutation, and low-resource conditions on the same independent seeds.
It writes measured results and an engine source digest to
`evidence/experiments.json`. To change the duration or seeds:

```sh
TICKS=10000 SEEDS=5,8,13 npm run experiment
```

The results are descriptive, with a small number of seeds. Population size and
neuron counts are not intelligence metrics. No evidence here establishes open-ended
intelligence, civilization, consciousness, or a learning advantage.

## Full-connectome assay

`scripts/connectome.py` and `vendor/stonkfly/neural/` provide a separate public-data
path. It verifies source checksums, imports the full retained MaleCNS graph under
the upstream inclusion policy, and runs an engineered visual stimulus through
the native C++ kernel. The upstream MIT license is preserved. See `THIRD_PARTY.md`.

This assay needs Python, NumPy, pandas, PyArrow, a C++17 compiler, several GB of
memory, and roughly 1.1 GB of source downloads plus generated files. The compact
app does not need those dependencies or downloads. Use an isolated environment:

```sh
python3 -m venv .venv-connectome
.venv-connectome/bin/python -m pip install -r requirements-connectome.txt
.venv-connectome/bin/python scripts/connectome.py prepare
.venv-connectome/bin/python scripts/connectome.py assay --ms 100
```

Strict numeric checks fail the assay on invalid operations. Read the recorded
`evidence/connectome-assay.json` and validation notes for the tested environment.
The ecosystem does not yet create full-connectome offspring, apply evolutionary
genomes to that graph, or execute those brains as its live agent controller.
Integrating those features requires a distinct biological-modeling study.

## Files

- `engine.mjs`: world, artificial genomes, neural state, inheritance and persistence.
- `server.mjs`: local process, measured timing, automatic recovery and HTTP API.
- `dist/`: visual control panel and optional feature-detected WebMCP tools.
- `tests/`: model and HTTP regression checks.
- `scripts/experiment.mjs`: reproducible ecological comparisons.
- `scripts/connectome.py`: separate biological-data import and assay.
- `evidence/`: measured results; `runs/` and `data/`: ignored local state and datasets.

UI source, JavaScript syntax and HTTP behavior are checked. Browser screenshot
and interaction QA, and a supported-browser WebMCP contract test, have not been
performed unless explicitly recorded in the validation notes. Optional WebMCP
availability does not affect normal controls.
