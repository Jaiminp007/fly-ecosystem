# P14b results: a better taste program raises survival over the default learner (PASSED)

The plan was [RSI_P14B_PLAN.md](RSI_P14B_PLAN.md), frozen in `558a9bd` before the run; its gates were chosen after seeing P14. Output: `evidence/p14b/run.json`, kept locally. The run took 493 s.

| Measure | Value |
|---|---|
| S0 survivors (of 24) | 8.65 |
| TRUE survivors | 13.79 |
| **G1:** TRUE − S0 | **+5.15** (sd 2.16), 12/12 rules, p = 0.00024 (bar ≥ 3, p < 0.01) |
| **G2:** S0 survivors ≥ 2 | 8.65, so it passes |
| Energy per founder | S0 −55.2, TRUE −47.4 |

Per rule, TRUE − S0 ranged from +2.1 to +7.8. Gains were smaller on the staircase rules where S0 already survives well (14–15 survivors) and larger on the hard rules. On s11, for example, S0 kept 1.3 survivors and TRUE kept 6.6.

**Both gates pass.** In the many-odor world, a better taste program raises survival over the default learner. This replicates P14's reported TRUE − S0 effect (+4.8 to +5.8) on fresh rules.

Labels:

- **Replication, not an independent milestone.** The gates were chosen after P14.
- **Oracle program.** TRUE is an oracle program: this result measures what better skill is worth, not what the flies found.
- **Opt-in world.** The many-odor world is opt-in, and the tasks are constructed.

Per the Fable review, the taste line is now finished at its bound.
