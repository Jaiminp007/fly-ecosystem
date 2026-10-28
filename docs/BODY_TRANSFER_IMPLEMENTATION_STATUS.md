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
- Runner/scorer: `scripts/body-transfer.mjs` NOT YET WRITTEN (next action).
- Bank: NOT DRAWN. Attempt: NOT RUN. Results: NOT PUBLISHED.

## Source/bank hashes
- Plan-design basis hashes: see plan §Fresh-bank (taste-energy 24b91847…,
  taste-experiment 630d0e82…, taste-development 12ee7df7…,
  pursuit-authority 0c2b55cf…, taste-pressure a1604a8a…).
- Post-harness source hashes: to record at implementation freeze.
- Bank hash: none (not drawn).

## Execution ledger
- Worlds run for the study: 0 / 440. Study bank seeds spent: none.
- Pre-freeze synthetic worlds only (2-founder, <=5 ticks, seeds 355001-355009).

## Spent seeds
- 355001-355009 (synthetic harness checks; must remain excluded via test-file scan).

## Next action
1. Commit plan + harness + tests.
2. Write `scripts/body-transfer.mjs`: union exclusions, frozen Gen1-R4 protocol,
   6-arm x 2-body + nativeFullCruise mains, 17-probe batteries + 8 direct N->P,
   7-gate scorer (V + Vsettled), caps ledger, source-manifest freeze.
3. Synthetic-verify scorer/gates on fixtures (no bank draw).
4. Freeze sources, draw ONE fresh bank, run single attempt, audit, publish.
