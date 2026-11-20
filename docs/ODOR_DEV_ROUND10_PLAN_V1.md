# ODOR DEV ROUND 10 — PLAN V1 (FROZEN)

Date: 2026-11-02. Status: FROZEN — implement exactly as written; any
change needs an amendment, never a silent edit. Zero worlds spent by
this doc. Parent scoping: `docs/ODOR_DEV_ROUND10_SCOPING_V1.md` (H10,
falsifier shape carried).

## Hypothesis H10 (carried)

Split matrices preserve positive learning where the negative flood
doesn't reach: Go updates on target=1 records only, No-Go on
target=0 only, behavior reads their difference.

## Instrument (frozen)

Target: `learning/odor-routed-taste.mjs` (same measured substrate).
R10's instrument is DISJOINT from R8's baseline and R9's quantiles
(neither plumbed in the R10 runner; both default off).

1. State: `state.taste.goW` / `state.taste.nogoW` (11-dim each, init
   zeros; allocated only when split — legacy `taste.weights` path
   stays verbatim for null). Null: config `splitTaste=false`
   (validated boolean; absent ≡ false ≡ legacy behavior AND billing).
2. Frozen values: fixed step `.5*err/tasteScale`, clip ±8 (same as
   legacy — the ONLY novelty is routing, not magnitude).
3. Split update (`update(state,record,mode)`, mode kept from A2;
   baseline off in R10): route = record.target===1 ? Go : No-Go
   (plain JS); head-own prediction pred_h = sigmoid(priorLogit +
   w_h·phi/tasteScale) INLINE (no prediction() call); err = target −
   pred_h (1−pred on Go, 0−pred on No-Go — each matrix calibrates
   ITSELF); step + clip as legacy; the unrouted head untouched.
   Both modes update the routed head (no mode distinction beyond the
   off baseline).
4. Behavior: `prediction(state,phi)` with split returns
   sigmoid(priorLogit + (goW−nogoW)·phi/tasteScale) (difference of
   readouts); `predictTargetTaste` wrap unchanged. Initial: both zero
   → 0.75 = legacy initial (single-variable clean: same start, same
   rule shape, routing only).
5. Billing (lumped, frozen): split path — `update()` per call **82**
   (composition: 29 head-pred + 48 update + 4 baseline-off + 1 route);
   behavior `prediction()` per call **59** (2×29 + 1 difference).
   Null path bills legacy verbatim (29/52, same calls).
6. Lifecycle: creation option `splitTaste=false`; experiment
   constructor option default false, threaded to body creation; reset
   clears allocated heads (keeps the flag); restore `??=` (missing →
   false/undefined → legacy path; spent anchors rehydrate legacy);
   fork via restore; transplant digests N/A on this line (verified
   absent — anchors JSON-carry the heads).

## Bank, arms, execution, caps (frozen)

- Same 8 R1 reused histories (dev-only, never qual); NEW execution
  rows under `evidence/odor-routed-development-r10/`.
- Arms: 1 live (`split`, splitTaste true) + spent-R1 comparator
  (read-only, same r1plain method).
- 8 mains, full probe set (R8 standard), single authorized attempt,
  `redone: []` expected, no second attempt, R7 extinction precedent.
- Caps: KEEP 40e9 ops / 3600s wall (split taste share ~2× legacy ≈
  +1e6/history — negligible).

## Scorer (frozen)

- Primary: transfer-split vs R1-plain per history (paired, 8).
- Mechanism: D-anchor Go-positivity — pooled mean of goW weights
  (all flies) > 0 per history (the positives actually learned).
- Tertiary (difference-based — R8 lesson, R9 precedent):
  acquisition = (split A-current) − (R1 A-current) per history.

## Verdict (fail-closed)

- **GO** iff transfer-split > R1 on ≥5/8 AND Go-mean > 0 on ≥6/8
  AND acquisition diff ≥ −0.5 on ≥6/8.
- **PARTIAL** iff transfer lifts on ≥5/8 but acquisition fails
  (mechanism works, price too high — still promotes shelf return,
  as no (d) exists).
- **NO-GO** otherwise (H10 falsified → close R10; fix (c) was the
  last specified fix — NO (d) pre-licensed; the program returns to
  the shelf and the diagnostic under the C17-bar: genuinely new
  rationale only).

## Fixtures (all GREEN before triage; frozen set = 3)

- F1 routing math: preset heads + known target → one update step
  reproduces the routed head exactly AND leaves the unrouted head
  bitwise untouched (both directions: 1→Go, 0→No-Go).
- F2 null-default identity: splitTaste=false ≡ absent key ≡ legacy
  fixed-step replication (exact weights; no heads allocated).
- F3 billing: same-split determinism (identical streams bill
  identically) + split-vs-legacy formula: per-cycle delta(split) −
  delta(legacy) == **32** exactly (choose-pred 59−29=30 + 2×(82−81);
  verified at fixture time — any miscount amends HERE before code,
  R9-A1 precedent).
- Full `npm test` triage again: zero new failures vs baseline.

## What R10 does NOT do

- No qual bank, no fresh bank, no RSI citation. No stacking with
  centering/quantiles (disjoint by freeze). No rescoring of R1–R9.
  No second attempt. No (d).
