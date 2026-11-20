# ODOR DEV ROUND 8 — AMENDMENT A2 (FROZEN)

Date: 2026-11-02. Status: FROZEN — implement exactly as written; any
further change needs A3, never a silent edit. Zero worlds spent by
this doc. Parent: R8-V1 (`docs/ODOR_DEV_ROUND8_PLAN_V1.md`) + A1
(`docs/ODOR_DEV_ROUND8_AMENDMENT_A1.md`, values carried) + A2 scoping
(`docs/ODOR_DEV_ROUND8_AMENDMENT_A2_SCOPING.md`, substrate finding).
Only the instrument target changes; hypothesis, falsifier, gates,
caps, bank, arms, scorer, verdict all carried unchanged.

## What A2 changes (and nothing else)

The A1 instrument (adaptive EMA baseline, α=0.05, init c=0,
EMA-apply-live, uniform billing, null-default bit-identical) is
re-targeted from `learning/taste-energy.mjs::tasteUpdate` to
`learning/odor-routed-taste.mjs::update()` — the supervised 0/1
fixed-step update that produced the R9–R11 evidence. The taste-energy
work is SPARE (preserved, green, never cited for R8).

## Frozen diff (exact)

1. `update(state,record)` → `update(state,record,mode)` in
   `learning/odor-routed-taste.mjs`:
   - `mode` ∈ {'live','replay'} (asserted). The two call sites in
     `observeOdorRoutedTaste` pass 'live' (acquired record) and
     'replay' (memory sample) respectively.
   - Body: `alpha = state.taste.baselineRate ?? 0`; if `alpha>0`:
     compute `nextC = c + alpha*(target−c)`, commit to
     `state.taste.baselineC` on live only (replay computes and
     discards — S-GATE compute-always/apply-live precedent);
     centered target `t' = target − state.taste.baselineC` in BOTH
     modes. Else (`alpha==0`): `t' = record.target`, behavior
     identical to legacy (plain-JS gate, no RNG draws).
   - Error uses `t'`: `error = t' − prediction(...)`; step and clip
     unchanged (`.5*error/tasteScale`, ±8).
   - Billing: lumped constant `4+11*4` becomes `4+11*4+4` (=52)
     UNCONDITIONALLY — on and off, live and replay. The +4 is the
     frozen uniform price (EMA-sub/mul/add + center-sub, real when on
     via plain flops, equivalent when off). Off-path weights/decisions
     identical to legacy; billing differs by exactly +4 (disclosed,
     formula-verifiable in F3 — same standing as the BRAKE precedent).
2. Body creation: `createOdorRoutedTasteBody(agentId,seed,
   {baselineRate=0}={})`; assert `0≤baselineRate≤1`;
   `state.taste={weights,memory,seen,rngState,baselineC:0,
   baselineRate}`. Absent key ≡ 0 path (current callers unchanged).
3. Experiment plumbing: `OdorRoutedExperiment` constructor gains
   `baselineRate=0` (validated 0..1, stored `this.baselineRate`,
   default keeps every existing construction bit-identical); body
   creation passes `{baselineRate:this.baselineRate??0}`. Decoupled
   (`cueTaste`) / cue-shared / bandit paths untouched.
4. Reset: `resetOdorRoutedTaste` clears `state.taste.baselineC=0`
   (billing constant 12 unchanged). Anchors carry the field as JSON
   automatically; transplant/fork move whole learner objects.
5. Restore-compat: `OdorRoutedExperiment.restore` normalizes every
   learner after clone: `state.taste.baselineC ??= 0`,
   `state.taste.baselineRate ??= 0` (covers spent R1 anchors, old
   checkpoints, fork sources — fork calls restore, one place).
6. Values (carried from A1, restated frozen): α=0.05 design choice
   (not tuned, never re-tuned), init c=0, live-only commit,
   center-both-modes, uniform billing, null-default weights-identical.

## Fixtures (all GREEN before triage; frozen set = 3, restated)

- F1 centering math: preset c + known target → one `update()` step
  reproduces hand-computed weights AND c exactly (live case;
  replay case: c unmoved, centering applied).
- F2 null-default identity: α=0 ≡ absent key ≡ legacy fixed-step
  replication over K mixed records (exact weights, baselineC stays 0).
- F3 billing: uniform 52/call live==replay==off-path on the fixed
  trace (48 legacy + 4 disclosed); totals reconcile.
- Full `npm test` triage again (this file serves every ODOR runner):
  zero new failures vs the 13-pre-existing-env baseline.

## Triage (before execution; replaces A1 triage init-recording)

- Bank check: 8 histories resolve, protocol hash recorded (unchanged).
- Init recording: baselineRate=0.05 printed by the runner AND recorded
  in the bank protocol (two readings agree).
- Fixture report: 3/3 GREEN digests listed. Cap check: ≤40e9/≤3600s.

## Unchanged (carried verbatim by reference)

H8, falsifier, arms (centered + spent-R1 comparator), execution (8
mains, full probe set, single attempt, `redone: []`, no second run,
R7 extinction precedent), scorer (transfer-primary + taste-sign +
acquisition gate), verdict (GO/PARTIAL/NO-GO, NO-GO or PARTIAL
promotes fix (b), no α re-tune), caps, non-goals, prior verdicts.
The taste-energy SPARE is explicitly NOT part of R8's verdict.
