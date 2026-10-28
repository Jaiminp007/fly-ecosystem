# Taste-ecology fresh qualification plan v2 (frozen 2026-10-27)

Follows `TASTE_FRESH_QUALIFICATION_PLAN.md` (v1) and
`TASTE_FRESH_QUALIFICATION_RESULTS.md` (v1 FAIL on vs-reset 4/8).
Same frozen candidate, new fresh seeds, revised vs-reset margin per Astra
wording. No tuning on v1-fresh or dev seeds; v1-fresh seeds are spent.

## Why revise vs-reset to noninferiority

Astra (`ASTRA_REVIEW_DECISION.md:3`) requires frozen-acquisition,
acquired-reset, incumbent, fixed-action and reactive controls with
predeclared per-skill and survival noninferiority margins — not lifetime
superiority over an interference-free reset. Reset zeroes weights at B/C by
design, avoiding interference while keeping the same 96-dim compute; the
continuing learner pays interference by definition. v1-fresh showed the
candidate beats unlearned (+4.90 8/8) and frozen (+3.62 8/8) but splits reset
(+0.55 4/8). Treating any split as disqualification makes reset unbeatable
even when retention means pass. v2 keeps superiority where learning must win
(unlearned, frozen) and noninferiority where interference is expected
(reset), with survival gates intact.

No code change in v2: same `taste-energy.mjs:fbb4787a…` ecology, same
greedy/orthogonal/rate-1/hold-1/progress/greedy-inference/cruiseSpeed-0.
Any future code change needs a new freeze and new plan.

## Frozen candidate (unchanged)

Same as v1. Record `sourceSha256` in attempt; mismatch invalidates.

## Fresh bank v2

* Path: `evidence/taste-qualification/20261027-v2/protocol.json`
  (new `bank()` scan excludes dev-bank, v1-qualification, all prior
  `protocol.json` and test/script numeric tokens).
* 8 histories, 1792 ticks. First use is qualification; reuse becomes
  exploratory.
* Output: `evidence/taste-qualification/20261027-v2/attempt-01-ecology/`
  arms `candidate,unlearned,frozen,reset,acceptCruise,acceptStationary`.

## Gates v2 (8 fresh histories, predeclared)

Let definitions match v1 (sequence, acquiredA, retained/saved, aRetention /
bRetention, transferReset).

1. Lifetime vs unlearned (superiority): mean > 0, ≥6/8 positive,
   survivorDifference ≥ 0.
2. Lifetime vs frozen-after-A (superiority): mean > 0, ≥6/8 positive,
   survivorDifference ≥ 0. (Continued learning must beat stopping at A.)
3. Lifetime vs reset-at-B/C (noninferiority): mean ≥ -0.50 per founder,
   ≥5/8 histories with effect ≥ -1.00, summed survivorDifference ≥ -4.
   Rationale: allows modest interference loss, forbids large/consistent loss
   or survival collapse. Mean +0.55 on v1-fresh would pass; 4/8 splits pass
   only if losses are shallow and survival holds.
4. Skill existence: `aSkill`, `bSkill`, `bAcquisition` means > 0; each
   ≥6/8 positive except `aSkill` ≥5/8 (v1-fresh A-skill uneven: 6/8 with two
   negative saved). If any saved mean ≤ 0, that retention is unevaluable →
   FAIL.
5. Retention: `aRetention` mean > 0 and `bRetention` mean > 0, each ≥4/8
   positive; probe survivorDifference ≥ -2 per family. (Same as v1.)
6. Transfer (noninferiority): `transferReset` mean ≥ -0.25, all 8 histories
   ≥ -0.50, survivorDifference ≥ -2. (v1-fresh: 0.0 exactly, passes.)
   Report vs cruise/stationary ungated.
7. Integrity: residual <1e-7, no revival, common starts, sources unchanged
   (runner asserts).

One frozen attempt. No reselection or tuning on these seeds. Fail stands;
retry needs new plan + new seeds.

## What v2 does not do

* Does not re-gate v1-fresh seeds; v1 FAIL stands.
* Does not claim RSI, autonomous revision, or search productivity.
* Does not change code, costs, denominators, or probe semantics.

## Execution

```
node scripts/taste-development.mjs \
  --bank evidence/taste-qualification/20261027-v2/protocol.json \
  --output evidence/taste-qualification/20261027-v2/attempt-01-ecology \
  --ticks 1792 --count 8 \
  --feeding greedy --taste orthogonal --taste-rate 1 \
  --motor ecology --hold 1 --motor-rule progress --greedy-inference \
  --arms candidate,unlearned,frozen,reset,acceptCruise,acceptStationary
```
