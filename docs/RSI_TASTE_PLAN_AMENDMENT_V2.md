# RSI plan amendment v2 (frozen 2026-10-28): wider menu, new search bank

Why: `RSI_TASTE_SEARCH_WAVE1.md` + `RSI_TASTE_SEARCH_WAVEB.md` show the
narrow menu (hold/motorRule/tasteRate/renewalRate) cannot beat Gen0 on
`search-20261027-v1` under matched 96v96 worlds (best A 3.49, best B 2.94 vs
Gen0 5.02). Closing the line is premature: three embodied dimensions that the
qualified base never searched remain frozen but legal — they change sensing,
feeding, and actuator scale, all with costs still charged:

* `feedingRule ∈ {matching, greedy}` (Gen0 greedy)
* `tasteRepresentation ∈ {pairwise, orthogonal}` (Gen0 orthogonal)
* `cruiseSpeed ∈ {0, 1}` (Gen0 0 = half-speed legacy; 1 = full-speed)

Plus the existing valid menu (hold/motorRule/tasteRate/renewalRate with the
wave-1 correction: hold≠1 only with td). Full valid space ≤ 14×2×2×2 = 112
configs. Search and acceptance rules, world counting, copy control, and RSI
claim thresholds in `RSI_TASTE_REVISION_PLAN.md` are unchanged; only the menu
grows. No reuse: new search bank `search-20261028-v2`, new eval banks per
generation as before. Prior negatives stand; no prior result is re-gated.

## Step 1 here (no proposals yet)

* Freeze this amendment.
* Create `evidence/rsi-taste-v1/search-20261028-v2/protocol.json` (fresh,
  `bank()` exclusion of all prior protocol/test seeds).
* Baseline Gen0 on its first 4 histories (16 worlds) to fix the new start
  line. Proposals (A greedy / B random) are next turn under the same ≤96-world
  caps, drawn from the wider unvisited set.

Execution (baseline only):
```
node scripts/taste-development.mjs \
  --bank evidence/rsi-taste-v1/search-20261028-v2/protocol.json \
  --output evidence/rsi-taste-v1/search-20261028-v2/gen0-search4 \
  --ticks 1792 --count 4 \
  --feeding greedy --taste orthogonal --taste-rate 1 \
  --motor ecology --hold 1 --motor-rule progress --greedy-inference \
  --arms candidate,unlearned,reset,acceptCruise
```
(CruiseSpeed defaults to 0, matching Gen0; cruise-1 variants are proposals.)
