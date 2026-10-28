# Cruising learner: confirmed gain and current boundary

Latest follow-up: [learned reserve-cost study](EPISODIC_RESERVE.md) and [runtime optimization](RUNTIME_CATCHUP.md).

Latest follow-up: [adaptation screen and same-body retention probes](EPISODIC_ADAPTATION.md). No upgrade qualified.

Recorded 2026-10-23T19:05:45.364Z. Useful learning is confirmed in the declared short stable scarcity task. RSI, human-like cognition and broad continual learning remain open.

## Measured change

The failed full-range value learner spent 3.76 additional movement energy per founder versus its observed-window control; the extra value lookup cost 0.10. All per-step reconstructions matched the recorded outcomes. [Cost diagnosis](../evidence/episodic-credit/e47816bf-0161-4444-a4cb-51f578b86ca3/cost-diagnosis/results.json).

The opt-in cruising mode supplies two bounded positive speed fractions, with unchanged bodies and energy prices. Acquisition controls receive the same choices. The selected policy uses 15% / 50% inherited speed, td value targets, and gamma 0.99. Defaults remain unchanged.

The initial 30-seed study passed its declared joint gate. The rule and parameters were then frozen for 100 independent fresh seeds. Reproduction and mutation were disabled in these qualifications; each world had 24 matched founders and 1800 ticks. Comparisons report net energy per founder and ending population per world, with seed-paired 95% intervals.

## Independent stable-scarcity confirmation: passed

[Raw results](../evidence/episodic-confirmation/b3ee4b6f-557e-455f-b98b-513c19fc7173/results.json) · [audit](../evidence/episodic-confirmation/b3ee4b6f-557e-455f-b98b-513c19fc7173/audit.json).

| Control | Learned minus control energy [95% interval] | Learned minus control population [95% interval] |
| --- | --- | --- |
| frozen | 1.98 [1.56, 2.41] | 0.00 [0.00, 0.00] |
| noMemory | 2.19 [1.80, 2.57] | 0.00 [0.00, 0.00] |
| fullRange | 3.89 [3.46, 4.32] | 0.39 [0.27, 0.51] |
| neural | 4.66 [4.15, 5.17] | 0.45 [0.33, 0.57] |
| observedWindow | -0.41 [-0.86, 0.04] | 0.00 [0.00, 0.00] |

All four required controls passed: globally frozen, memory disabled, full-range movement and existing neural. The separate cue-memory component also passed; it does not establish retention in the same moving body. The secondary observed-window comparison is uncertain, so these results do not establish that bootstrapped targets improve on observed-window learning.

Supplemental simple motor baselines on the same frozen seed set also favoured the learner. These were additional comparisons, not part of the original gate or a parameter-reselection round. They fixed movement while retaining the candidate's declared neural-learning setting. No synthetic experience was stored.

| Motor baseline | Learned minus baseline energy [95% interval] | Learned minus baseline population [95% interval] |
| --- | --- | --- |
| alwaysSlow | 18.65 [18.17, 19.12] | 0.08 [0.02, 0.14] |
| alwaysFast | 2.14 [1.65, 2.63] | 0.03 [-0.01, 0.07] |
| feedReflex | 6.08 [5.68, 6.49] | 0.00 [0.00, 0.00] |

## Next environment: food relocation did not pass

Only after the independent stable-stage gate passed, the unchanged policy was evaluated on 100 new seeds with seeded food-renewal relocation at the same nutrient level. [Results](../evidence/episodic-confirmation/2e3dcc99-51c7-402a-bd2b-305aff52ee25/results.json) · [audit](../evidence/episodic-confirmation/2e3dcc99-51c7-402a-bd2b-305aff52ee25/audit.json).

| Control | Learned minus control energy [95% interval] | Learned minus control population [95% interval] |
| --- | --- | --- |
| frozen | 0.38 [-0.22, 0.98] | -0.10 [-0.21, 0.01] |
| noMemory | 0.32 [-0.26, 0.91] | -0.09 [-0.20, 0.02] |
| fullRange | 7.51 [6.74, 8.28] | 0.92 [0.68, 1.16] |
| neural | 8.85 [8.09, 9.60] | 1.66 [1.33, 1.99] |
| observedWindow | -1.05 [-1.70, -0.40] | -0.04 [-0.16, 0.08] |

The required learning-off and memory-off gains were uncertain and their mean population differences were negative. The joint gate failed. Lower-nutrient relocation was not advanced; an actual failed-parent invocation verified that the runner rejects it.

## Live view and verification

A separate breeding observation uses the confirmed rule with reproduction, mutation and higher food renewal enabled. Its population growth is observational and is not the no-reproduction qualification above. [Initial checkpoint and protocol](../evidence/cruise-memory-inspection/live-observation/protocol.json).

- Node regression suite: 54 passed.
- New motor levels, founder identity, energy accounting, malformed modes and exact checkpoint continuation are covered.
- Prior TD, observed-window and memory-disabled policies reproduced their recorded outcomes in compatibility replays.
- The observer displays the actual configured speed fractions and executed movement output.
- The full goal remains active. The next research question is adaptation to moving resources while retaining previously acquired skills; no cause of the relocation failure has yet been established.
