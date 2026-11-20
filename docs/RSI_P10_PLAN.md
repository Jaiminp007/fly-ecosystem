# RSI P10 plan: joint test, one system, embodied (frozen before the run)

P5, P6 (C2, C3), P8 and P9 each support one RSI part, but in separate experiments. P10 tests them **jointly in one system**, scored in the embodied fly.

The system:

1. Its improvement rule is **U\***, the level-2 revision from P9, read from `evidence/rsi-p9/level2.json` and not re-searched.
2. It starts from the seed library, which holds blind moves only. It trains on staircase rules in the calibrated surrogate and invents moves.
3. Its frozen search is then applied to an **unseen rule family** (pairs).
4. The programs it finds are installed in the **embodied fly** in the many-odor world (`odorShiftEvery: 32`).

An exploration probe on non-bank seeds 97001–97004 checked the world before the run: for pairs rules, the true terms beat S0 by +8 to +10 energy embodied.

## Design

- **Rules.** 12 embodied pairs rules, seeds 1601001–1601012. Odor table and shift seed are built as in P8.
- **A (the system).** Library k trains with U* on 6 staircase rules, seeds 1605000+10k+i, training seed k. It then runs a frozen surrogate search, budget 18, on rule k.
- **A0 (reported).** The same library trained with U0. This is level 1 only, without the level-2 revision.
- **B (blind).** L0 runs a uniform search with the same search seed.
- **S0.** The starting program, with no search.
- **Embodied scoring.** Energy per founder, threshold decisions, shift 32, 16 fresh histories per rule (`makeHistories(1602000+k, 16)`). All arms use the same histories.
- **Statistics.** Each rule gives one difference. The test is an exact one-sided sign-flip over 12 rules.

## Criteria (all must pass)

- **J1:** embodied A − B mean ≥ 1.0 with p < 0.05.
- **J2:** embodied A − S0 mean ≥ 1.0 with p < 0.05.
- **J3:** in ≥ 8 of 12 libraries, A's top term move is invented (not in the seed library).

**Reported, not gated:** embodied A − A0. P9 showed U* helps mainly the ~20% of libraries where U0 fails to discover the key move, so 12 rules has little power for this contrast.

## Labels

- **Surrogate search.** The search and its self-improvement run on the calibrated surrogate; this is sim-to-real.
- **World.** The world is the opt-in many-odor mode.
- **Tasks and moves.** The tasks are constructed, and the gene grammar is hand-written.
- **Level 2's role.** Level 2 enters through the fixed U* from P9. P10 does not re-run level 2.
- **Smoke run.** Seeds offset +500.

Runner: `scripts/rsi-p10-joint.mjs`. Output: `evidence/rsi-p10/run.json`.
