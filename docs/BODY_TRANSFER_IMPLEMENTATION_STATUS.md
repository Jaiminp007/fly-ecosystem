# Body-transfer implementation status (Option A, frozen plan v1)

Authoritative plan: `docs/BODY_TRANSFER_PLAN_V1.md` (Astra, gpt-6-astra, 2026-10-28).
Rule: plan + this file are reread after every compaction; existing artifacts inspected
before continuing. Never duplicate executions or regenerate banks.

## Completed work
- [x] 2026-10-28: Retrieved frozen plan `docs/BODY_TRANSFER_PLAN_V1.md` from Astra thread
  (child thread completed; pursuit turn-before-translate actuator selected; 7 gates;
  104 mains + 336 probes = 440 executions; 72-seed fresh bank; V/Vsettled readback).
- [x] 2026-10-28: Harness core in `learning/taste-experiment.mjs` (uncommitted at status time):
  `body` N/P plumbing (N default, stock tickMotor path untouched), P pursuitMotor path
  (stationary forced -1, no cruiseSpeed overwrite, +2 adapter predicates, no tickMotor
  call), `nativeFullCruise` fixed arm (movement 1, N-only), `runTasteProbe` body switch
  + body tag in row, checkpoint body persist/backfill, endpoint `operationsBilled`
  aggregate for Vsettled. Fixed-arm action mapping corrected to
  `acceptStationary?2:0` so nativeFullCruise acts (0).
- [x] 2026-10-28: `tests/body-transfer.test.mjs` 6/6 green (P mapping exactness vs
  pursuitMotor, billing floor, stationary -1, N default bit-identity + restore,
  nativeFullCruise movement-1 + resume-exact, N->P probe shared start hash + body
  tags, checkpoint backfill). Synthetic seeds used: 355001-355009 (literals in test
  file, auto-excluded from future banks by numeric-token scan).
- [x] 2026-10-28: Runner + frozen scorer `scripts/body-transfer.mjs`: Gen1-R4 flags
  hardcoded, 6-arm x N/P + shared nativeFullCruise mains (1792 ticks), 17-probe
  batteries + 8 direct N->P (256 ticks), union exclusions (evidence all-dirs +
  handoff small-JSON + tests + own script), 72-seed bank, source-manifest freeze,
  7-gate V+Vsettled scorer with FAIL-source/FAIL-body/INVALID verdict logic,
  gate-7 re-verification (residuals, revival, nondegeneracy, 8 GiB), caps ledger.
- [x] 2026-10-28: `tests/body-transfer-score.test.mjs` 7/7 green (settled math,
  all-pass clears N+P+direct, N-only failure localizes, tie semantics, bank draws
  72 unique fresh seeds excluding 41 + synthetic 355001-355009, manifest covers
  plan/adapter/scorer). Throwaway bank `evidence/body-transfer/test-bank-01/`
  drawn (seeds auto-excluded from the real bank by the union scan).
- [x] 2026-10-28: Targeted suites 38/38 green (taste-experiment + taste-energy +
  body-transfer). Harness `startPending` probe field added for Vsettled.
- [x] 2026-10-28: IMPLEMENTATION FREEZE. Gen1 flags verified against
  `evidence/taste-qualification/20261027-v2/attempt-01-ecology/attempt.json`
  (greedy/orthogonal/rate-1/ecology/hold-1/progress/renewal-.1/greedyInference/
  no-warm-start/cruise-0/1792 ticks) + replayPasses 4. Design-basis hashes match
  plan: taste-energy 24b91847…, pursuit-authority 0c2b55cf…, taste-pressure
  a1604a8a…. taste-experiment 6ee9b1d4… (documented harness delta: body P/
  nativeFullCruise/startPending/operationsBilled). Freeze commit holds all code.
  Source manifest: 42 files incl. plan, adapter, scorer, both test files.
- [x] 2026-10-28: Full `npm test`: 461/473 pass, 8 skipped, 4 fail PRE-EXISTING
  (verified failing on clean tree via stash: taste-energy-audit cold-replay x2,
  value-development Python-recompute + inference-closure x2). Unrelated to this study.

## Checks
- P mapping verified decision-by-decision against `pursuitMotor` on live `own.raw`.
- N default path: restore-resume checkpoint equality holds (existing suite green).
- Direct N->P probe: same seed => identical `startWorldSha256` across bodies.

## Blockers
- None. Pre-existing audit failures documented above; do not touch those files.

## Artifact paths
- Plan: `docs/BODY_TRANSFER_PLAN_V1.md` (untracked, to commit).
- Harness: `learning/taste-experiment.mjs` (modified, to commit).
- Tests: `tests/body-transfer.test.mjs` (untracked, to commit).
- Runner/scorer: `scripts/body-transfer.mjs` WRITTEN + synthetic-verified (to commit).
- Scorer fixtures: `tests/body-transfer-score.test.mjs` 7/7 green (to commit).
- Bank: NOT DRAWN. Attempt: NOT RUN. Results: NOT PUBLISHED.

## Source/bank hashes
- Plan-design basis hashes: see plan §Fresh-bank (taste-energy 24b91847…,
  taste-experiment 630d0e82…, taste-development 12ee7df7…,
  pursuit-authority 0c2b55cf…, taste-pressure a1604a8a…).
- Post-harness source hashes (freeze): script 3b8a7295…, taste-experiment
  6ee9b1d4…, taste-energy 24b91847…, pursuit-authority 0c2b55cf…,
  taste-pressure a1604a8a…, body-transfer.test 35f4f826…,
  body-transfer-score.test 7b541746…, plan 04f66e61… (42-file manifest).
- Bank hash: d21fb50a… (`evidence/body-transfer/v1/fresh-01/protocol.json`):
  8 histories / 72 fresh seeds, 19,791 excluded, 1,359 evidence registries,
  75 handoff sources. Drawn once 2026-10-28 post-freeze; never regenerate.

## Execution ledger
- Worlds run for the study: 0 / 440. Study bank seeds spent: 72 (fresh-01).
- Pre-freeze synthetic worlds only (2-founder, <=5 ticks, seeds 355001-355009).

## Spent seeds
- 355001-355009 (synthetic harness checks; must remain excluded via test-file scan).

## Next action
1. Run the single authorized attempt-01 (440 executions) on fresh-01.
2. Independent audit, publish `docs/BODY_TRANSFER_RESULTS_V1.md`, update PROGRESS.
