# Observation ambiguity and action-label noise

Recorded 2026-10-24T01:57:48.717Z. These two fixed diagnostics reuse the failed [direct outcome study](OPTION_OUTCOME.md). They do not resample its qualification, alter a gate or supply training labels.

[Future-noise protocol](../evidence/option-noise/6fe07798-981b-46be-9252-cbba7e44e6ab/protocol.json) · [Noise results](../evidence/option-noise/6fe07798-981b-46be-9252-cbba7e44e6ab/results.json) · [Audit](../evidence/option-noise/6fe07798-981b-46be-9252-cbba7e44e6ab/audit.json).

## Conditional future motor noise

Keep the same initial target sensory vector, acquired state and complete first motor vector. After the first physical step, reseed only that target actor’s exploration stream into eight fixed hash-derived streams, common between slow/fast branches. World physics, other agents and episodic choice streams are not reseeded. A separate original-stream pair must reproduce the old action effects exactly. This measures only one source of conditional variation; initial motor noise and other world randomness remain fixed.

| Environment | Factual sign agrees with mean of future streams | Mean future-stream sign reversal rate | Mean within-case effect SD | Observed variance of case means |
| --- | ---: | ---: | ---: | ---: |
| stable | 100.00% | 0.52% | 0.027007 | 0.341062 |
| relocation | 97.92% | 0.52% | 0.020092 | 0.316498 |

96 cases and 864 paired continuations were retained. The original preferred-speed sign generally survived this perturbation, so the observed failures are not explained by this particular source of future motor noise. This is not a proof that all uncertainty is small. Oracle means and noise-clairvoyant values in the raw data are diagnostics, not achievable policy performance or a new qualified gate result.

## Constructed hidden food availability

[Protocol](../evidence/food-aliasing/4a123140-a722-482d-b54e-63016ad0403b/protocol.json) · [Results](../evidence/food-aliasing/4a123140-a722-482d-b54e-63016ad0403b/results.json) · [Audit](../evidence/food-aliasing/4a123140-a722-482d-b54e-63016ad0403b/audit.json).

Before the next step, copy the same world and scale every food amount, capacity and regrowth by 0.5, 1 or 2. Locations, target body and acquired internal state remain identical. The signed food energy change is entered explicitly in externalEnergy. Keep all cases and identify which interventions preserve all 17 initial target inputs and all non-speed first motor outputs exactly. Other agents and later observations may differ.

| Environment | Cases | Both altered supplies preserve initial target observation/motors | Opposite slow/fast preferences |
| --- | ---: | ---: | ---: |
| stable | 48 | 48 | 6 |
| relocation | 48 | 48 | 4 |

The constructed copies preserved the initial target readings in all 96 cases and reversed the preferred speed in 10. Maximum absolute energy-accounting residual was 1.31080923893e-09. This demonstrates a limitation of initial sensory information on deliberately constructed copies. It does not measure how often such ambiguity occurs naturally, prove an irreducible-error bound for sensory histories, isolate a single local patch as the cause, or establish that a proposed extra receptor will help.

This motivated a separately fixed fresh-seed [local resource measurement screen](RESOURCE_OUTCOME.md), rather than further adjustment to the failed model on these cases.

## Audit scope and preserved failed attempt

Both auditors recomputed all 96 case summaries. Independent physics replay used the first fixed seed in both environments: 8 cases / 144 forks for future noise, and 8 cases / 48 forks for food interventions. The other intervention trajectories were not independently re-executed. Selected complete baseline hashes, initial invariants, stream seeds, intervention accounting and fork endings matched. Synthetic altered-effect/observation fixtures were rejected.

The first food diagnostic stopped on an incorrect accounting check that omitted the engine’s initialEnergy baseline. The [failed source and log](../evidence/food-aliasing/65f8a624-2a2f-4648-a09a-9bbb9c5f3723/failure.log) remain preserved. The corrected equation is energy + dissipated - initialEnergy - externalEnergy. This fixes the check, not the world dynamics or case selection.

Reproduce:

```sh
node scripts/audit-observation-diagnosis.mjs evidence/option-noise/6fe07798-981b-46be-9252-cbba7e44e6ab
node scripts/audit-observation-diagnosis.mjs evidence/food-aliasing/4a123140-a722-482d-b54e-63016ad0403b
```
