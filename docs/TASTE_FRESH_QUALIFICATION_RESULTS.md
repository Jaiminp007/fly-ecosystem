# Taste-ecology fresh qualification results (attempt-01, FAIL)

Frozen plan: `docs/TASTE_FRESH_QUALIFICATION_PLAN.md`.
Fresh bank: `evidence/taste-qualification/20261027-v1/protocol.json`
(bankSha `0754c4db1e2193a3f52c72ac3310f1dbb235b85dc7013e2cbb30bd7bdb52b23f`,
distinct from dev-bank `893c60a9...`).
Candidate freeze: ecology / greedy / orthogonal / rate 1 / hold 1 / progress /
greedy-inference / cruiseSpeed 0.
Source: `taste-energy.mjs:fbb4787a84f8...` (same as attempt-18).
Command in plan executed as written; 8 fresh histories, 1792 ticks, arms
`candidate,unlearned,frozen,reset,acceptCruise,acceptStationary`.
Runtime ~212 s wall. Tests: 18 pass 0 fail. Integrity asserts pass
(residual <1e-7, common starts, sources unchanged).

## Outcome vs predeclared gates: FAIL (1 of 5 groups fails)

1. Lifetime:
   * vs unlearned: mean +4.90, 8/8, +73 survivors — PASS.
   * vs frozen: mean +3.62, 8/8, +37 — PASS.
   * vs reset: mean +0.55, **4/8 positive**, +7 survivors — **FAIL**
     (required ≥6/8). Effects:
     `[-0.185, +2.780, -0.356, +1.731, +0.545, -1.377, -0.787, +2.042]`.
     Four fresh histories lose to acquired-reset despite winning on average.
2. Skill existence: PASS.
   `aSkill` mean +0.46 (6/8); `bSkill` mean +1.29 (7/8);
   `bAcquisition` mean +1.11 (8/8).
   Note: A-skill small and uneven (saved effects include -0.75, -0.56);
   two histories have no positive saved A advantage.
3. Retention: PASS on means, fragile on B.
   * A: retained 0.817 vs saved 0.458 → descriptive 95% true, +3 survivors.
     `aRetention` mean +0.382, 6/8.
   * B: retained 1.297 vs saved 1.291 → true, +3 survivors.
     `bRetention` mean **+0.070**, 4/8 — barely positive.
   Per plan thresholds (mean>0, ≥4/8, survivor ≥-2) both pass, but B margin
   is thin and A-skill itself is small in places.
4. Transfer (noninferiority): PASS.
   `transferReset` mean 0.0 exactly, 8/8 ≥ -0.5, survivor 0 (required
   mean ≥ -0.25, survivor ≥ -2). Ties reset as in development; superiority
   still fails (0/8 positive) and is not required.
   Vs cruise mean -0.215 (reported, ungated); vs stationary +12.54.
5. Integrity: PASS.

Verdict: **fresh qualification FAILS** on lifetime vs reset consistency.
No qualification claimed; no RSI; all prior failures stand. These seeds are
now spent and become exploratory on any reuse; retry needs a new plan and
new fresh seeds.

## Diagnosis (observation, not proof)

Failing seeds (candidate minus reset): 4283663963 -0.185, 3016510756 -0.356,
3064910111 -1.377, 1023129252 -0.787. Candidate still beats unlearned/frozen
there; reset survivors 8-10 vs candidate 9-11 — close survival, energy gap
from B/C policy, not mass death. Reset gets a fresh zero-weight start at B/C
(always-cruise under greedy) with no prior interference and slightly lower
compute than the 96-dim net. Candidate retains descriptively but pays
interference + compute. Development 6/8 vs reset did not generalize; fresh
4/8 shows variance underestimated on reused bank.

## Next (requires new plan + new seeds, no tuning on these)

* Consider lifetime vs reset as noninferiority (e.g. mean ≥ -0.25 with
  survival ≥ 0) rather than superiority, with superiority retained vs
  unlearned/frozen; justify from reset being a strong interference-free
  control, not a null. Predeclare before seeing new seeds.
* Reduce 96-dim compute tax or demonstrate B/C adaptation that overcomes it;
  any code change needs a new source freeze and new plan.
* Keep transfer noninferiority; do not claim transfer win from ties.
* RSI stages remain locked behind a passed qualification; no autonomous
  revisions started here.

Evidence: `evidence/taste-qualification/20261027-v1/attempt-01-ecology/`
(`attempt.json`, `results.json`, `rows/`, `sources/`, `protocol.json`).
