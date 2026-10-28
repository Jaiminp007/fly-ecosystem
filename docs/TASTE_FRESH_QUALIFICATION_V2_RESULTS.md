# Taste-ecology fresh qualification v2 results (attempt-01, PASS)

Frozen plan: `docs/TASTE_FRESH_QUALIFICATION_PLAN_V2.md`.
Fresh bank: `evidence/taste-qualification/20261027-v2/protocol.json`
(bankSha `6e85849689b0d4d5fdc53d0db3d23e9b737f49c5db1e074d3e7231db33f2e22d`,
distinct from dev `893c60a9…` and v1-fresh `0754c4db…`).
Candidate freeze unchanged: ecology / greedy / orthogonal / rate 1 / hold 1 /
progress / greedy-inference / cruiseSpeed 0.
Source: `taste-energy.mjs:fbb4787a84f8…` (same as attempt-18, v1-fresh).
Command in v2 plan executed as written; 8 fresh histories, 1792 ticks, arms
`candidate,unlearned,frozen,reset,acceptCruise,acceptStationary`.
Runtime ~156 s wall. Tests: 18 pass (rechecked pattern; runner asserts pass:
residual <1e-7, common starts, sources unchanged).

## Outcome vs predeclared v2 gates: PASS (all 7 groups)

1. vs unlearned (superiority): mean **+5.08**, 8/8, +77 — PASS.
2. vs frozen-after-A (superiority): mean **+3.30**, 8/8, +45 — PASS.
3. vs reset-at-B/C (noninferiority): mean **+0.88**, **6/8** ≥ -1.00
   (losses -0.431, -0.011), +14 survivors — PASS.
   Effects: `[+1.084, -0.431, +1.600, +1.847, +1.929, +0.538, -0.011, +0.502]`.
   Also passes v1 strict superiority (≥6/8) on these seeds.
4. Skill existence: PASS. `aSkill` +1.33 (7/8, one -0.098);
   `bSkill` +1.39 (8/8); `bAcquisition` +0.78 (8/8). All saved means > 0.
5. Retention: PASS. A retained 1.467 vs saved 1.332 → ≥95% true, +2 surv;
   `aRetention` +0.202, 5/8. B retained 1.446 vs saved 1.391 → true, +0 surv;
   `bRetention` +0.124, 6/8. Both mean>0, ≥4/8, survivor ≥-2.
6. Transfer (noninferiority): PASS. `transferReset` 0.0 exactly 8/8, surv 0
   (required mean ≥-0.25, all ≥-0.50). Superiority still 0/8, not required.
   Vs cruise -0.225 (reported, ungated — measured 96-dim compute);
   vs stationary +13.37.
7. Integrity: PASS.

Verdict: **first fresh qualification PASS** for the odor-free ecology learner
as a continuing embodied learner with retained A/B skills and
noninferior original-ecology transfer. v1-fresh FAIL stands on its own seeds.
These v2 seeds are now spent; reuse becomes exploratory.

## What this establishes (and does not)

* Establishes: on 8 prospective histories, the same-trajectory learner gains
  lifetime energy over no-learning and stopped-at-A, does not lose to
  interference-free reset beyond margin, keeps ≥95% of saved A/B skill on
  average with survival held, and ties reset in odor-free ecology with costs
  fully charged. Memory pressure is within-lifetime (capacity 32, recent-8 +
  sampled older, 1792 ticks across A→B→C→return-A with moving/scarce phases).
* Does not: prove population generality (8 histories, outcome-selected
  program); claim RSI, autonomous revision, or search productivity; bypass
  survival/fresh-task totals for any future claim. RSI needs ≥2 successive
  persistent autonomous revisions vs copied-improvement and matched-budget
  controls per `ASTRA_REVIEW_DECISION.md:4`, on top of this qualified base.

Evidence: `evidence/taste-qualification/20261027-v2/attempt-01-ecology/`
(`attempt.json`, `results.json`, `rows/`, `sources/`, `protocol.json`).
