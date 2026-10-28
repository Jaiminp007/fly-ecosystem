# Episodic movement-speed experiment

Latest follow-up: [future-value experiment and current checkpoint](EPISODIC_VALUE.md).

Recorded 2026-10-23T17:49:38.572Z. The full autonomous-improvement goal remains active. RSI and human-like cognition are unproven.

## Implemented controller

An opt-in episodic controller now adjusts either turning or movement speed. The default remains turning. The movement experiment keeps inherited steering fixed, freezes neural plasticity for both steering and movement, and lets memory choose a bounded slower/faster correction. Other configured neural outputs can still learn. Both acquisition systems can be disabled independently using `memoryLearning` and `neuralLearning`. Stored returns remain discounted averages of observed food minus actual energy cost; this rule has no bootstrapped estimate of rewards beyond its credit window.

The movement correction is applied to output 1 and is bounded with the final output in [-1, 1]. A gain of 2 makes the tested choices stop or move at inherited full speed. Motor sample RNG draws remain in place, so acquisition ablations preserve their underlying random streams. Memory storage and retrieval still incur the declared energy charges. Offspring start with fresh acquired state.

The observer labels movement decisions slower/faster and exposes the actual applied `correction`. Legacy `turnCorrection` is zero in movement mode. Old turning checkpoints without the new fields retain turning behavior. The new-habitat form offers experimental movement-speed control; creating that controller is separate from passing its learning gate.

## Design and locked selection

[Protocol](../evidence/episodic-credit/072d24fd-1d0f-4181-a09b-418becf4b1ba/protocol.json) and [results](../evidence/episodic-credit/072d24fd-1d0f-4181-a09b-418becf4b1ba/results.json).

The development stage compared 6 human-written candidates on 10 fresh matched seeds. It varied representation, motor gain, action/credit duration, and neural acquisition. The ranking first enforced mean population guards against all required controls, then maximized the smallest mean energy difference. It locked **move-mixed-8** before the 30-seed confirmation. No selection was repeated using those held-out outcomes.

| Candidate | Mean energy minus globally frozen | Mean energy minus neural | Mean energy minus memory disabled | Population guards |
| --- | --- | --- | --- | --- |
| move-mixed-8 | -1.17 | 3.82 | -0.64 | met |
| move-memory-only | -0.36 | 4.62 | -0.36 | failed |
| move-local-small | -0.74 | 1.50 | -0.83 | failed |
| move-local-8 | -0.89 | 4.09 | -0.36 | failed |
| move-local-delayed | -1.02 | 3.96 | -0.49 | failed |
| move-local-16 | -2.00 | 3.68 | -1.55 | failed |

All habitat runs used 24 matched founders over 1800 ticks (180 artificial seconds), with reproduction and mutation disabled. Per-seed founder hashes are checked. The selected action hold and credit window were both 8 ticks. Seed-level paired 95% intervals are reported; ticks are not treated as independent replicates.

## Confirmation outcome

**Joint gate: failed.** The gate requires positive lower energy-difference intervals and no mean survivor loss versus globally frozen, existing neural, and matched memory-disabled controls, plus retained capability in the separate cue task. Difficulty and the long-running live controller remain unchanged.

Energy differences below are net energy per founder. Population differences are ending survivors per world.

| Control | Learned minus control energy [95% interval] | Learned minus control population [95% interval] |
| --- | --- | --- |
| frozen | -1.08 [-1.84, -0.31] | -0.30 [-0.52, -0.08] |
| previous | 4.96 [4.11, 5.81] | -0.07 [-0.36, 0.23] |
| neural | 4.88 [4.14, 5.63] | 0.03 [-0.27, 0.34] |
| noCorrection | 6.44 [5.65, 7.24] | 0.17 [-0.16, 0.49] |
| fifo | 0.14 [-0.38, 0.66] | -0.03 [-0.24, 0.17] |
| noMemory | -0.98 [-1.54, -0.42] | -0.30 [-0.52, -0.08] |

The neural comparison improved, but the matched acquisition controls did better. The memory-disabled comparison holds the candidate's neural-learning setting constant and removes memory acquisition from birth. It also removes the associated learned-memory storage and retrieval charges; this is a cost-inclusive mechanism comparison. The result does not establish that experience memory improves habitat outcomes.

The separate memory-subcomponent gate passed on fresh cue-task seeds. It uses a discrete choice adapter and does not demonstrate retained competence in the same moving body.

## Counterfactual horizon diagnosis

[Diagnostic protocol and raw results](../evidence/episodic-credit/072d24fd-1d0f-4181-a09b-418becf4b1ba/horizon-diagnosis/results.json). This is post-hoc same-seed analysis, separate from the untouched confirmation above.

At fixed decision-aligned ticks 400, 904, 1400, the diagnostic cloned the world and forced one target-agent choice to slower or faster. It restored the same future target decision RNG after that intervention; the other initial streams were identical. Normal learning and later dynamics continued separately. No fork outcome entered the baseline or a live agent.

There were 60 fork pairs across 10 seed trajectories. For every case, the fork choosing the factual action matched the unmodified natural trajectory's full checkpoint exactly at the final diagnostic horizon. The untouched baseline also reproduced each recorded full-episode outcome.

The short horizon was 8 ticks (0.8 artificial seconds); the longer horizon was 128 ticks (12.8 seconds). Agreement fractions are calculated per seed over comparable cases, then summarized across seeds. Energy effects are per target agent, conditional on the sampled visited states.

| Diagnostic measure | Seed mean [95% interval] |
| --- | --- |
| shortAgreement | 55.7% [43.6%, 67.7%] |
| longAgreement | 68.0% [53.9%, 82.1%] |
| shortLongDisagreement | 52.3% [37.4%, 67.3%] |
| meanShortDifference | 0.28 [0.14, 0.43] |
| meanLongDifference | 0.69 [-0.05, 1.44] |
| naturalChoiceGainOverRandomFirstChoice | 0.50 [0.24, 0.77] |
| greedyChoiceGainOverRandomFirstChoice | 0.53 [0.22, 0.84] |

The sign of the action's energy effect often changed between horizons. The natural policy also showed a positive local effect versus randomizing only its first choice at these sampled states. These conditional results do not establish a full-life advantage over memory-disabled agents. They do not identify the cause of the whole-episode failure. Costs, visited-state distributions, value estimation and longer-term credit remain hypotheses to test.

The initial diagnostic attempt used an unaligned snapshot and failed with the reported error `Snapshot is not at a decision boundary`. Its source and protocol are retained in [the failed attempt](../evidence/episodic-credit/072d24fd-1d0f-4181-a09b-418becf4b1ba/horizon-diagnosis-invalid-boundary/failure.json). Snapshot times were then rounded up to the next decision boundary. The initial successful analysis is retained separately; the final version additionally verifies factual-action checkpoints and reports energy-weighted choice effects.

## Verification and live state

- Node regression suite: **50 passed, 0 failed**. Coverage includes output routing, independent acquisition switches, accounting, fresh offspring, invalid modes and exact continuation.
- 9 prior-policy compatibility checks across prior episodic and neural policies reproduced their recorded outcomes exactly. These are compatibility replays, not new independent replications.
- Server restart recovered 6 habitats with identical metrics and resumed only the previously running habitat.
- Browser interaction exercised the actuator picker and the actual movement-memory panel at 390 and 1440 CSS pixels; scroll width matched viewport width.
- The [audit](../evidence/speed-memory-inspection/audit.json) recomputed all comparisons, verified archived source hashes and seed separation, and checked factual-action fork equality.

At 2026-10-23T17:49:38.572Z, the existing **Trace actor · food-renewal control** was running at 10× target and **9.28× measured**, with 50 agents at tick 829958. Mean network size was 1152.86 nodes. The measured speed is completed ticks multiplied by engine `DT`, divided by elapsed wall time. It does not measure animation frame rate or biological realism. Animation smoothness was not measured in this experiment. [Runtime samples](../evidence/speed-memory-inspection/runtime.json).

## Next experiment toward the full goal

Test a learning rule that includes estimated future value beyond the immediate action window, alongside the existing mean-return rule. Keep the established matched controls, cost accounting, population guards, separate retained-task check and fresh final confirmation. If a target includes an estimated future component, inspect it separately from observed rewards. This is a proposed algorithm experiment; the present data does not prove it will fix transfer.

Reliable ecological learning, retained skills in one moving body, harder-environment transfer, autonomous changes to the learning process, and richer agents/worlds remain required. None of the current results establishes RSI.

## Reproduce

```sh
node scripts/episodic-credit-study.mjs evidence/episodic-body/ee41ec59-eef4-4261-a4e9-42d7aa8bba61/results.json '' learning/episodic-speed-candidates.json
node scripts/diagnose-episodic-horizon.mjs evidence/episodic-credit/072d24fd-1d0f-4181-a09b-418becf4b1ba
```

A third argument to the study runner resumes that directory only when source hashes match. Exact sources are archived in each campaign's `sources/` directory. Run historical sources with the archived tree as the working directory and an absolute reference-results path.
