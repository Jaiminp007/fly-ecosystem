# Future-value learning experiment

Recorded 2026-10-23T18:13:55.863Z. The full autonomous-improvement goal remains active. No RSI or human-like cognition has been demonstrated.

## Implemented rule

The optional `returnMode: td` controller extends the observed reward window with a recalled future-value estimate. The default remains `mean`. It stores a bounded normalized target:

```text
observed contribution = (1 - gamma) * sum(gamma^i * observed reward_i)
estimated future      = gamma^N * max(next-state recalled action values)
value target          = observed contribution + estimated future
```

Rewards come from actual food gained minus charged energy cost, bounded by the engine. Action and credit windows must align, and gamma must be less than one. Next-state values use the same bounded nearest-experience estimator. This is a human-written experimental kernel value-learning rule, with no convergence guarantee or correct-action labels. It does not modify its own algorithm.

On agent death, the final observed transition is recorded with zero estimated future. That acquired memory remains with the dead agent and is not inherited. Both the future-value lookup and the action lookup incur the declared per-record energy charge. Existing observed-window policy outcomes remain compatible.

Targets carry labelled observed and predicted components in checkpoints, recalled experiences and the inspector. For the local inspection example, the observed contribution was 0.013142, the estimated future contribution 0.034525, and the combined target 0.047667. This is one inspected update, not a performance result. The future component is explicitly displayed as a prediction.

## Predeclared experiment

[Protocol](../evidence/episodic-credit/e47816bf-0161-4444-a4cb-51f578b86ca3/protocol.json) · [Results](../evidence/episodic-credit/e47816bf-0161-4444-a4cb-51f578b86ca3/results.json).

The search compared 6 candidates over 10 fresh development seeds. It then locked **value-mixed-995** for 30 untouched seed pairs. All development candidates failed at least one mean-population guard, so the best-scoring policy proceeded as the protocol's explicitly exploratory fallback. The held-out data was not used to reselect a candidate.

| Development candidate | Gamma | Action/credit ticks | Mean energy minus observed window | Mean energy minus memory disabled | Population guards |
| --- | --- | --- | --- | --- | --- |
| value-mixed-995 | 0.995 | 8 | -2.46 | -4.42 | failed |
| value-mixed-99 | 0.99 | 8 | -2.98 | -4.52 | failed |
| value-memory-only | 0.995 | 8 | -3.76 | -4.66 | failed |
| value-local-995 | 0.995 | 8 | -4.66 | -4.50 | failed |
| value-local-16 | 0.99 | 16 | -3.54 | -4.87 | failed |
| value-mixed-16 | 0.995 | 16 | -1.96 | -4.91 | failed |

The selected policy controls movement, uses the mixed representation, holds its correction for 8 ticks, and uses gamma 0.995. Every world starts with 24 matched founders and runs for 1800 ticks (180 artificial seconds). Reproduction and mutation are disabled. All founder physical/genome hashes are matched across arms.

The required controls are globally frozen acquisition, the existing neural controller, memory acquisition disabled with other candidate settings preserved, and the matched observed-window rule. All comparisons include their actual energy costs. The observed-window comparator shares the selected motor gain, discount, representation and neural-learning setting, and omits the extra value lookup. Its own returns do not use a future-value term.

## Confirmation result

**Joint gate: failed.** Each required energy-difference interval must have a positive lower bound, and each mean ending-population difference must be nonnegative. A separate retained cue-component gate is also required. Difficulty and the existing live controller have not advanced.

Energy differences are per founder. Population differences are ending survivors per world. These are seed-paired 95% intervals, not tick-level intervals.

| Control | Learned minus control energy [95% interval] | Learned minus control population [95% interval] |
| --- | --- | --- |
| frozen | -4.62 [-5.17, -4.07] | -0.50 [-0.77, -0.23] |
| previous | 1.08 [0.22, 1.93] | -0.20 [-0.52, 0.12] |
| neural | 1.24 [0.25, 2.23] | 0.13 [-0.36, 0.63] |
| noCorrection | 2.37 [1.51, 3.22] | -0.23 [-0.61, 0.14] |
| fifo | -0.24 [-0.75, 0.27] | -0.10 [-0.33, 0.13] |
| noMemory | -4.61 [-5.24, -3.98] | -0.50 [-0.77, -0.23] |
| observedWindow | -3.48 [-4.43, -2.53] | -0.27 [-0.59, 0.06] |

The existing-neural comparison alone improves, while the matched learning controls fail. The result does not establish a useful learning gain. The separate cue-memory component passed on fresh seeds, but that adapter stores discrete reward examples; it does not test whether this TD policy retains skills in one moving body.

## Energy accounting diagnosis

[Recorded endpoint decomposition](../evidence/episodic-credit/e47816bf-0161-4444-a4cb-51f578b86ca3/energy-decomposition.json). For all recorded arms, ending agent-energy change equals food eaten minus expenditure, up to the checked numerical tolerance. Expenditure includes body, movement, neural, signalling, memory lookups, and energy dissipated at death. It has not yet been separated into those components.

| Control | Difference in food per founder [95% interval] | Difference in expenditure per founder [95% interval] | Net energy difference [95% interval] |
| --- | --- | --- | --- |
| frozen | 4.01 [3.41, 4.60] | 8.63 [8.33, 8.93] | -4.62 [-5.17, -4.07] |
| neural | -0.62 [-1.53, 0.29] | -1.86 [-2.30, -1.43] | 1.24 [0.25, 2.23] |
| noMemory | 4.00 [3.29, 4.71] | 8.61 [8.30, 8.91] | -4.61 [-5.24, -3.98] |
| observedWindow | 0.40 [-0.79, 1.58] | 3.88 [3.36, 4.39] | -3.48 [-4.43, -2.53] |

This is an arithmetic decomposition of the measured failure. It does not identify which behavioural or computational mechanism caused the extra spending.

## Prediction/return diagnosis

[Raw calibration rewards and results](../evidence/episodic-credit/e47816bf-0161-4444-a4cb-51f578b86ca3/value-diagnosis/results.json). This is post-hoc replay of 10 recorded seeds, with 40 sampled decisions. Each untouched baseline exactly reproduced its recorded final population, energy, food and expenditure.

At fixed decision times, the diagnostic saved the recalled estimate for the selected action and recorded its later reward sequence. It recomputed the normalized discounted return, plus a conservative unobserved-tail bound of +/- gamma^observedTicks. Upon death that tail is zero.

The TD target assumes a greedy continuation; the replay observes the actual exploratory policy as it continues learning. Consequently this is a behaviour-policy return comparison, rather than an unbiased measurement of greedy-policy prediction error. It cannot establish why the whole-life policy failed.

| Calibration measure | Seed mean [95% interval] |
| --- | --- |
| prediction | 0.002045 [-0.001772, 0.005862] |
| realizedReturn | -0.002041 [-0.016397, 0.012316] |
| tailBound | 0.003775 [0.003775, 0.003775] |
| error | 0.004086 [-0.010312, 0.018483] |
| errorLower | 0.000311 [-0.014087, 0.014708] |
| errorUpper | 0.007861 [-0.006537, 0.022258] |

The prediction-error interval includes zero. The current diagnosis does not establish systematic overprediction. Raw reward sequences are retained, and the audit independently recomputed their returns, tail bounds and error ranges.

## Verification and live state

- Node tests: **53 passed, 0 failed**. Tests cover a hand-calculated bootstrapped target, both lookup charges, target labels, malformed targets, terminal transitions, fresh offspring, legacy compatibility and exact continued checkpoints.
- 9 prior-policy replays matched the recorded observed-window, memory-disabled and neural outcomes exactly. These are compatibility checks, not independent replications.
- The server recovered 7 habitats with identical metrics and resumed only previously running habitats.
- Browser interaction exercised the new value-rule picker and actual target components at 390 and 1440 CSS pixels, with no horizontal overflow.
- [Audit](../evidence/value-memory-inspection/audit.json): all intervals recomputed, sources verified, seed separation checked against 5 prior campaigns, and calibration returns reconstructed.

At 2026-10-23T18:13:55.863Z, **Trace actor · food-renewal control** was running at 10× target and **9.28 artificial seconds per wall second**, with 32 agents at tick 940122. Mean network size was 1261.00 nodes. This is one trajectory, not evidence of intelligence. Measured speed uses completed ticks multiplied by engine DT, divided by wall time. No animation-smoothness claim follows from this measurement. [Runtime data](../evidence/value-memory-inspection/runtime.json).

## Next action toward the full goal

Before changing the learning algorithm again, trace the observed spending difference per step into movement, neural, signalling, memory storage, action lookup, value lookup, and terminal dissipation. Extract the energy coefficients from the engine and reconcile the sum with actual charged cost and recorded outcomes. That will distinguish measured cost sources from guesses about prediction failure. Any further controller change still requires the full matched controls, survival guards, retained-skill checks and fresh confirmation.

The remaining full objective includes useful ecological learning, retained skills in the same moving body, harder-environment transfer, validated autonomous changes to the learning process, and richer agents/worlds. These requirements remain open.

## Reproduce

```sh
node scripts/episodic-credit-study.mjs evidence/episodic-body/ee41ec59-eef4-4261-a4e9-42d7aa8bba61/results.json '' learning/episodic-value-candidates.json
node scripts/diagnose-episodic-values.mjs evidence/episodic-credit/e47816bf-0161-4444-a4cb-51f578b86ca3
```

Campaigns archive exact sources in `sources/` and refuse source-mismatched resumes. Historical source reproduction uses that archived tree as the working directory and an absolute reference-results path.
