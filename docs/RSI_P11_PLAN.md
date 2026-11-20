# RSI P11 plan: does the level-2 revision itself help the embodied fly? (frozen before the run)

P10 reported embodied A − A0 (library trained with U* vs library trained with U0) as +1.48, p = 0.051 over 12 rules. That contrast was reported only, not gated. Its per-rule sd was 2.84, so 12 rules was underpowered.

P11 is a separately pre-registered test of that one contrast on 32 fresh rules. The power estimate for 32 rules uses P10's sd: se ≈ 0.50.

## Design

- **Setting.** Same as P10: the calibrated surrogate, U* read from `evidence/rsi-p9/level2.json`, and the many-odor world (shift 32), on embodied pairs rules (an unseen family).
- **Rules.** 32 embodied pairs rules, seeds 1701001–1701032.
- **Libraries.** Library k trains on 6 staircase rules, seeds 1705000+10k+i, with training seed k. It is trained twice: once with U* (arm A) and once with U0 (arm A0).
- **Search.** Each library runs a frozen search on rule k with the same search seed.
- **Embodied scoring.** Energy per founder over 16 fresh histories per rule (`makeHistories(1702000+k, 16)`). Both arms use the same histories.
- **Unit and statistic.** One difference per rule, A − A0. The test is a one-sided sign-flip, Monte Carlo with 200,000 draws at seed 1704999.

## Criterion

**G1:** mean A − A0 > 0 and p < 0.05.

## Reported, not gated

- The discovery count under each rule: top term is `extend/evid`.
- The number of target terms in each arm's final program.

## Labels

- **Surrogate search.** Search and self-improvement run offline on the surrogate.
- **World.** The world is the opt-in many-odor mode.
- **Scope.** The tasks are constructed and the gene grammar is hand-written.
- **Expected source of any gain.** It should come from the libraries where U0 fails to discover the key move.
- **Smoke run.** The smoke run uses seed offset +500.

Runner: `scripts/rsi-p11-l2embodied.mjs`. Output: `evidence/rsi-p11/run.json`.
