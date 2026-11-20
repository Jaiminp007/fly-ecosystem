# RSI V5 results: FAILED all three pre-registered criteria

Plan: [RSI_V5_PLAN.md](RSI_V5_PLAN.md), committed in `d8dfe3d` before the
run. Evidence: `evidence/rsi-v5/run-v5.{json,log}` (local, gitignored).
Runtime 7578 s.

## Outcome

| Criterion | Requirement | Result |
|---|---|---|
| C1: revised update rule helps | U* ≠ U0; U* vs U0 wins > losses, p < 0.05, higher mean | U* = {count, α 1, ρ 0.5, floor 0.2}. 15–10 (23 ties), p = 0.21, mean 0.4833 vs 0.4825. **Fail** |
| C2: invented moves help | invented weight > 50%; U0 vs L0 wins > losses, p < 0.05 | Weight share 0.85, but U0 vs L0 is 17–12, p = 0.23. **Fail** |
| C3: transfer to unseen threshold worlds | C2's comparison holds there; U0 above no-search | Same comparison: p = 0.23. U0 0.483 vs no-search 0.467. **Fail** |

Reported, not gated:

- U* vs L0: 18–7, p = 0.022. This is not one of the pre-registered
  comparisons, so it is not a pass.
- Energy shows no benefit (U0 vs L0 11–18, U* vs L0 11–14).
- All 24 flies survive in every condition.

## Why it failed

- **Effect sizes are tiny.** The trained libraries beat the blind seed
  library by about 0.013 discrimination. A correct small code reaches about
  0.6 on these worlds, so the room to improve was there and went unused.
- **Credit is too sparse.** Training has about 80 search steps in total, and
  only accepted proposals earn credit. Most invented moves were tried once
  and never accepted. Their weight then settles at floor + 0.5/(1 + α) =
  0.45, close to the seed moves' weight.
- **The 85% invented weight share was met trivially.** It comes from having
  many invented moves at about 0.45 each, not from useful moves winning.
  The top-weighted moves differ between replicates (`add/random/4`,
  `keepOnly/lowOrder/6`, `remove/random/3`, …), and few rank by evidence.
  So C2's first condition was a weak test. That is noted for any future
  design.
- **The level-2 acceptances were weak.** They were 4–2 and 5–3 paired wins
  on 12 validation rows, and they did not replicate on the fresh test.

## What this means for VISION.md

V4's pass stands only as a narrow result. The winning move was
hand-written, the update rule was fixed, and the test stayed within the
training family. Under the stronger test the user asked for, none of these
three was achieved:

- invented moves that help;
- a revised update rule that helps;
- transfer to a different world family.

**RSI is not met.**
