# Afterwing improvement plan

Date: 2026-10-22. This document began as a source-based implementation plan. The phases below have since been implemented in this checkout and the evidence files linked at the end record the verification. Scientific acceptance criteria that are not met are identified as open outcomes rather than being presented as completed discoveries.

## Purpose and direction

Build an artificial-life lab where people can watch individual agents survive, reproduce, and evolve, then test whether their experience helps them handle unfamiliar situations.

Put this at the top of the app:

**Watch neural agents survive and evolve.**

“Follow individual lives, trace inherited traits, and test whether learning helps in a changing habitat.”

Keep a visible model label: **Compact neural model** for the platform and **MaleCNS connectome model** for the separate full-graph runtime. The current project contains both; their results must remain distinguishable. The compact model is the practical starting point for rapid world and experiment iteration. Preserve the full-connectome track as a separate scientific milestone.

The intended experience: open a habitat, see movement immediately when it runs, follow one agent, understand a birth or death, change a condition, and compare the result against a control.

## What is already real

- `engine.mjs` implements recurrent controllers, reward-modulated weight changes, inherited traits, structural mutations, resource competition, reproduction, and energy accounting. Founders receive an engineered food-seeking reflex.
- `platform/manager.mjs` provides independent habitats, serialized controls, saved state, paused recovery, and experimental forks. Keep these foundations.
- `challenges.mjs` provides four repeating environmental phases. These introduce pressure, but a predictable cycle does not establish generalization.
- `telemetry.mjs` exposes reproductive bottlenecks and a limited death window. The UI currently shows only a small part of what would explain population change.
- The recorded three-pair campaign in `evidence/platform-training/summary.md` reports 412 births with learning and 410 without. Outcomes vary by seed. Weight changes are occurring; a consistent useful-learning benefit has not been demonstrated.
- The recovered local habitat has 27 living agents, 2,867 births, 2,864 deaths, and generation 153 at tick 176,688. It is paused after recovery. This is an interesting long-lived trajectory, not a controlled learning result.

## Why the current experience feels flat

1. **Motion is sampled too slowly for watching.** `platform/web/app.js` polls every 1,500 ms and redraws the world during rendering. There is no animation loop interpolating snapshots.
2. **Most behavior is invisible.** The snapshot includes position and energy but omits actions, sensor readings, feeding amounts, and signal output. A moving dot cannot explain what the controller is doing.
3. **Events lack context.** The interface shows eight recent text events. It does not connect a birth to its parents on the map, show a selected agent's life history, or explain an energy-depletion trend.
4. **The inspector has correctness problems.** Its automatic preview takes the first living agent and labels it “Founder example,” even if that agent is a descendant. It caches that preview instead of refreshing activity. A failed request can leave the same preview suppressed on retry.
5. **The previous UI edits need cleanup.** The brain canvas is 260 pixels tall while node placement extends beyond that height; `.traits` has no matching styling; intermediate-width grid rules target elements now nested inside `.network-view`. These are source findings, not a completed browser regression pass.
6. **Growth is easy to mistake for progress.** More neurons, larger acquired weight changes, or more generations do not by themselves show better adaptation. The recovered habitat averages roughly 337 nodes per living agent, making rendering and compute growth worth measuring before increasing scale.

## Phase 1 — Make the existing habitat enjoyable to observe

Deliver this first, without changing simulation behavior.

### 1. Repair and simplify the interface

- Use the purpose statement above and make the habitat the dominant part of the first screen.
- Keep Run/Pause, speed, model, simulation time, and connection freshness beside the world. Put setup and checkpoint controls in expandable panels.
- Show a useful selected-agent state immediately, with an honest “Following agent …” label. Preserve manual selection, including an archived agent after death.
- Fix preview retries, stale legends, canvas bounds, trait layout, and the intermediate-width inspector layout.
- Update existing DOM elements rather than rebuilding the agent selector and metrics on every poll. Keep focus and keyboard selection stable.
- Use the existing forest/lime palette with clearer contrast and restrained typography. Let actual habitat activity supply the visual interest. The taste skill's landing-page composition rules do not apply wholesale to this application screen.

### 2. Separate simulation updates from animation

- Introduce a small renderer module with `requestAnimationFrame`, device-pixel-ratio sizing, and interpolation between timestamped snapshots.
- Start with lightweight world frames at a proposed 5–10 Hz; retain slower summaries and inspector fetches. Measure payload and server time before choosing the final rate or adding streaming.
- Interpolate headings across the shortest angular path. Handle births, deaths, pause, restart, restore, habitat changes, and stale connections explicitly; never animate a paused or disconnected world as if it is advancing.
- Keep visual effects out of simulation state and its RNG. Add optional short trails, subtle feeding pulses, and birth markers driven by recorded actions/events. Honor reduced motion.

### 3. Follow a life

- Click or tap an agent to follow it; add zoom, pan, and a reset-view control.
- Show energy, age, parents, offspring, generation, recent food intake, and current motor outputs.
- Show senses on demand: food bearing, danger probes, and local signal strength. Describe these as measured inputs/outputs; avoid invented intentions such as “planning” or “afraid.”
- Add event filters, selection-linked events, and “show earlier” pagination. Keep lineage navigation available after an agent dies.

**Acceptance:** At 390, 768, 1024, and 1440 px, controls and selected-agent details remain usable with no clipped network. Movement is smooth on a named reference machine at a documented population. Pausing stops motion; restores clear interpolation buffers. Selection survives refreshes. A user can follow a birth to both parents and distinguish energy depletion from lifespan death. Capture sharp native-resolution screenshots and a short running-world recording.

## Phase 2 — Make changes understandable

- Extend observation data with per-step actions, food intake, energy expenditure, and structured event fields (`agentId`, `parentIds`, `cause`, `tick`). Observation collection must not consume model randomness.
- Add selectable overlays for food availability, danger, ancestry, and energy. Keep the default view readable without overlays.
- Add time-series views for population, births/deaths per interval, energy, food, and network complexity. Label time windows and units.
- Add parent/child trait comparisons and a compact family tree. Show inherited weights separately from lifetime changes.
- Record interventions on the same timeline: nutrient changes, learning switches, forks, restores, and capacity changes.
- Add side-by-side habitat comparison with aligned simulation time. Label a fork as a copy of current acquired state; switching learning off on a fork is not a learning-disabled-from-birth experiment.

**Acceptance:** Every displayed behavior is traceable to engine state or an explicitly documented derived measure. Users can explain a population change using resources, deaths, births, and reproductive eligibility without treating correlation as proof of cause. Export includes model version, configuration, seed, source revision, and intervention history.

## Phase 3 — Demonstrate useful learning and memory

This is the main scientific milestone, consistent with `docs/PLATFORM.md`.

1. Build a delayed-cue food-location task: present a cue, remove it, wait a randomized interval, then allow a choice. Ensure current observations cannot reveal the answer directly.
2. Use separate training and held-out task seeds/distributions. Remove periodic clock shortcuts in this task. Freeze inherited genomes and disable reproduction during evaluation so evolution cannot explain an apparent within-life learning gain.
3. Compare matched agents with learning enabled, learning disabled from birth, and acquired memory reset at defined boundaries. Specify whether each reset affects recurrent activity, plastic weights, eligibility traces, and reward baseline. Add separate ablations if these mechanisms need to be distinguished.
4. Predeclare food-choice success as the primary endpoint, plus food gained, energy cost, and adaptation time as secondary measures. Use at least ten independent matched seed pairs; calculate uncertainty at the seed level rather than counting every tick as independent evidence.
5. Include a simple engineered reflex baseline and publish every seed, failure, and stopping condition. Match trial count and report compute used. Reserve held-out conditions until protocol choices are fixed.
6. If no reliable advantage appears, investigate reward scaling, eligibility decay, memory retention, and task observability in separate controlled runs. Keep the negative result visible.

**Acceptance:** Repeatable held-out improvement against the disabled-learning control, with uncertainty reported, and a performance loss under the relevant memory reset. If those conditions fail, report the feature as experimental plasticity rather than demonstrated useful learning.

## Phase 4 — Enrich ecology one mechanism at a time

After the observation and experiment tools are usable:

- Introduce seeded, unpredictable food relocations and hazards with fully saved environment state. Compare against the existing repeating schedule.
- Trial two resource types and an explicit energy trade-off. Measure whether different strategies persist across seeds before calling them niches.
- Study the existing signal channel before adding more channels. Compare signaling enabled, disabled, and scrambled; measure receiver outcomes and signaling cost before describing cooperation.
- Consider resource exchange only after there is a clear experimental question and accounting model.
- Expose pressure and consequences visually: depleted patches, returning food, stress zones, and reproductive bottlenecks. Retain genuine extinction and explicit capacity pauses.

**Acceptance:** Each mechanism has a matched baseline, persisted state, energy-accounting checks, and visible telemetry. Avoid introducing several mechanisms simultaneously and losing the ability to explain a result.

## Phase 5 — Scale and reconnect the model tracks

- Profile tick time, snapshot size, inspector render time, memory, and checkpoint duration as population, network size, and lineage grow.
- Split lightweight render frames from history/lineage APIs. Paginate archives and define an explicit checkpoint-retention policy before long unattended runs.
- Move simulation work into workers if profiling shows it blocking controls. Preserve deterministic stepping and checkpoint compatibility; do not begin with a framework rewrite.
- Define a controller adapter shared by the observatory while preserving model-specific inputs, outputs, reproduction assumptions, and metrics.
- For MaleCNS, separately establish repeatable movement/feeding, bounded memory use, checkpoint recovery, and baseline behavior before claiming population-scale learning. Compact-model success is not evidence for full-connectome success.
- Assess hosting only after resource measurements and public-control boundaries are known.

## Delivery sequence (implemented)

The first delivery was implemented in these four slices:

1. Inspector correctness, responsive layout, purpose-first copy, stable selections.
2. Render-loop separation, interpolation, pause/stale-state handling, sharp canvas sizing.
3. Action telemetry, selected-agent follow mode, meaningful event markers.
4. Browser checks at the four widths, running-world recording, and a baseline performance report.

Phase 2 observation and comparison tools were implemented before the Phase 4 ecology and signal studies. The Phase 3 task harness is available and its first result is inconclusive. 3D, chat-generated personalities, and larger neuron counts remain out of scope; the next scientific milestone is a replicated, held-out advantage from experience.

## Evidence and implementation boundaries

Primary sources: `engine.mjs`, `challenges.mjs`, `telemetry.mjs`, `platform/manager.mjs`, `platform/web/{app.js,index.html,style.css}`, `docs/PLATFORM.md`, `docs/MALECNS.md`, and `evidence/platform-training/summary.md`.

## Implementation and evidence status

- Phase 1: implemented purpose-first copy, agent follow/selection, responsive CSS rules, stable selector updates, interpolated world rendering, pause/recovery handling, zoom/pan, and reduced-motion behavior. The subsequent UI redesign was checked in a real browser at 390, 768, 1024, and 1440 pixels. `evidence/ui-redesign/browser-report.json` records the measured widths, no horizontal overflow, loaded fonts, visible networks, and no runtime exceptions. Native desktop/mobile screenshots are saved alongside it. A running-world recording has not been captured.
- Phase 2: implemented action/sense/energy observations, structured events, overlays, history plots, lineage/event pagination, trait comparison, habitat comparison, interventions, and checkpoint source/config metadata. `World.frame()` supplies the lightweight render endpoint while histories and lineage remain separate.
- Phase 3: `evidence/memory-task/summary.md` records ten matched seeds and 64 training plus 48 held-out trials per arm. Accuracy was 66.3% learned and 56.3% frozen/reset; learned-minus-frozen was +10.0 points with a 95% interval from -12.6 to +32.6. The acceptance criterion is not met. Treat plasticity as experimental; do not describe useful learning as demonstrated.
- Phase 4: seeded food relocation is checkpointable and preserves the main world RNG. The 10-pair, 7200-tick report in `evidence/ecology-relocation/summary.md` found a mean population difference of -24.83 (relocation minus baseline; 95% interval -31.18 to -18.48). This is an ecology pressure result with evolution and learning enabled, not a causal learning result or evidence of niche formation. The 10-seed signal comparison in `evidence/signal-study/summary.md` found uncertain population and food-eaten differences for normal versus disabled and scrambled signaling; it does not demonstrate cooperation or receiver benefit.
- Phase 5: local profiles cover 24, 120, and 240 founders and record tick time, render-frame/full-snapshot/checkpoint sizes, memory, and energy residuals in `evidence/platform-profile/results.json`. The separate MaleCNS memory fields are prior local assay data explicitly marked as not rerun. A versioned neutral controller-view contract exists for the compact platform and Python MaleCNS arena; it preserves their model-specific fields and does not unify their scientific claims. No web worker migration or hosting proposal was made because these profiles do not establish a need or safe public-control boundary.
- Verification: `npm test` passes 27 tests; `python3 -m unittest connectome.test_controller_adapter` passes; Python compilation, JavaScript syntax checks, and `git diff --check` pass. The recovered local service remains paused. The UI redesign subsequently completed its four-width browser sweep and control checks on a temporary service. No MaleCNS full runtime evaluation, animation recording, or public deployment was performed.

Primary additions include `platform/controller-adapter.mjs`, `connectome/controller_adapter.py`, the four evaluation/profile scripts, and their `evidence/` reports. Existing local UI edits were preserved.
