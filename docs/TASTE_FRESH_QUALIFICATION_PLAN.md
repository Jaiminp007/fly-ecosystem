# Taste-ecology fresh qualification plan (frozen 2026-10-27)

Scope: first qualification attempt for the odor-free ecology learner.
Development bank `dev-bank-v1` is explicitly reused development evidence and
cannot qualify. This plan uses fresh seeds excluding every prior
`protocol.json`, test/script numeric token, and engineering fixture, via the
existing `bank()` registry scan. First use of these seeds is qualification;
any reuse becomes exploratory.

## Frozen candidate

* `learning/taste-energy.mjs` with `motorRepresentation='ecology'` (96-dim,
  blocks 0-3 cue-world, 4-5 odor-free search/contact), as in
  `docs/ECOLOGY_MOTOR_SEPARATION_RESULTS.md`.
* Feeding `greedy`, taste `orthogonal`, `tasteRate 1`, `holdTicks 1`,
  `motorRule progress`, `renewalRate .1`, `greedyInference true`,
  `cruiseSpeed 0` (half-speed legacy interface).
* All work/bytes charged via `chargeForStep`; deaths keep original founder
  denominator; common physical starts for probes; no revival.

Source freeze: record `sourceSha256` in attempt; any change invalidates this
plan and requires a new plan.

## Fresh bank

* Path: `evidence/taste-qualification/20261027-v1/protocol.json`
  (created by `bank()` scan; 8 histories, 1792 ticks).
* Exclusion: every integer seed in any `evidence/**/protocol.json`,
  `tests/*.mjs`, `scripts/*engineering*.mjs` / `*fixtures*.mjs`, plus prior
  registries/engineering lists.
* Output: `evidence/taste-qualification/20261027-v1/attempt-01-ecology/`
  via `runTasteDevelopment` with arms
  `candidate,unlearned,frozen,reset,acceptCruise,acceptStationary`.
* Runner still labels `qualified:false` / exploratory scope; qualification is
  decided here, not by the runner flag.

## Controls (same as development)

* `candidate`: learns A→B→C→return-A.
* `unlearned`: frozen from start (no learning).
* `frozen`: frozen after A (frozen-acquisition control).
* `reset`: reset at B/C (acquired-reset control).
* `acceptCruise` / `acceptStationary`: fixed-action controls, same cruise
  interface, same physical costs except learner compute.

## Endpoints and predeclared gates (all 8 fresh histories, 1792 ticks)

Let `sequence = candidate - unlearned` per-founder budget-adjusted energy;
`acquiredA = early-A:current - early-A:reset`; `retained = current-reset`;
`saved = family-reset`; `aRetention = current - (.95*A + .05*reset)`;
same for B; `transferReset = transfer:current - transfer:reset`.

1. Lifetime vs unlearned, frozen, reset: mean > 0, ≥6/8 histories positive,
   summed survivor difference ≥ 0 for each contrast.
2. Skill existence: `aSkill = A:A - A:reset` mean > 0; `bSkill = B:B - B:reset`
   mean > 0; `bAcquisition = B:B - B:A` mean > 0. At least 6/8 positive each.
   If saved ≤ 0, retention is not evaluable (fail, not pass).
3. Retention: `aRetention` mean > 0 and `bRetention` mean > 0 (i.e. retained
   ≥ 95% saved on average); each ≥ 4/8 positive (allows noisy probes but
   requires mean); probe survivor difference (current minus family) ≥ -2 per
   family, summed ≥ -2.
4. Transfer (noninferiority, not superiority): `transferReset` mean ≥ -0.25
   per founder, ≥ 4/8 non-negative? No — require ≥ 4/8 histories with
   `transfer:current - transfer:reset ≥ -0.5` and survivor difference ≥ -2.
   Rationale: cruising is optimal in odor-free ecology; zero expected movement
   difference under greedy inference, remaining gap is measured compute cost
   (~0.1 total from 32 extra weights). Superiority vs reset is not required;
   loss beyond margin fails.
   Also report vs `acceptCruise` / `acceptStationary` without gating, to keep
   compute cost visible.
5. Integrity: accounting residual < 1e-7 every world (runner asserts);
   no revival; common probe starts (runner asserts); sources unchanged
   during attempt (runner asserts).

Multiplicity: this is one frozen attempt on fresh seeds. No reselection,
no tuning on these seeds. Any failure stands; a new plan with new seeds is
required for retry.

## What does not qualify

* Passing development bank (attempt-18) does not qualify.
* Passing software tests does not qualify.
* One accepted forecast revision does not qualify.
* This single qualification, even if passed, does not establish RSI. RSI needs
  ≥2 successive persistent autonomous revisions plus search-productivity vs
  copied-improvement and matched-budget controls per
  `docs/ASTRA_REVIEW_DECISION.md:4`.

## Execution

```
node scripts/taste-development.mjs \
  --bank evidence/taste-qualification/20261027-v1/protocol.json \
  --output evidence/taste-qualification/20261027-v1/attempt-01-ecology \
  --ticks 1792 --count 8 \
  --feeding greedy --taste orthogonal --taste-rate 1 \
  --motor ecology --hold 1 --motor-rule progress --greedy-inference \
  --arms candidate,unlearned,frozen,reset,acceptCruise,acceptStationary
```

Note: check CLI flag names for bank/output in `scripts/taste-development.mjs`
before running; preserve exact command in results.
