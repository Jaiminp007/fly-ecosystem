# RSI P12 plan: in-lineage self-revision of the fly's own taste program (frozen before the run)

In-life self-revision was stopped as data-limited ([exploration](RSI_INLIFE_EXPLORATION.md)): about 33 tastings per lifetime are too few. Following the Fable review's option (d), P12 tests **in-lineage** improvement.

Each fly passes on to its offspring in the next generation:

- its taste **program** (its mask set);
- its self-revision **evidence**.

Weights and replay memory start empty in every generation, so no learned food values are passed on. No improvement is made offline, and there is no surrogate: the fly lineage revises its own learning program from its own experience.

This must be named in-lineage, not in-life. It is a generational relay (separate runs of the same world), not breeding inside a run. There is no selection: offspring i always inherits from founder i, whether or not that founder survived.

An exploration probe on non-bank seeds 98001–98004 (4 rules, 4 lineages, 6 generations) found the following in generations 5–6:

| Arm | Energy vs S0 | Energy vs SHAM | Target terms held at the end |
|---|---|---|---|
| SELF | +2.6 | +3.0 | about 3 (of 3–4) |
| SHAM | | | about 0.5 |

## Design

- **Rules.** 24 embodied rules in the many-odor world (`odorShiftEvery` 32):
  - pairs rules with seeds 1801001–1801012;
  - staircase rules with seeds 1801013–1801024.
  - The odor table is built as in P8 and P10.
- **Lineages.** Per rule there are 4 lineages × 8 generations. Lineage l, generation g, uses history `makeHistories(1802000+k, 32)[g*4+l]` and shift seed `mix(bankSeed ^ (g*7919) ^ l)`.
- **Arms.** Every arm starts at generation 1 from S0 (step 4, replays 1, 8-bit odor):
  - **S0**: no self-revision.
  - **SELF**: `selfRevise {mode 'evid', evidence 'residual', every 8, z 3, cap 16}`.
  - **SHAM**: the same, with mode `'random'`. It adds random one-bit extensions at the moments SELF's evidence test fires.
- **Inheritance.** Founder i inherits masks and evidence from founder i of the previous generation, in the same lineage and arm.
- **Per-rule outcomes.** Each outcome is a mean over the 4 lineages:
  - E_last: mean energy per founder over generations 7–8;
  - E_first: energy in generation 1;
  - F: at the end of generation 8, the fraction of masks added since S0 that are target terms.
- **Statistics.** One value per rule (n = 24). The test is a one-sided sign-flip, Monte Carlo with 200,000 draws at seed 1804999.

## Criteria (all must pass)

- **L1 (size):** SELF − S0 on E_last has mean ≥ 1.65 (a quarter of the +6.6 true-terms gap measured in exploration) and p < 0.05.
- **L2 (own evidence, not just more features):** SELF − SHAM on E_last has mean > 0 and p < 0.05.
- **L3 (mechanism):** SELF's F − SHAM's F > 0 with p < 0.05. SHAM's F is the chance rate under the same proposal set and timing.
- **L4 (improves across generations):** (SELF E_last − SELF E_first) − (S0 E_last − S0 E_first) has mean > 0 and p < 0.05.

## Labels

- **In-lineage, not in-life.** The improvement comes from a generational relay.
- **Opt-in world.** The world is the opt-in many-odor world. The tasks are constructed Walsh-term rules over an 8-bit odor code.
- **Hand-written operator.** The revision operator (extend by evidence) is hand-written. It is the move the offline system invented in P6 and P10, installed here as the fly's own operator.
- **Recursion.** There is no level 2 inside the lineage, so this tests self-revision of the learning program, not recursive revision of the reviser.
- **Smoke run.** Seeds offset +500.

Runner: `scripts/rsi-p12-lineage.mjs`. Output: `evidence/rsi-p12/run.json`.
