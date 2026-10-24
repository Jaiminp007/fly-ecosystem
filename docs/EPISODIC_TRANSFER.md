# Episodic memory and habitat transfer

Latest follow-up: [movement-speed experiment and current checkpoint](EPISODIC_SPEED.md).

Recorded 2026-10-23T17:28:59.065Z. Local compact-model research; RSI and human-like cognition remain unachieved.

## What is implemented

Bounded experience memory stores observed sensory features, sampled correction actions, and subsequent discounted food-minus-cost rewards. It does not receive correct-action labels. Memory replacement can use reservoir sampling or FIFO. The optional embodied controller combines memory-selected turn corrections with an engineered food-seeking neural scaffold, and freezes neural turn plasticity so its updates are not attributed to a different executed action. Other enabled neural outputs can still learn.

Memory capacity, action duration, reward-credit duration, representation, exploration and explicit memory storage/lookup energy charges are saved in each protocol. Children start with fresh acquired memory. New parameters remain opt-in; the long-running trace-actor habitat has not been replaced.

The inspector now captures the actual decision-time neighbors and reward estimates, including experience sequence numbers, observation distances, and whether the choice was recall, exploration, or a tie break. Capture preserves random streams. Later record replacement cannot rewrite that captured explanation. The experimental controller is also available in the new-habitat picker.

## Results and advancement gates

Each habitat confirmation used 30 fresh seed pairs, 24 matched founders per world, and 1800 ticks, with reproduction and mutation disabled. Energy differences are per founder. Intervals are seed-paired 95% intervals. The frozen control disables both neural and episodic acquisition from birth; the neural comparator uses the existing trace actor. These comparisons answer different questions.

| Experiment | Locked selection | Energy minus frozen [95% interval] | Energy minus neural [95% interval] | Mean population minus frozen | Memory task | Joint gate |
| --- | --- | --- | --- | --- | --- | --- |
| [Sensory representation search](../evidence/episodic-body/ee41ec59-eef4-4261-a4e9-42d7aa8bba61/results.json) | mixed | -0.64 [-1.51, 0.23] | -0.71 [-1.82, 0.41] | -0.07 | pass | fail |
| [Action/credit duration search](../evidence/episodic-credit/37bf0467-36b8-45a5-b7c9-5f1cc2f5bc5c/results.json) | aligned-8 | -0.42 [-1.22, 0.38] | -0.34 [-1.31, 0.64] | -0.13 | pass | fail |
| [Local sensory representation search](../evidence/episodic-credit/accf4ed9-962c-4053-86d7-84803187789d/results.json) | mixed-previous | -0.28 [-1.13, 0.57] | -0.77 [-1.61, 0.08] | -0.03 | pass | fail |

The joint gate requires a positive lower energy-difference interval and no mean ending-population loss versus both frozen and existing-neural controls, plus retained cue-task capability. None passed. Environmental difficulty has not advanced. Memory-subcomponent success is not a claim that the embodied controller learned to survive better. Each held-out result is final for its campaign; no candidate was selected again using its confirmation data.

The original [conflicting-context study](../evidence/context-learning/d5d94f5a-019e-44f9-917f-823fe0ab56e6/results.json) retained A at 97.5% after learning B and reached 97.1% on B across 30 fresh seeds. It used a different, discrete action adapter. Acquired-memory and cue/context-reset controls removed its advantage. This is a limited retained-skill result, not broad continual learning in a moving body. The archived [compatibility replay](../evidence/context-learning/d5d94f5a-019e-44f9-917f-823fe0ab56e6/compatibility-replay/results.json) reproduced its recorded outcomes; that replay is not independent statistical confirmation.

## What the new experiments changed

The temporal-credit search compared fixed action holds and credit windows. It selected aligned-8 on development seeds, then failed the untouched confirmation. Matching the credit duration to the action hold did not establish improved learning.

A [same-seed diagnostic replay](../evidence/episodic-credit/37bf0467-36b8-45a5-b7c9-5f1cc2f5bc5c/retrieval-diagnosis.json) preserved exact final population, energy, food and expenditure across 10 seeds. Of 38552 decisions with at least 64 stored experiences, 91.8% retrieved examples for both turn directions. Mate and clock channels contributed 63.9% of the summed squared distances to retrieved neighbors. This describes the retrieval metric; it does not prove those channels caused failure.

That motivated an optional local representation: retrieve using food channels, obstacle probes, scent and previous intake, excluding mate channels, clocks, age, energy and bias. All neural inputs remain available. Its development comparisons were:

| Candidate | Mean energy minus frozen | Mean energy minus neural | Mean population minus frozen | Mean population minus neural | Population guards |
| --- | --- | --- | --- | --- | --- |
| mixed-previous | -0.17 | -0.03 | 0.20 | 0.10 | eligible |
| local-aligned-4 | -0.55 | -0.41 | 0.10 | 0.00 | eligible |
| mixed-aligned-8 | -1.24 | -0.82 | 0.00 | 0.00 | eligible |
| local-previous | 0.33 | 0.47 | 0.00 | -0.10 | rejected |
| local-aligned-16 | 0.22 | 0.19 | -0.40 | -0.20 | rejected |
| local-aligned-8 | -1.09 | -0.67 | -0.10 | -0.10 | rejected |

The predeclared ranking selected mixed-previous, which retains the previous representation. Local variants were not selected. The local study's held-out run therefore confirms the selected prior policy on fresh seeds; it is not held-out evidence about a local variant. Three-seed compatibility checks across prior episodic policies and the neural comparator remained exact after adding the optional mode.

## Live state and checks

At 2026-10-23T17:28:59.065Z, **Trace actor · food-renewal control** was running at 10× target and 8.65× measured in a short observation, with 39 agents at tick 730635. Mean network size was 1046.51 nodes. This is one evolving trajectory; network growth and survival are not measurements of intelligence.

The ecological parameter search finished at round 72, stage scarcity, status round-budget-reached. Its service reports running=false. It has not passed the joint difficulty gate. The active Codex research goal is separate from that bounded trainer process.

- Regression suite: 48 passed, 0 failed.
- Decision capture, RNG preservation, action-aligned credit accounting, fresh offspring memory, malformed checkpoints and exact checkpoint continuation are covered.
- Browser interaction exercised the episodic-controller picker and actual recalled-experience panel. Geometry checks at 390 and 1440 CSS pixels found no horizontal overflow. Raw screenshot capture showed blur/duplication and is not presented as sharp visual proof.
- [Study audit](../evidence/memory-inspection/study-audit.json) recomputed every interval, verified archived source hashes, and checked disjoint seed sets across the new campaigns.
- [Runtime observation](../evidence/memory-inspection/final-runtime.json) and [compatibility evidence](../evidence/memory-inspection/local-mode-compatibility.json) are retained.

## Continue toward the actual goal

The next useful intervention should change what the memory controls or test its predictive value, rather than repeat these failed parameter searches. One concrete experiment is episodic control of movement speed while holding steering fixed: the existing inherited steering already approaches visible food, so random turn corrections may be an unhelpful learning interface. Test that hypothesis against matched learning-off, zero-correction, and existing-neural controls, preserving a fresh final confirmation and the current survival guards. It is a hypothesis, not a finding from the current data.

Still required for the full goal: reliable ecological learning, retained skills in the same moving body, harder-environment transfer, validated autonomous changes to the learning process, and only then richer bodies/worlds. Human-like cognition, biological species transitions, planetary simulation, and a recreation of human evolution remain long-term research objectives.

## Reproduce

Temporal-credit study on current sources (creates a new campaign):

```sh
node scripts/episodic-credit-study.mjs evidence/episodic-body/ee41ec59-eef4-4261-a4e9-42d7aa8bba61/results.json
```

Local-representation study (the empty argument requests a fresh directory):

```sh
node scripts/episodic-credit-study.mjs evidence/episodic-body/ee41ec59-eef4-4261-a4e9-42d7aa8bba61/results.json '' learning/episodic-local-candidates.json
node scripts/diagnose-episodic-retrieval.mjs evidence/episodic-credit/37bf0467-36b8-45a5-b7c9-5f1cc2f5bc5c
```

Pass a campaign directory as the third argument to resume only when its saved source hashes match. Completed results are preserved; changed sources are refused. Each campaign archives its exact source tree under `sources/`. To reproduce historical sources, run the archived script with that archived tree as its working directory and an absolute reference-results path; do not mix archived imports with the current working tree.
