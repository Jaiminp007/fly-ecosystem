# ODOR DEV ROUND 9 — PLAN V1 (FROZEN)

Date: 2026-11-02. Status: FROZEN — implement exactly as written; any
change needs an amendment, never a silent edit. Zero worlds spent by
this doc. Parent scoping: `docs/ODOR_DEV_ROUND9_SCOPING_V1.md` (H9,
falsifier shape carried). Licensed by R8-NO-GO.

## Hypothesis H9 (carried)

Distributional taste preserves usable optimism through the negative
flood: K quantile heads learn the supervised 0/1 target by quantile
regression; behavior reads the mean (decision rule unchanged,
representation enriched).

## Instrument (frozen)

Target: `learning/odor-routed-taste.mjs` (same substrate as R8 —
the measured wound). R9's instrument is DISJOINT from R8's baseline
(representation, not background): the R9 runner does not pass
baselineRate (defaults 0; A2 uniform billing retained, behavior off).

1. State: `state.taste.qweights` = K×11 array (K frozen §2), init
   zeros; `state.taste.quantileK` = K. Null path K=1: LEGACY CODE PATH
   VERBATIM (`taste.weights`, same calls, same bills — bit-identical
   including billing, stronger than A1/A2 nulls).
2. Frozen values: **K=8** (design choice, not tuned, never re-tuned);
   levels τ_j=(j+0.5)/8; init zeros (every head predicts
   sigmoid(priorLogit)=0.75 initially; behavior mean 0.75 = legacy
   initial — single-variable clean: same start, same rule, different
   learning dynamics only).
3. K-head update (`update(state,record,mode)`, mode kept from A2;
   baseline off in R9): per head j: pred_j = sigmoid(priorLogit +
   w_j·phi/tasteScale) computed INLINE (not via prediction() calls);
   I_j = target < pred_j ? 1 : 0; err_j = τ_j − I_j (the quantile
   asymmetry — optimism survives where τ_j exceeds the miss rate);
   step_j = .5*err_j/tasteScale; w_j += step_j*phi, clip ±8 (same
   clip as legacy). Both modes update all heads (no mode distinction
   for quantiles; mode gates only the off baseline).
4. Behavior: `prediction(state,phi)` with K>1 returns mean(pred_j);
   `predictTargetTaste` (.05+.9 wrap) unchanged. All choose/observe/
   probe paths unchanged.
5. Billing (lumped, frozen): K>1 path — `update()` per call **K*82**
   (composition per head: 29 pred + 48 update + 4 baseline-off + 1
   τ-indicator = 82); `prediction()` per call **K*30** (K×29 + K
   mean). K=1 bills legacy (29/52) via the verbatim path. Fixtures
   reconcile the composition (F3).
6. Lifecycle: creation option `quantileHeads=1` (0<integer; validated;
   absent ≡ 1); experiment plumbing mirrors baselineRate (constructor
   option default 1, threaded to body creation); reset zeroes qweights
   (keeps K); restore `??=` (missing → K=1 legacy shape, no qweights
   — spent anchors rehydrate to the legacy path automatically); fork
   via restore; transplant digests unchanged (weights-snapshot family
   extended to qweights where present — frozen in implementation
   checklist spirit: digests must cover what learning changes).

## Bank, arms, execution, caps (frozen)

- Same 8 R1 reused histories (dev-only, never qual); NEW execution
  rows under `evidence/odor-routed-development-r9/`.
- Arms: 1 live (`distributional`, quantileHeads 8) + spent-R1
  comparator (read-only, same r1plain method as R8 triage).
- 8 mains, full probe set (R8 standard), single authorized attempt,
  `redone: []` expected, no second attempt, R7 extinction precedent.
- Caps: KEEP 40e9 ops / 3600s wall (taste share ~1e6/history at K=1;
  ×8 ≈ 7e6 — negligible; caps unthreatened).

## Scorer (frozen)

- Primary: transfer-current distributional vs R1-plain per history
  (paired, 8).
- Mechanism: D-anchor head audit — pooled qweights mean/posfrac (R11
  method at head resolution) AND upperMass = fraction of (fly,head)
  pairs with head-mean-weight > 0 (optimism must exist SOMEWHERE).
- Tertiary (difference-based — R8 lesson frozen): acquisition =
  (distributional A-current) − (R1 A-current) per history.

## Verdict (fail-closed)

- **GO** iff transfer-distributional > R1 on ≥5/8 AND upperMass ≥0.5
  on ≥6/8 AND acquisition diff ≥ −0.5 on ≥6/8.
- **PARTIAL** iff transfer lifts on ≥5/8 but acquisition fails
  (mechanism works, price too high — promote fix (c) anyway).
- **NO-GO** otherwise (H9 falsified → close R9, promote fix (c)
  separate Go/No-Go matrices; no K re-tune, no second attempt).

## Fixtures (all GREEN before triage; frozen set = 3)

- F1 quantile math: preset qweights + known target → one update step
  reproduces all 8 heads exactly, INCLUDING a τ−I divergence case
  (t<q vs t>q take different branches — verified distinct).
- F2 null-default identity: quantileHeads=1 ≡ absent key ≡ legacy
  fixed-step replication (exact weights; no qweights allocated).
- F3 billing: same-K cycle determinism (identical streams bill
  identically, heterogeneous records) AND K-scaling formula:
  per-cycle delta(K=8) − delta(K=1) == 7*(30 + 2*82) = 1358 exactly
  on identical record streams (one behavior prediction + two head
  updates per cycle; memory/motor K-independent by inspection).
- Full `npm test` triage again: zero new failures vs baseline.

## What R9 does NOT do

- No qual bank, no fresh bank, no RSI citation. No fix (c) (queued on
  NO-GO/PARTIAL). No baseline (disjoint instrument; A2 spare untouched).
  No rescoring of R1–R8. No second attempt.
