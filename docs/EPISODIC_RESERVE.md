# Learned reserve cost: unsuccessful qualification

Recorded 2026-10-23T19:58:43.839Z. The full goal remains active. The reserve-cost auxiliary is implemented and inspectable, but it did not qualify as an improvement. The live observation keeps the previously confirmed risk-disabled policy.

[Study results](../evidence/episodic-risk/335d12d4-477d-483f-8e06-5dfe474b4c16/results.json) · [audit](../evidence/episodic-risk/335d12d4-477d-483f-8e06-5dfe474b4c16/audit.json).

## Learning rule and controls

The auxiliary predicts discounted low-energy exposure using the already available energy sensor: deficit = max(0, 1 - energy fraction / reserve threshold). It does not receive a correct action, future environment, death probability, or food map. Observations are paired with actions that were actually executed.

The energy and reserve targets use the same aligned action window and the same greedy next action, chosen by energy value minus weighted reserve cost. Both targets distinguish observations from predictions. At death the energy target has zero future value; reserve cost uses a disclosed unsafe absorbing state, so its future contribution equals the remaining discount power. This is a modelling assumption. The terminal record dies with the fly and is not passed to children.

Two heads are charged twice the existing per-record storage and access coefficients. Physical body costs and food renewal are unchanged. Risk-learning-disabled and zero-weight ablations retain the same extra-head charges. Their physical outcomes matched exactly on every held-out seed, confirming that learning unused risk labels did not alter behavior. Disabling the entire auxiliary also exactly reproduced incumbent outcomes on those seeds.

## Predeclared selection and fresh evaluation

Six policies crossed weights .05/.15/.5 and reserve fractions .15/.30. Each was evaluated on 12 fresh development seed pairs in both stable and relocating environments. No policy passed all development guards. The predeclared exploratory fallback locked **risk-w0.05-reserve0.3** before opening 30 untouched seed pairs per environment. No reselection or difficulty promotion occurred. Reproduction and mutation were off; each world had 24 matched founders and 1800 ticks.

| Comparison | Stable energy per founder [95% interval] | Stable population difference | Relocation energy per founder [95% interval] | Relocation population difference |
| --- | --- | --- | --- | --- |
| learned minus frozen | 1.74 [1.07, 2.41] | 0.00 | 0.26 [-0.68, 1.20] | 0.10 |
| learned minus noMemory | 1.84 [1.13, 2.56] | 0.00 | 0.67 [-0.45, 1.79] | -0.07 |
| learned minus neural | 4.47 [3.56, 5.38] | 0.63 | 8.84 [7.61, 10.08] | 1.90 |
| learned minus fullRange | 4.45 [3.76, 5.14] | 0.43 | 7.98 [6.90, 9.06] | 0.87 |
| learned minus noRisk | -0.11 [-0.24, 0.01] | 0.00 | -0.01 [-0.13, 0.12] | 0.00 |
| learned minus incumbent | -0.22 [-0.71, 0.27] | 0.00 | -0.40 [-1.06, 0.26] | -0.13 |

All three ecological/upgrade checks failed: the joint learning/survival gate, the matched risk ablation gate and the incumbent-comparison gate. In moving food, learned risk minus equally charged risk-disabled control was -0.01 [-0.13, 0.12] energy per founder, with no mean population change. A useful reserve-cost effect was not established. Relative to the cheaper incumbent, the population difference was -0.13 [-0.26, -0.00]; this experiment does not justify adopting the auxiliary.

## What the diagnostics do and do not show

The auxiliary accumulated real low-reserve experience and sometimes changed its estimated greedy action. On held-out relocating worlds, 101,278 of 1,295,476 observed living-agent ticks were below the chosen reserve threshold. 724 of 161,936 captured decisions used a retrieval preference that differed from energy-only greedy ranking (0.45%). This is a descriptive preference count with positive-action tie breaking, not a matched individual causal effect. Sparse preference changes and the extra computational cost are candidates for diagnosis, not proven explanations of failure.

The unchanged cue-memory component passed separately. That task contains no reserve labels and does not qualify retention of the risk controller in a moving body. The prior same-body incumbent probes remain exploratory. RSI, human-like cognition and agent-generated algorithm changes remain unachieved.

## Inspection, compatibility and audit

- 60 regression tests passed after the runtime changes. New checks cover aligned reserve targets, shared-action bootstrapping, bounded labels, malformed checkpoints, exact continuation, terminal assumptions, acquisition/choice ablations and scheduler backlog accounting.
- [Browser readout](../evidence/reserve-risk-inspection/c6e6711c-a909-4706-aa98-7cb4c28bd811/browser.json) matched actual API values for threshold, weight, target components and both action scores. The isolated paused world contained genuine acquired reserve records; it was not a qualified policy or a promoted live habitat.
- Browser screenshot capture returned “Preview automation snapshot timed out after 15000ms.” DOM/API verification succeeded; screenshot or pixel-layout verification is not claimed. The temporary inspection server was closed.
- 804 worlds were audited for matched inherited founders, disjoint development/held-out seeds and energy accounting. All paired comparisons, selection rankings, trial-component intervals and qualification gates were recomputed. The largest short-study ledger residual was 2.325e-9.
- Three old risk-disabled relocation worlds replayed exactly. After the later neural runtime optimization, the applied code reproduced a full mature-world checkpoint and a held-out risk seed across both environments and three ablation arms exactly. Historical resumes must use the archived source tree as their working directory.

## Runtime work and next research

A separate topology-cache optimization measured 1.45× headless full-world speedup over 5 alternating repetitions, with identical complete checkpoints including neural state, births, mutations and RNG state. It is a runtime optimization, not a learned algorithm change. Live scheduler measurements and recovery proof are in [RUNTIME_CATCHUP.md](RUNTIME_CATCHUP.md).

Next research should diagnose whether the available action/context representation and credit horizon can distinguish actions with better longer-term survival, using recorded matched forks or retained experience. Do not promote the unsuccessful risk auxiliary, lower the survival guard, or treat network growth as intelligence. Stable-world gains, moving-food learning/survival gates, retained-skill evidence, richer-world gates and RSI remain separate requirements.
