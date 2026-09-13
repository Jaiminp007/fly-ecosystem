> **Model correction:** The published v1/v2 population used compact artificial networks, not the Google/Janelia connectome. The primary local entry point now runs the actual MaleCNS graph. The existing Railway deployment still runs the legacy compact model until a full-brain deployment is verified. See [MaleCNS integration](docs/MALECNS.md). No legacy results establish anything about the full-connectome model.

# Afterwing

**Small lives. Long histories.**

[Open the legacy compact observatory](https://afterwing-production.up.railway.app) · [Releases](https://github.com/Jaiminp007/fly-ecosystem/releases)

The Railway deployment runs on limited trial credit with a persistent volume.
Public controls are read-only; availability beyond the trial is not guaranteed.

A local artificial-life experiment in which every visible fly has independent
state for the **166,700-neuron MaleCNS v1.0 graph**. The arena connects engineered
food stimuli to annotated LC9 visual cells and decodes annotated DNp09/MN9 activity
into movement and feeding. Offspring inherit gain traits and full graph topology.
The published v1/v2 compact experiment remains available only as an explicit legacy mode.

## The changing world

Four repeating challenges change food renewal and introduce a moving stress zone.
Watch phase outcomes in the observatory, or start an original-habitat control locally.
[Challenge design and limitations](docs/CHALLENGES.md) · [Measured comparison](evidence/challenge-release/summary.md)

## Project status

Version 3 is a local full-connectome integration under active validation. Its
retinal adapter, body decoder, physiology and reproduction rules are engineered
model assumptions. It is not a biological emulation or evidence of intelligence.
The public Railway deployment is still the archived compact experiment.

- [Model and architecture](docs/ARCHITECTURE.md)
- [Release checklist](docs/RELEASE_PLAN.md)
- [Hosting and deployment](docs/DEPLOYMENT.md)
- [Extinction investigation](evidence/extinction/report.md)
- [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

## Run

The default requires Python, the packages in `requirements-connectome.txt`, a C++17
compiler, and the verified MaleCNS data. Prepare it once as described below.

```sh
npm start
```

Open [the MaleCNS observer](http://127.0.0.1:8766/). The server binds only to
localhost, runs a bounded experiment, then pauses and checkpoints. No cloud account
or API key is required. Use `npm start -- --steps 600 --founders 2 --capacity 4`
to select the bounded run. See [the full model and its limits](docs/MALECNS.md).

To run the old compact control panel, use `npm run start:legacy` and open
http://127.0.0.1:8765/. Its population results do not describe the MaleCNS model.

## Legacy compact model

The following controls, implementation notes, experiments, and JavaScript files
describe the retained v1/v2 compact model. They are preserved for comparison and
for the public Railway observatory; their results do not apply to the MaleCNS arena.

### Controls

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

### Legacy implementation

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

### Legacy verification and experiments

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

## MaleCNS preparation and assay

`scripts/connectome.py` and `vendor/stonkfly/neural/` verify source checksums,
prepare the retained MaleCNS graph, and provide the approximate spiking kernel used
by the v3 arena. The upstream MIT license is preserved. See `THIRD_PARTY.md`.

This path needs Python, NumPy, pandas, PyArrow, a C++17 compiler, several GB of
local memory, and roughly 1.1 GB of source downloads plus generated files. Use an isolated environment:

```sh
python3 -m venv .venv-connectome
.venv-connectome/bin/python -m pip install -r requirements-connectome.txt
.venv-connectome/bin/python scripts/connectome.py prepare
.venv-connectome/bin/python scripts/connectome.py assay --ms 100
```

Strict numeric checks fail the assay on invalid operations. Read the recorded
`evidence/connectome-assay.json` and validation notes for the tested environment.
The arena creates independent full-connectome offspring and inherits three gain
traits. One uninterrupted v3 run produced a generation-1 offspring at 30 artificial
seconds; this establishes one birth, not a self-sustaining population. Structural
neural evolution remains absent. Read `docs/MALECNS.md` before interpreting or
extending the experiment.

## Repository map

- `connectome/`: primary MaleCNS arena, observer, checkpoints, and assays.
- `engine.mjs`: legacy compact world, artificial genomes, neural state, inheritance and persistence.
- `server.mjs`: legacy compact local process, recovery, and HTTP API.
- `dist/`: legacy compact visual control panel and optional feature-detected WebMCP tools.
- `tests/`: legacy compact model and HTTP regression checks.
- `scripts/experiment.mjs`: reproducible compact-model ecological comparisons.
- `scripts/connectome.py`: MaleCNS data preparation and low-level neural assay.
- `evidence/`: measured results; `runs/` and `data/`: ignored local state and datasets.

UI source, JavaScript syntax and HTTP behavior are checked. Browser screenshot
and interaction QA, and a supported-browser WebMCP contract test, have not been
performed unless explicitly recorded in the validation notes. Optional WebMCP
availability does not affect normal controls.
