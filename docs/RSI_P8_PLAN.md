# RSI P8 plan: embodied benefit in a calibrated, many-odor world (frozen before the run)

P7 failed: programs found by the self-improving search did not raise embodied energy (A − B −0.03). Two causes were found **after** P7, on non-bank exploration seeds:

1. **The world.** Each fly met only 12 fixed odors (4 per phase), which the starting program S0 already separates. A no-search probe showed S0 → true terms gains about +1.7 energy.
2. **A miscalibrated surrogate.** The surrogate stream gave about 360 encounters (12 repeated odors per family, 10% noise). Real flies get about 48 taste examples per lifetime (median 33), and their label noise is 7.1%. The surrogate therefore favoured small steps (1–2), which lose in the embodied world. In P7, e6 had step 1 and scored −3.3.

P8 changes both and repeats the P7 test. P7 stays recorded as failed.

## Changes

- **Many-odor world (opt-in engine option).** `odorShiftEvery: 32` in `learning/taste-program-eval.mjs`. Every 32 ticks, the 16 cue patterns get 16 fresh distinct random 8-bit odor codes. Valences follow the rule, and every fly's taste transduction reads the new codes. Steering still sees the 4-bit cue. With `null` (the default) the engine behaves as before.
  - Exploration probe (3 rules × 8 histories, seeds 90001–90003): S0 → true terms gains +4.0 to +6.0 at shift 32, against +1.5 to +1.8 with no shift.
- **Calibrated surrogate.** `TASK = {odors: 85, encounters: 40, noise: .07}`. That is 255 distinct odors per stream, nearly every encounter a new odor, matching the shifting world.
  - With S0 this gives 47 examples per stream, against 48 per embodied fly.
  - This is a configuration of the existing P6 surrogate, set from measured embodied statistics (examples per fly, label noise). It was not tuned on any score.
- **Update rule U0.** Level 2 is not shown (P6, P6b), so A uses U0 with invention: the P6 C2 setting.

## Design

- **Rules.** 12 embodied staircase rules, seeds 1401001–1401012. The odor table is built as in P7. The shift seed is `mix(seed ^ 0x7f4a7c15)`.
- **A (self-improving search).** Library k trains with U0 and invention on 6 fresh staircase rules in the calibrated surrogate, seeds 1405000+10k+i, training seed k. It then runs a frozen surrogate search, budget 18, on rule k.
- **B (blind search).** The seed library L0 runs a uniform surrogate search, budget 18, on rule k, with the same search seed.
- **S0.** The starting program, with no search.
- **Embodied scoring.** Energy per founder, threshold decisions, `odorShiftEvery` 32, default phases, on 16 fresh histories per rule (`makeHistories(1402000+k, 16)`). A, B and S0 use the same histories.
- **Unit and statistics.** Each rule gives one difference. The test is an exact one-sided sign-flip test over 12 rules.

## Criteria (both must pass, as in P7)

- **E1:** embodied A − B mean ≥ 1.0 energy with p < 0.05.
- **E2:** embodied A − S0 mean ≥ 1.0 with p < 0.05.

## Labels

- **Where the search runs.** The search and its self-improvement run on the surrogate, so this is a sim-to-real transfer claim.
- **What changed in the world.** The world is changed (an opt-in many-odor mode), and the change was motivated by P7's failure. A pass shows an embodied benefit **in this world**, not in the default 12-odor world.
- **How the surrogate settings were chosen.** The calibration numbers come from exploration seeds 90011, 90021, 90100–90105, 90200–90205, 91000–91019 and 92000+.
- **Smoke run.** Seeds offset +500 (one rule, 2 histories).

Runner: `scripts/rsi-p8-embodied.mjs`. Output: `evidence/rsi-p8/run.json`.
