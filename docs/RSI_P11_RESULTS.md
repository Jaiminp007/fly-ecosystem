# RSI P11 results: level-2 revision alone, embodied (FAILED)

The plan, [RSI_P11_PLAN.md](RSI_P11_PLAN.md), was frozen in `c487f58` before the run. Output: `evidence/rsi-p11/run.json`, kept locally. The run took 1548 s.

| Measure | Value |
|---|---|
| A − A0 mean (U* library vs U0 library, embodied energy) | +0.38 |
| sd | 2.43 |
| Rules positive / negative / zero | 17 / 10 / 5 |
| p (sign-flip, Monte Carlo 200k) | 0.19 |
| Discovery (top term is extend/evid): U* / U0 | 27/32 / 26/32 |

**G1 fails**: p is not below 0.05.

- **Why it failed.** On this bank, U* (two-gene invention) did not discover the key move more often than U0: 27 libraries against 26. In P9 the split was 32 against 26. The two arms' discovery failures fell on different rules: U* missed 5 and U0 missed 6. So the embodied differences are mixed in sign.
- **What this means.** The level-2 revision is supported in the surrogate (P9, p = 0.00064). Its effect in the embodied fly is **not shown**: P10 gave p = 0.051, reported only, and P11 gave p = 0.19, pre-registered. Per the P11 plan, the level-2 embodied claim stays "not shown".
- **What is unaffected.** Embodied benefit of the self-improving system as a whole, against blind search and against no search, stands: P8 and P10.
