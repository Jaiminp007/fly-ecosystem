# Context representation and policy-value study

Recorded 2026-10-23T20:27:59.697Z. The full goal remains active. The 636-world study completed and failed its full qualification gate. The locked local-feature policy showed a partial learning signal, so a separately specified fixed-size replication completed at the same difficulty and also failed its full gate. The new navigation representation and expected-value target were not selected.

## Diagnosis before intervention

[Action-fork outcomes](../evidence/episodic-confirmation/2e3dcc99-51c7-402a-bd2b-305aff52ee25/action-horizon-diagnosis/results.json) · [diagnostic audit](../evidence/episodic-confirmation/2e3dcc99-51c7-402a-bd2b-305aff52ee25/action-horizon-diagnosis/audit.json).

20 recorded relocation worlds replayed exactly. At three predeclared times, the first two living founder IDs were branched with a forced first slower/faster action. Subsequent target-agent exploration RNG was synchronized. 120 sampled cases passed an entire-checkpoint comparison between the natural factual action and its forced-action fork. These are post-hoc sampled states, not fresh policy qualification.

The mean seed-level agreement between recalled rankings and 256-tick energy effects was 54.2%, with interval 45.7–62.6%. The agreement calculation had 118 non-tied eligible cases across 20 seeds. Short and long action-effect signs differed on 41.3% of eligible cases on a seed-averaged basis. The sampled greedy choice gain over a random first action was 0.15 [-0.11, 0.41] energy for the targeted agent. These measurements do not establish that longer credit or any particular alternative controller is better.

A separate exact retrieval replay on the same 20 seeds found that clocks, mating channels and age contributed 67.4% of squared distance among recalled neighbors. This describes the chosen metric, not the causal importance of those inputs.

## Implemented hypotheses

- Navigation representation: retain food, obstacle, scent, previous-intake, energy and bias channels; mask clocks, age and mate channels for retrieval. The neural actor still receives every input. The existing local representation also removes energy and bias.
- Expected TD targets: average future action values using the controller's actual configured epsilon-greedy exploration distribution. Both energy and optional reserve heads use the same distribution. Targets label the mode and exploration rate; old targets/checkpoints default to greedy bootstrapping.
- The same storage bound, movement levels, inherited bodies, physical energy coefficients and existing lookup counts apply. No synthetic action labels, map knowledge or future outcomes enter training.

These are opt-in, human-designed algorithm options. Their mathematical and checkpoint tests do not prove useful learning or RSI.

## Development and fixed selection

[Protocol, rankings and results](../evidence/episodic-context-value/b6d3bd05-5838-47a4-ba56-cd12e0c4cc59/results.json) · [audit](../evidence/episodic-context-value/b6d3bd05-5838-47a4-ba56-cd12e0c4cc59/audit.json).

5 candidates were compared on 12 fresh seed pairs per environment. Selection prioritized the cue component, population guards and stable-world preservation, then ranked the worst mean energy comparison.

| Candidate | Development eligible | Worst mean energy comparison |
| --- | --- | --- |
| local-greedy | yes | -0.58 |
| navigation-greedy | no | -1.04 |
| navigation-expected | no | -1.66 |
| local-expected | no | -2.18 |
| mixed-expected | no | -2.31 |

The locked policy was **local-greedy**. It uses the existing greedy target and the local foraging representation. Selection was not revised after opening the 30-seed held-out evaluation.

## Held-out outcome: full gate failed

All worlds used 24 matched founders and 1800 ticks, with reproduction/mutation disabled. Energy differences are per founder; population differences are per world.

| Control | Stable energy [95% interval] | Stable mean population difference | Relocation energy [95% interval] | Relocation mean population difference |
| --- | --- | --- | --- | --- |
| learned minus frozen | 2.94 [2.13, 3.74] | 0.00 | 0.77 [-0.36, 1.89] | 0.00 |
| learned minus noMemory | 2.76 [2.19, 3.32] | 0.00 | 1.24 [0.10, 2.38] | 0.00 |
| learned minus neural | 5.37 [4.29, 6.44] | 0.30 | 10.59 [9.34, 11.84] | 1.93 |
| learned minus fullRange | 3.76 [3.04, 4.48] | 0.37 | 7.72 [6.74, 8.69] | 0.83 |
| learned minus incumbent | 0.49 [-0.22, 1.19] | 0.00 | 0.64 [-0.14, 1.43] | 0.00 |

The relocation memory-off comparison was positive with no mean survivor loss. The globally frozen comparison and improvement over the incumbent remained uncertain. Therefore the joint ecological gate and incumbent-upgrade gate failed. The separate cue-memory component passed; it does not exercise TD bootstrapping or establish continual retention in a moving body. The original failure remains recorded. No difficulty promotion or live-policy replacement follows from this result.

## One independent replication, unchanged policy and difficulty

[Replication protocol](../evidence/episodic-context-replication/e1744294-b5a1-4a0e-b113-c08332990792/protocol.json) · [progress](../evidence/episodic-context-replication/e1744294-b5a1-4a0e-b113-c08332990792/heldout.json).

The locked policy is being evaluated on exactly 100 new seed pairs per environment, using identical parameters, bodies, prices, nutrient, ecology, horizon, controls and gates. This is an independent fixed-size follow-up to a partial signal, not a declaration that the original study passed. No pooling with the original 30 seeds, reselection, extra sample extension, or difficulty increase is allowed. If it fails, return to diagnosis or a separately specified intervention.

The replication completed 100/100 seed pairs at 2026-10-23T20:37:33.665Z. Its full gate failed. Core source and driver hashes were fixed for the entire run. Use its archived source tree as the working directory for a historical resume.

After results exist, audit with:

```sh
node scripts/audit-context-replication.mjs evidence/episodic-context-replication/e1744294-b5a1-4a0e-b113-c08332990792
```

## Verification and remaining requirements

63 Node regression tests passed. Tests cover feature masking with observable energy/bias preservation, exact expected-policy weighting, consistent two-head bootstrapping, target provenance, malformed mode/checkpoint rejection, terminal handling and exact continuation. Three legacy default-policy relocation outcomes replayed exactly. [Compatibility data](../evidence/context-value-compatibility/results.json).

[DOM/API inspection](../evidence/context-value-inspection/19d2d3cc-4458-45e1-97a8-b064500a5e80/browser.json) verified actual expected-policy labels, configured exploration, feature masking and target rates in a paused experimental world. It is not a screenshot/pixel-layout verification or a live-policy promotion. The temporary server was closed.

The 636-world audit recomputed comparisons, selection ranks, cue statistics and source/reference/diagnosis hashes. Maximum short-study ledger residual: 2.547e-9. A separate same-body probe on previously sampled seeds is exploratory and is not part of the ecological gate. Sustained live 10×, robust relocating-food qualification, whole-body continual skill retention, autonomous algorithm changes, richer-world gates and RSI remain open.

## Exploratory paired same-body probe

[Probe results](../evidence/episodic-retention/0658bde9-3fe6-4172-aebc-9920de93d0f5/results.json) · [audit](../evidence/episodic-retention/0658bde9-3fe6-4172-aebc-9920de93d0f5/audit.json). The selected local policy was probed on the same 20 seeds as the earlier incumbent probe. These are reused probe seeds, not independent confirmation data. Each policy followed continuous A→B training, then its surviving end-B bodies were branched with matched positions, neural state, exploration RNG and standardized energy; only current, saved-A or empty episodic memory differed.

In A, current memory minus empty memory gained **1.60 [1.07, 2.13]** energy per surviving founder. Current minus saved-A memory was 0.31 [-0.10, 0.72]. In B, current minus empty memory was 0.55 [-0.06, 1.17], and current minus saved-A memory was -0.23 [-1.01, 0.55]. Useful memory remained present in the same bodies, but these data do not establish new B-skill acquisition, strict preservation of A performance, or broad continual learning. Cross-policy end-B bodies differ, so the two policies' raw probe outcomes are not a matched-body causal comparison. No probe result changes the ecological qualification gate.

## Independent replication: completed, full gate failed

[Results](../evidence/episodic-context-replication/e1744294-b5a1-4a0e-b113-c08332990792/results.json) · [audit](../evidence/episodic-context-replication/e1744294-b5a1-4a0e-b113-c08332990792/audit.json). This separate 100-seed study was not pooled with the original evaluation.

| Control | Stable energy [95% interval] | Stable mean population difference | Relocation energy [95% interval] | Relocation mean population difference |
| --- | --- | --- | --- | --- |
| learned minus frozen | 2.30 [1.89, 2.70] | -0.02 | 0.29 [-0.32, 0.90] | 0.00 |
| learned minus noMemory | 2.47 [2.04, 2.90] | -0.01 | 0.59 [0.03, 1.15] | 0.01 |
| learned minus neural | 5.04 [4.53, 5.55] | 0.50 | 9.58 [8.77, 10.39] | 1.65 |
| learned minus fullRange | 4.14 [3.68, 4.60] | 0.32 | 7.22 [6.47, 7.97] | 0.91 |
| learned minus incumbent | 0.03 [-0.34, 0.40] | -0.02 | 0.21 [-0.37, 0.79] | 0.08 |

The relocation energy advantage over memory disabled replicated: 0.59 [0.03, 1.15], with mean population difference 0.01. It does not satisfy the full rule. The frozen-control relocation advantage remained uncertain, and stable-world mean population differences were negative versus frozen, memory disabled and the incumbent. The incumbent-upgrade gate also failed. The separate cue component passed. No adoption, further sample extension or environmental promotion is justified under this protocol.

The audit covered 1400 worlds, checked all outcomes against fixed sample/body/environment/parameter settings, recomputed all parent and replication comparisons and gates, and verified source fingerprints. Largest short-study ledger residual: 2.702e-9. Actual CLI guard tests rejected higher difficulty, policy reselection and sample extension without creating outcomes. [Guard evidence](../evidence/episodic-context-replication/e1744294-b5a1-4a0e-b113-c08332990792/guard-checks.json).

Next work needs a separately specified intervention, such as a better action/credit interface or a new diagnostic of the failed survival comparisons. Do not keep resampling this policy until it passes. The full RSI objective remains active and unachieved.
