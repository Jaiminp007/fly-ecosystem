# Autonomous learning research

Afterwing now has two compact controller profiles. The original `hebbian` profile retains its existing reward-modulated weight rule. The experimental `trace-actor` profile adds explicit fast/slow sensory traces and a stochastic readout with reward-weighted score updates. Its memory traces and founder food reflex are engineered scaffolding. This is not a biological connectome or a self-written learning algorithm.

## What runs autonomously

The learning lab proposes bounded controller parameters, trains matched agents from scratch, checks a fresh seed batch, and saves each decision. It raises task difficulty from cue association to delayed memory, distraction, and longer noisy delays. Candidate search and validation use different seeds. A final thirty-seed batch is reserved until parameters are locked. Learning-disabled, acquired-state reset, cue-memory reset, and fixed reflex arms are retained in the final report.

Only learning scale and trace retention are proposed in the one-choice cue task. Exploration and eligibility decay do not identify effects in that protocol and stay fixed. The search adapts its proposal scale after acceptance/rejection. Earlier-task regression checks retrain each candidate on the earlier tasks; these checks do **not** establish lifelong retention of already learned skills.

The internal accuracy gate uses a 90% lower seed-level confidence bound; the final held-out accuracy gate uses 85%. Both require a positive, substantial gain over learning-disabled and memory-reset controls. A fresh-batch candidate improvement and earlier-task regression checks are required before parameter promotion. Every proposed candidate and failed gate is saved. A task gate pass is not a claim about habitat survival or general intelligence.

The ecology search starts only after the independent cue gates pass on the current model source. It tests scarcity, relocating food under scarcity, and more severe scarcity. Reproduction and mutation are disabled, the observation interval is shorter than founder lifespans, and all arms start with matched founders. Net energy per initial agent is primary; food intake, expenditure, population, and motor outputs are recorded alongside it. Eating more can mean spending more energy.

Each ecological proposal changes one parameter. A parameter promotion requires a fresh-seed energy improvement over the incumbent and a retained capacity to learn the noisy cue task. Increased environmental difficulty additionally requires a positive learning-on versus learning-disabled energy interval and no average population loss. A parameter improvement without that learning comparison remains optimization of settings, not evidence of within-life learning.

Ecological proposals can also route plastic updates to a subset of the five motor readouts (`plasticOutputs`, an integer bit mask: turn 1, move 2, eat 4, mate 8, signal 16). The default remains all outputs. Unselected readouts keep inherited weights and stochastic exploration. This intervention was motivated by a recorded extinction replay; a same-seed rescue is a development diagnostic and must pass fresh-seed comparisons before promotion.

These gates guide an adaptive search. Their intervals describe the seed batches actually evaluated; repeated campaigns and proposals do not carry a family-wide 95% guarantee. Independent confirmation after locking the final ecological policy is still required. Earlier campaigns, failed final gates, and incomplete campaigns remain published rather than being discarded.

## Controls and persistence

Open **Autonomous learning lab** in the web app. Start/resume a cue campaign, pause it, or create a new campaign after a completed report. **Test harder habitats** starts the ecology search after the cue gates pass. Work runs in a child process, so evaluations do not block habitat controls. Pause completes the current bounded evaluation unit and checkpoints progress; resume keeps the campaign identity and accepted settings.

Commands:

```sh
npm run observe:autonomy
npm run train:autonomy -- --new --rounds 12
npm run train:ecology -- --rounds 2
npm run evaluate:actor-world
```

`observe:autonomy` creates learning/frozen habitats on the running local platform, runs both at requested 10× speed, samples all living agents' five motor outputs and feeding observations, then pauses and exports them. It samples behavior rather than recording every simulation tick. Final live ticks may slightly exceed the target, and the report records actual clocks. Use fixed-horizon local evaluations for exact comparisons.

The web service exposes local same-origin `GET /api/autonomy` and `POST /api/autonomy` controls (`start`, `start-ecology`, `stop`). The CLI supports `--directory`, `--rounds`, and `--new`. State lives under ignored `runs/autonomy/`; campaign evidence is retained under `evidence/autonomous-learning/` and `evidence/ecology-search/`. Source changes reject a resume rather than mixing implementations silently. New campaigns preserve earlier published evidence.

`node scripts/resource-pressure-study.mjs` prerecords a fresh ten-seed protocol, then compares the recorded live study's lower/higher food renewal with learning enabled/disabled. It preserves reproduction and mutation, so it measures coupled population trajectories, not an isolated lifetime mechanism. Outcomes include every seed, energy/lifespan deaths, capacity stops, and population histories. The short ecological evaluator remains the separate reproduction-disabled experiment.

`node scripts/continual-learning-study.mjs` evaluates fixed accepted settings on thirty fresh seeds. Each agent learns association A, then learns association B without clearing acquired weights, then is tested on both. Frozen, acquired-reset and cue-memory-reset controls are included. The tasks use disjoint cue channels, which limits interference by construction. A pass establishes retention in that narrow setup; it does not establish general continual learning, conflicting-task retention, or ecological transfer. The lab labels this scope explicitly.

`node scripts/confirm-ecology.mjs` locks the completed ecological campaign's accepted policy, prerecords 100 fresh seed pairs, and compares learning enabled/disabled over 180 seconds of scarcity. Reproduction and mutation are disabled. The primary endpoint is net energy per founder. The joint gate also requires no mean ending-population loss. Results and failed gates remain visible. This confirmation does not automatically alter a habitat or override the search's difficulty gate. A later policy needs a new independent confirmation.

Select **Trace actor with sensory memory (experimental)** when creating a habitat to observe this model in the ecological world. Each fly and each child starts with fresh acquired weights. Checkpoints retain acquired state and exploration RNG exactly. The displayed graph shows the actual memory scaffold and readout connections; memory wiring is protected from unsupported structural mutations.

The renderer remembers the chosen habitat. With no saved choice, it opens a running population before archived extinct worlds. The lab's accepted settings are kept separately from existing habitats; a cue-task pass does not silently change a live population's controller.

## Runtime measurement

The trace actor caches incoming connection indices for inherited hidden nodes. This is a derived lookup, absent from checkpoints and model randomness. It preserves edge order and arithmetic. A recorded world replay and full acquired-state comparison check that this optimization preserves the trajectory.

Reproduce the controller comparison with the preserved reference and checkpoint:

```sh
node scripts/profile-actor.mjs \
  --reference evidence/actor-profile/reference-trace-actor.mjs \
  --checkpoint evidence/actor-profile/checkpoint.json \
  --output /tmp/actor-profile.json
```

That is a controller microbenchmark using repeated recorded observations, not full-world throughput. The live speed observations record actual simulation time per wall second and their concurrent workload; setting the speed to 10× is not itself evidence that the machine sustains it.

## Progress toward the long-term goal

Useful reward-based learning on these engineered tasks is a testable milestone. Ecological transfer, continual learning across distinct tasks without erasing earlier skills, richer embodied tasks, and learned proposals for changes to the learning algorithm are separate milestones. The present optimizer has a fixed, human-written proposal/evaluation algorithm. It cannot yet demonstrate RSI, human cognition, biological species transitions, or a recreation of human evolution.

The update is inspired by the score-function reinforcement method in [Williams (1992)](https://doi.org/10.1007/BF00992696), with engineered traces and normalized update sizes; it makes no claim of inheriting the paper's guarantees. The idea of retaining prior task competence while searching for new solver modifications is discussed in [POWERPLAY](https://arxiv.org/abs/1112.5309). Those papers provide methodological context, not evidence for this implementation. Use the project's seed-level reports to judge its results.
