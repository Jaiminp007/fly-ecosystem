# RSI P7 plan: does the self-improving search help the embodied fly? (frozen before the run)

`VISION.md` lists "an embodied fly-controller benefit" as missing from the RSI goal. P3-A and P4 showed that searching **inside** the embodied simulation fails: one embodied evaluation carries too little signal.

P7 tests a different route:

1. the self-improving search runs on the surrogate;
2. its found taste program is installed in the embodied fly;
3. the flies' energy is measured in the full simulation.

## Design

- **Rules.** 12 embodied rules with seeds 1201001–1201012. Each rule is a staircase valence over a random 8-bit odor code (16 codes, one per 4-bit cue pattern). It uses the P4 opt-in engine option `tasteProgram.odor` together with `rule.odor`.
- **A (self-improving search).** Library k is trained with U* (from `evidence/rsi-p6/level2.json`) on 6 fresh staircase surrogate rules, seeds 1205000+10k+i. Starting from the seed library, it invents and learns its moves. It then runs a frozen surrogate search, budget 18, on rule k.
- **B (blind search).** The seed library L0 runs a uniform surrogate search, budget 18, on rule k.
- **S0.** The starting program, with no search.
- **Embodied scoring.** All three programs are scored in the embodied simulation: energy per founder, threshold decisions, default long phases, on the same 16 fresh histories per rule (`makeHistories(1202000+k)`).
- **Unit and statistics.** Each rule (with its library) gives one difference. The test is an exact one-sided sign-flip test over 12 rules.

**Criteria. Both must pass:**

- **E1:** embodied A − B mean ≥ 1.0 energy with p < 0.05. Programs found by the self-improving search beat programs found by blind search in the real simulation.
- **E2:** embodied A − S0 mean ≥ 1.0 with p < 0.05. The found programs beat no search.

## Labels

- **The search and its self-improvement happen on the surrogate.** The embodied simulation only scores the end product. This is a sim-to-real transfer claim, not search inside the embodied world.
- **The engine reads the 8-bit odor code only in taste.** Steering still sees the 4-bit cue.
- **Disclosed:** a smoke run used seeds offset by +500 (one rule, 2 histories).

Runner: `scripts/rsi-p7-embodied.mjs`. Output: `evidence/rsi-p7/run.json`.
