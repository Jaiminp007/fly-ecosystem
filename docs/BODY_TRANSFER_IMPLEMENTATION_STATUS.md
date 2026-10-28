# Body-transfer implementation status (Option A, frozen plans v1 + v2)

Authoritative plans: `docs/BODY_TRANSFER_PLAN_V1.md` (COMPLETE, FAIL-source)
and `docs/BODY_TRANSFER_PLAN_V2.md` (FROZEN 2026-10-28, active).
Rule: plans + this file are reread after every compaction; existing artifacts
inspected before continuing. Never duplicate executions or regenerate banks.

## V2 active work (translation-preserving pursuit Q + harsh-P control)
- [x] 2026-10-28: V2 goal created. V1 post-mortem: harsh P converted
  15,446-17,521 cruise decisions/history into stationary stops (~36-41% of all
  live decisions); P lifetime -3.42 vs N; direct transport gaps -0.24/-0.99
  mean, floors -1.07/-2.84. Base-rate table: 8 prior fresh-eval aRet means
  +0.006..+0.642, so V1 N (-0.076) is plausibly bank luck. Frozen plan V2
  written (`docs/BODY_TRANSFER_PLAN_V2.md`): Q = V1 pursuit turn law with
  cruise move always 0 (identical translation to native), same 7 gates on
  N+Q, P retained descriptively, fresh 72-seed bank, 688-execution budget.
- [ ] Harness Q path + synthetic tests (fresh seed range, disjoint from V1).
- [ ] Runner V2 mode (N/Q gated, P descriptive, N->P + N->Q direct, Q exposure
  + translation assertions) + scorer tests. Full `npm test` green.
- [x] 2026-10-28: Harness + runner + scorer + 12 new tests committed
  (`6f3d51f`); learner flags zero-mismatch vs v2qual artifact (Gen1 R=4).
  Full suite 485 tests: 473 pass, 4 pre-existing env/closure fails, 8 skipped.
- [x] 2026-10-28: attempt-01 executed FROZEN under `6f3d51f` — 152 mains +
  536 probes = 409,600 world-ticks exactly as planned; burned 23.3e9 ≤ 240e9;
  final log line crashed post-write (bare variable ref). Repaired `f5999a9`,
  `--resume` verified bank + 1-file rule, 0 new executions, rescored identical.
- [x] 2026-10-28: independent Python audit — gate values exact, 0/384 revival
  violations, exposures P≥15,495 / Q≥24,621, QmovesMax 0, bank SHA match.
- [x] 2026-10-28: `docs/BODY_TRANSFER_RESULTS_V2.md` published — **FAIL-body**
  (N requalifies 7/7; Q g5 A-ret −0.13 3/8 + direct floors −1.69/−0.85; Q
  recovers +1.02/+0.58 transport vs P descriptively). V1 + V2 families CLOSED.
  No Option B, no RSI reopen under this goal.
- [ ] Implementation freeze (flag verification vs v2 qualification artifact,
  source hashes incl. V2 plan). Then draw ONE V2 bank. Then single attempt.

## V1 completed work (preserved record)
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
- None open. Two preserved incidents, both fully documented in
  `docs/BODY_TRANSFER_RESULTS_V1.md`: (1) EEXIST halt + verified resume;
  (2) gate-7 revival-reference bug + analytic `--rescore` (original INVALID
  preserved in `results-superseded.json`). Originals kept: `failure.json`,
  partial-row history in git-ignored evidence, both instrument diffs in git.

## Artifact paths
- Plan: `docs/BODY_TRANSFER_PLAN_V1.md` (untracked, to commit).
- Harness: `learning/taste-experiment.mjs` (modified, to commit).
- Tests: `tests/body-transfer.test.mjs` (untracked, to commit).
- Runner/scorer: `scripts/body-transfer.mjs` committed (resume + rescore paths).
- Scorer fixtures: `tests/body-transfer-score.test.mjs` 8/8 green (committed).
- Bank: DRAWN d21fb50a… (committed record). Attempt: COMPLETE (resumed + rescored).
  Results: PUBLISHED `docs/BODY_TRANSFER_RESULTS_V1.md`. Audit: `audit.json` (26/26 match).

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
- Worlds run for the study: 104 mains + 336 probes = 440 unique completions
  (ledger exact); 16.04e9 ops burned of 137.6e9 cap; runtimes within caps.
- Pre-freeze synthetic worlds only (2-founder, <=5 ticks, seeds 355001-355009).
- Pre-freeze synthetic worlds only (2-founder, <=5 ticks, seeds 355001-355009).

## Spent seeds
- 355001-355009 (synthetic harness checks; must remain excluded via test-file scan).

## Next action
1. DONE 2026-10-28: attempt-01 complete (resume), analytic rescore to
   FAIL-source, independent 26-value audit (all match), results published,
   PROGRESS updated. Family closes; no second attempt, no Option B.

## V2 follow-up: retention-interference diagnostic (2026-10-28, analytic only)
- Dissected frozen V2 anchors read-only (zero executions, zero seeds spent):
  recent-buffer A-cue washout total on all 16 history×body cells; taste drift
  magnitude 5.2-8.4 L2, drift direction cos(A->B,A->C) ~+0.77, tasteScale frozen
  0.250, critic norm 0.000 at atA (anomaly flagged, not pursued) — ALL uniform
  pass-vs-fail; N and Q mechanistically identical. Retention detail (±0.1) sits
  below every macroscopic handle the program ever turned. See
  docs/RETENTION_DIAGNOSTIC_V2.md (frozen). World count unchanged (5128+440+688).
- Proposed next lines (none executed/banked/predeclared; need new goal + frozen
  plan): (1) bigger-ruler multi-bank protocol, (2) directional anchoring via
  untested two-timescale machinery, (3) Option B new sense (localResourceSense
  amount channel, currently unimported).
- Diagnostic committed locally; NOT pushed to PR #3 (kept as V1+V2 ship).

## V3 line opened: slow-direction anchor (2026-10-28, DESIGN ONLY)
- Frozen plan `docs/BODY_TRANSFER_PLAN_V3.md`: first line to protect readout
  *direction* (slow-EMA rotation-damped anchor, μ=1e-3, λ∈{0,0.02,0.08}) rather
  than reallocate rehearsal volume. Explicitly-identified revised learner
  (Gen1 R=4 + anchor; λ=0 bit-identical default). N+Q gated, P dropped (spent),
  same 7 V2 gates/bars, refusal criteria unchanged.
- Two phases: D (one 32-seed dev bank, N-only, predeclared go bar
  ΔA-ret≥+0.15 / B≥−0.10 / level≥−0.20 / alignment strictly up, else CLOSE) then
  Q (one fresh 72-seed bank, 432 executions, single attempt + audit) iff D goes.
  Worst case 708 executions. No qual seeds touched; no code written yet.
- Next action: implement anchor in taste-energy.mjs (opt-in flag, billed ops,
  checkpointed) + synthetic tests on fresh 37700x range → freeze → Phase D.

## V3 implementation (2026-10-28, synthetic only, no banks/worlds)
- Anchor implemented in `learning/taste-energy.mjs`: opt-in `slowAnchorRate` /
  `slowAnchorStrength` (default 0 = Gen1 bit-identical), EMA slow vector
  `weights.slowDir`, rotation-only pull `+λ(s/|w||s| − w·c/|w|²)` skipped while
  either norm is zero, all ops billed, checkpointed/restored/reset; scoped to
  single-readout configs (streams>1/phaseSlots>1 + λ>0 throws).
- `tests/taste-anchor.test.mjs` 6/6 green on fresh 377001-377006 range
  (bit-identity, billing floor, rotation property, zero-slow guard, restore,
  reset, combo rejection). Full suite: 491 tests, 479 pass, 4 fail
  PRE-EXISTING (reconstruction/closure audits 356/357/481/482 — same class as
  before, numbers shifted by the 6 new tests), 8 skipped.
- Next: freeze record → Phase-D dev instrument (`scripts/body-transfer-dev.mjs`,
  new code under V3 plan) → ONE 32-seed dev bank → 276 executions → go/no-go.

## V3 Phase D COMPLETE — DEV-NOGO, line CLOSED (2026-10-28)
- Dev bank `evidence/body-transfer/v3-dev/fresh-01/protocol.json` (36 unique fresh
  seeds): drawn once, single run, spent. No qual bank drawn, no qual seeds touched.
- Attempt `evidence/body-transfer/v3-dev/attempt-01/`: 72 mains + 156 probes =
  228 executions, 9.79e9 ops (caps 276/90e9). All rows/anchors/ledger complete
  with inline integrity; count-constant correction (204->156, see results doc)
  completed scoring analytically via --rescore, zero new worlds.
- Verdict DEV-NOGO (audited from raw records, exact match): ΔA=-0.18, ΔB=-0.49,
  ΔL=-0.33 (all fail), alignment up (only pass). Mechanism: anchor moves weights
  below action-flip threshold (bit-identical energy across λ) except harmful flips.
- V3 line CLOSED per frozen rule. Published docs/BODY_TRANSFER_RESULTS_V3_DEV.md.
