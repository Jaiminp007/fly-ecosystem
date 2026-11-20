# RSI P13 plan: the lineage tunes its own reviser (frozen before the run)

P12 showed in-lineage self-revision of the taste program. P13 tests one level up: **the lineage revises its own reviser's evidence threshold z, from its own experience, with no selection.**

The design is the Fable review's, from 2026-11-16.

## Headroom check (exploration)

The check used 8 non-bank rules (98201–98208), with 4 lineages × 8 generations. Energy is net of S0, averaged over all generations.

| Reviser setting | Energy net of S0 |
|---|---|
| z = 3, every 8 (default) | +2.48 |
| z = 1.5 | +0.53 (loss 1.95) |
| z = 4.5 | +1.32 (loss 1.16) |

Fable's pre-set bar was a loss of at least 2. The z = 1.5 loss of 1.95 misses it by 0.05. **Fable explicitly overrode its own bar**: it decided only whether to spend compute, and in late generations the z = 1.5 gap is about 3.1. The z = 4.5 start is dropped, because half of a 1.2 gap is too small to gate on.

## Pruning calibration (exploration)

Rules 98201, 98202, 98205 and 98206 were run with z = 1.5 for 4 generations. The test looks at the offspring's own learned |weight| on each mask its parent added:

| Masks | Median \|w\| | Kept at τ = 2 |
|---|---|---|
| target | 5.3 | 90% |
| false | 1.9 | 49% |

τ = 2 is fixed from this calibration.

## Mechanism

The META and META-SHAM arms run the steps below between generations. They use only each fly's own state: its parent's additions, its own learned weights, its own error, and its z.

1. **Prune.** For each mask the parent added in its lifetime that the child still holds: if the child's learned |w| ≤ 2, the mask is dropped and the lineage's evidence for it is zeroed. Weights restart every generation, so this test uses evidence independent of the data that selected the mask.
2. **z update (META only).**
   - If more than half of the tested parent additions were pruned, z ← z × 1.25.
   - Otherwise, if the child added nothing and its mean squared residual this generation did not improve on the previous one, z ← z / 1.25.
   - z is clamped to [1.5, 4.5], so it changes by at most one step per generation.
3. **Inheritance.** The child passes on its masks (after pruning), its evidence and its z. Weights and memory are not passed on.

**META-SHAM** prunes in exactly the same way. Its z trajectory is copied, generation by generation, from the META(1.5) chain with the same lineage and founder on a different rule (rule k+1, cyclic). So it takes the same number and size of z steps, but they are not driven by its own experience.

## Design

- **Rules.** 24 embodied rules in the many-odor world (shift 32): pairs at seeds 1901001–1901012 and staircase at 1901013–1901024. The odor table is built as in P12.
- **Lineages and histories.** Each rule has 4 lineages × 12 generations of 24 founder chains. Lineage l in generation g uses history `makeHistories(1902000+k, 48)[g*4+l]` and shift seed `mix(bankSeed ^ (g*7919) ^ l)`. All arms use the same values.
- **Base program.** S0 with step 4, replays 1, and `selfRevise {mode 'evid', every 8, evidence 'residual', cap 16}`, with the starting z given below.
- **Arms.**

| Arm | Starting z | z changes? | Pruning |
|---|---|---|---|
| S0 | — (no revision) | — | no |
| FIXED3 | 3 | no | no |
| FIXED15 | 1.5 | no | no |
| META15 | 1.5 | yes | yes |
| META3 | 3 | yes | yes |
| SHAM15 | 1.5 | copied trajectory | yes |

- **Outcome per rule.** E_late is the mean energy per founder over generations 9–12 and all 4 lineages.
- **Statistics.** Rule is the unit (n = 24). The test is a one-sided sign-flip, Monte Carlo with 200,000 draws at seed 1904999.

## Gates (all must pass)

1. **Recovery.** META15 − FIXED15 has mean ≥ max(1.0, 0.5 × mean(FIXED3 − FIXED15) measured in this run) and p < 0.05.
2. **Sham.** META15 − SHAM15 has mean > 0 and p < 0.01. This gate isolates z-tuning, since both arms prune.
3. **No harm.** META3 − FIXED3 has mean ≥ −0.5.
4. **Mechanism.** At the end, z > 1.5 in at least 75% of META15 founder chains.

**If gate 1 passes and gate 2 fails,** the finding is that pruning repairs the lineage and z-tuning adds nothing. It will be reported that way, not as recursion.

## Labels

- **In-lineage relay.** Founder i inherits from founder i, with no selection.
- **Opt-in world.** The many-odor world is opt-in, and the tasks are constructed.
- **Hand-written rules.** The prune rule and the z-update rule are hand-written and fixed, so the recursion stops one level up.
- **Not open-ended.** A pass shows one tunable knob, not open-ended self-improvement.
- **Smoke run.** The smoke run uses a seed offset of +500.

## Running it

The run is staged because of the 2 h process limit:

- `scripts/rsi-p13.mjs fixed`: S0, FIXED3 and FIXED15.
- `meta`: META15 and META3.
- `sham`: SHAM15, which needs the META15 output.
- `result`: computes the gates.

Outputs go to `evidence/rsi-p13/`.
