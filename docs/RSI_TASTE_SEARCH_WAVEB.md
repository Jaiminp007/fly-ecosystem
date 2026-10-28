# RSI search wave B (random control, matched budget) — no claimant

Plan: `docs/RSI_TASTE_REVISION_PLAN.md`. Same search bank
`evidence/rsi-taste-v1/search-20261027-v1/protocol.json` (`83fb6bd4…`),
4 histories × 4 arms = 16 worlds/proposal, score = mean(candidate-unlearned)
+ mean(candidate-reset). Procedure B ignores facts; 6 draws without replacement
from the 8 valid configs unevaluated in wave A, RNG seed `428907833`
(`python random.Random(seed).sample(pool,6)`), recorded here for replay.

## Draws and results (96 worlds)

* `b1-renew-t01-r003` (renewal/h1/t0.1/r0.03): seq +0.471, vsReset −0.026,
  score **0.445** (16 worlds).
* `b2-td-h16-t01` (td/h16/t0.1): +0.909 + 0.137 = **1.046**.
* `b3-renew-t1-r03` (renewal/h1/t1/r0.3): +2.316 + 0.627 = **2.942** (B-best).
* `b4-renew-t1-r003` (renewal/h1/t1/r0.03): +2.896 − 1.185 = **1.710**.
* `b5-td-h4-t01` (td/h4/t0.1): +1.124 − 0.044 = **1.080**.
* `b6-renew-t01-r03` (renewal/h1/t0.1/r0.3): −0.187 − 0.042 = **−0.229**.

No B proposal beats Gen0 search score **5.024**, nor A's best neighbor
`p6-td-hold4` (3.489). Best overall remains Gen0.

## Head-to-head (matched 96 vs 96)

* A (greedy, facts): 5 valid proposals, best 3.489, no claimant.
* B (random, no facts): 6 draws, best 2.942, no claimant.
* Neither procedure improves on Gen0 on this bank; productivity comparison is
  therefore **no advantage either way**, not a candidate win. This is a
  preserved negative, not a search-productivity claim.

## Accounting

* Search A: 96 worlds. Search B: 96 worlds. Revision evals: 0.
* Cumulative RSI: gen0 eval 48 + search 192 = **240 worlds**.
* Gen0 B-retention failure on `eval-20261027-v1` (`RSI_TASTE_GEN0_BASELINE.md`)
  stands; search did not resolve it because nothing beat Gen0 to warrant a
  fresh eval.

Evidence: `evidence/rsi-taste-v1/search-20261027-v1/{b1-*,b2-*,b3-*,b4-*,b5-*,b6-*}/`.
Next: gen1 direction decision — (i) wider menu (e.g. cruiseSpeed, capacity,
tasteRepresentation, feedingRule) under a new plan amendment with new search
bank, or (ii) close this revision line as no-improvement under the frozen menu
and keep Gen0 as the qualified base without RSI. No acceptance, no RSI.
