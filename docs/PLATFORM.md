# Neural ecosystem platform

The first platform milestone provides multiple persistent habitats for evolving
artificial neural agents. It uses the existing compact `World` engine; the
MaleCNS fruit-fly reference keeps its separate entry point.

## Run

Requires Node.js 22 or newer, with no npm runtime packages to install:

```sh
npm run start:platform
```

The dashboard binds to loopback on port 8767. `PLATFORM_PORT` selects another
port; `PLATFORM_RUNS_DIR` selects the checkpoint directory, defaulting to
`runs/platform/`. This first version is a local research workspace.

`PLATFORM_WORLD_WORKERS=1 npm run start:platform` selects a persistent worker
per habitat. This optional backend keeps simulation and checkpoint writes off
the HTTP thread while preserving the same checkpoint format and controls.
Both modes recover habitats paused. `/healthz` reports the selected runtime;
worker habitat metadata also reports owed/discarded ticks and save duration.
See [runtime verification and recovery evidence](RUNTIME_WORKERS.md).

Create a named habitat with a seed, founder count, capacity and resource renewal.
Choose the repeating challenge schedule or original habitat, and independently
enable lifetime learning, inherited mutation and seasonal resources. Ecology can
use fixed food centers or seeded relocations; signals can be normal, disabled or
scrambled. Habitats start paused. Run, pause, step one second or advance ten
artificial seconds.
Select an agent from the list or habitat canvas to inspect its network, traits,
learned weight changes, parents and offspring count. Recently dead agents retain
ancestry metadata; their full lifetime networks are not archived.

## What agents inherit and experience

Each agent has its own recurrent artificial neural controller. The existing
17 inputs describe food and mate bearings, energy, age, danger, a simple local
signal, recent feeding and time. Five outputs govern turning, movement, feeding,
mating and signaling. Resource availability, moving fertility, scarcity and a
stress region provide environmental changes.

The relocation profile uses a separate seed-derived RNG to schedule irregular
food renewal center changes; its state is checkpointed without consuming the
base world RNG stream. Signal ablations change the signal input/output path.
Disabled signals have no emission cost. Scrambling rotates neighboring signal
values by tick and agent identity; it is a control, not a biological model.

Eligible opposite-sex pairs transfer energy to children. Children inherit body
traits and network genes; mutation can change weights, add/remove connections and
add/remove hidden neurons. Acquired weight changes and recurrent activity start
fresh in each child. The founder food-seeking reflex is engineered scaffolding.

One habitat can contain many agents, and one platform process can manage up to
16 independent habitats. In the default backend active habitats share a wall-time
compute budget in rotation; the optional worker backend executes independent
worlds concurrently. Requested speed is a target, not guaranteed achieved speed. Extinction
is terminal; capacity pauses rather than silently discarding births. Increasing
capacity is a recorded intervention. Configuration updates use the engine's
shared validator and must cover both original founders and living population.

## Checkpoints, branches and recovery

Control changes save the affected habitat. Automatic recovery checkpoints occur
every 15 wall seconds, and graceful shutdown saves every habitat. Each habitat
owns its checkpoint directory, RNG, world state and write queue. Concurrent
controls for one habitat execute in order. A failed checkpoint pauses the
affected habitat and reports the error. Corrupt recovery stops startup while
preserving the file for diagnosis.

The Checkpoint button also retains a named manual snapshot. Restore pauses the
habitat and first archives its preceding state. Export downloads an engine
checkpoint. Manual archives are retained; manage/back up local disk storage for
long-running work. An atomic local rename is not an off-site backup.

Fork creates a paused experimental branch of the current world. It copies
genomes, acquired state, lineage and RNG, then evolves independently. **A fork is
an experiment copy, not reproductive offspring.** To compare interventions, fork
one checkpoint and change a single setting. Disabling learning after a fork
retains earlier acquired changes, so that comparison is not equivalent to
disabling learning from birth.

Restart restores all retained habitats paused. Recovery does not reseed an
extinct habitat or advance time before the user starts it.

## HTTP interface

All writes require JSON and accept only local, same-origin requests. Routes are:

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/healthz` | Persistence/simulation error status and habitat count |
| GET / POST | `/api/ecosystems` | List habitats / create `{name, config}` |
| GET | `/api/ecosystems/:id` | Snapshot, runtime metadata and telemetry |
| GET | `/api/ecosystems/:id/frame?sinceTick=&sinceEvent=` | Current world frame and newer events/history samples |
| GET | `/api/ecosystems/:id/agents/:agentId` | Agent genome and acquired state, or archived ancestry |
| GET | `/api/ecosystems/:id/lineage?offset=&limit=` | Paginated ancestry metadata |
| GET | `/api/ecosystems/:id/events?offset=&limit=` | Paginated retained event history |
| POST | `/api/ecosystems/:id/control` | Run, pause, step, speed, configure, checkpoint or restore |
| POST | `/api/ecosystems/:id/fork` | Independent branch using `{name}` |
| GET | `/api/ecosystems/:id/checkpoints` | Retained manual snapshot names |
| GET | `/api/ecosystems/:id/checkpoint` | Download current engine checkpoint |

Step accepts `ticks` from 1 to 1000 (default 10; one tick is 0.1 artificial
seconds). Speed accepts `value` 1, 5 or 10. Configure accepts a `config` containing
capacity, nutrient, learning, mutation or seasonal settings. Restore accepts a
`name` from the retained checkpoint list. Creating a habitat additionally accepts
seed, founders and challenges (`off` or `cycle`).
Creation and configuration also accept ecology (`baseline` or `relocation`) and
signal mode (`normal`, `disabled` or `scrambled`).

## Validation

With the service running, `npm run train:platform` starts or resumes a three-pair
learning campaign. It requires Python 3 (validated on 3.12), using only the standard
library. `PLATFORM_PORT` or `PLATFORM_BASE_URL` selects the service.
`-- --output-dir <directory>` selects campaign storage, `-- --new` starts a fresh
campaign, and `-- --pause-after` leaves its worlds paused at completion. The default
new-campaign horizon is 7,200 ticks; `-- --horizon-ticks <count>` changes it for a
new campaign. Source hashes and matched founder/RNG checks protect provenance.
Completed fixed-horizon observations are retained across resumes.

The [first matched campaign](../evidence/platform-training/summary.md) records
822 births over three seed pairs. Learned changes are active, but results remain
mixed. Full checkpoints and subsequent live counts remain under ignored `runs/`.

The delayed-cue harness (`npm run evaluate:memory`) compares ten matched
fixed-genome seeds on separate training and held-out cue/delay distributions.
Its current learned-minus-frozen interval includes zero; useful memory is not
demonstrated. See [memory-task results](../evidence/memory-task/summary.md).

`npm run evaluate:ecology` compares stable food renewal centers with seeded
relocations across ten matched seed pairs. `npm run evaluate:signals` compares
normal, disabled and scrambled signals. Both publish all seed rows and source
hashes under `evidence/`. These population, feeding and survival outcomes do not
establish cooperation or isolate neural learning.

`npm run profile:platform` measures local compact tick time and serialized frame,
snapshot and checkpoint size at three populations. The MaleCNS scale reference
uses its existing recorded memory assay and is not rerun by this command. See
the [controller view contract](../platform/CONTROLLER_VIEW.md) for each model's distinct
readouts.

```sh
npm test
node --check platform/manager.mjs
node --check platform/server.mjs
node --check platform/web/app.js
```

All 27 automated tests passed in the implementation environment, including six
platform tests for world/branch isolation, inherited offspring with fresh acquired
state, exact checkpoint continuation, concurrent controls, fair scheduling,
recoverable configuration changes, corrupt recovery preservation, persistence
failure behavior and the complete HTTP workflow. The training CLI test additionally
executes fresh seed pairs, checks learning/control measurements and matching,
then verifies that resuming preserves results without duplicating worlds.

System Chromium interaction checks passed creation, agent inspection, stepping,
run/pause, checkpoint, fork, configuration, restore and reload, with no page
errors. Desktop and 390px mobile screenshots were inspected; mobile had no
horizontal overflow. Local QA outputs are ignored under `runs/platform-qa/`.

One unforced seeded run started with 24 agents and recorded 63 births, 2 deaths,
85 living agents, deepest living generation 4 and 23 structural mutations over
211 artificial seconds. Its energy-accounting residual was approximately
`-5.82e-11`. This is one descriptive run, not evidence of a learning advantage,
robust adaptation or indefinite survival.

## Larger goal and next milestones

The practical direction is evolving artificial agents with increasingly rich
experiences. Reproducing a human brain would require different anatomical data,
physiological models and validation; it is not established by this platform.

The next milestone is **learning and memory that improve performance on unseen,
unpredictable tasks**. The current repeating challenge schedule is a baseline;
survival on that schedule does not demonstrate this milestone.

1. **A memory task:** show a cue identifying a later food location, remove the cue,
   then test the agent after a delay. Randomize cue locations and delays while
   preventing access to future task state through sensors or the clock.
2. **Unpredictable evaluation:** separate training and test seeds and task
   distributions. Evaluate unseen food relocation, hazard timing and reward
   delays. Freeze inherited genomes during evaluation so body/topology evolution
   does not confound the learning comparison.
3. **Acceptance criteria:** compare learning enabled, disabled from birth, and
   acquired memory reset with matched genomes, initial conditions and compute
   budgets. Record task completion, cumulative reward, energy efficiency and
   adaptation after a change across at least ten independent seed pairs. Define
   the primary metric and uncertainty method before running experiments; report
   every seed and failure. Success requires a repeatable held-out improvement and
   a memory-dependent benefit over the reset arm.
4. **Social interaction:** explicit signals and resource exchange, with measurable
   cooperation/competition outcomes rather than assuming social intelligence.
5. **Scalable experiments:** engine adapters, worker isolation, bounded lineage
   archives, reproducible experiment batches and a deployment/recovery assessment.

Human-inspired tasks are useful design targets. Human-level cognition,
consciousness and a biologically faithful human brain are separate claims that
require their own evidence.

## Experimental autonomous-learning track

A separate `trace-actor` controller now provides engineered sensory traces and
reward-trained readouts. Creation accepts `controller: "trace-actor"`, validated
`actorParameters`, and `reproduction: false` for controlled within-life studies.
Existing habitats retain the `hebbian` controller. The web learning lab runs
checkpointed cue and ecological parameter searches in a child process, with
independent evaluation gates and published failures. The earlier inconclusive
memory report above concerns the original controller; new trace-actor results
must be read separately. See [AUTONOMY.md](AUTONOMY.md) and the campaign evidence.
