# ODOR DEV ROUND 8 — AMENDMENT A2 (SCOPING, not frozen; blocks runner)

Date: 2026-11-02. Zero worlds. Runner survey for the R8 execution hit a
substrate mismatch: frozen A1 instruments the WRONG FILE for H8's
mechanism. No code changed by this doc; A1 + chunk-1 + fixtures stand
untouched (preserved, re-designated — never deleted). This doc scopes
the redirect; nothing here is frozen.

## The mismatch (found read-only, pre-execution)

- H8's mechanism evidence (R9–R11: growing norms, convergent
  misdirection, uniform-pessimism means −0.40 to −1.29) was measured on
  spent R1 anchors whose learners are ODOR-line bodies:
  `state.taste = {weights(11), memory, seen, rngState}` — the shape of
  `learning/odor-routed-taste.mjs::createOdorRoutedTasteBody`, whose
  `update()` is supervised 0/1 with fixed step `.5*error/tasteScale`
  and a one-memory-sample replay, billed plain.
- A1 (scoping G1 + frozen checklist + chunk-1 + fixtures) instrumented
  `learning/taste-energy.mjs::tasteUpdate` — the main-line body used by
  the V-series/turn-gate family. Verified: `odor-routed-experiment.mjs`
  and all `scripts/odor-routed-r*.mjs` import odor-routed-taste only;
  zero taste-energy references. The A1 instrument is real, tested, and
  deployed nowhere H8 can see.
- Cause: R8-V1 named `learning/taste-experiment.mjs` (the harness, not
  a taste implementation); A1 scoping resolved the ambiguity toward the
  file it analyzed instead of the file the wound lives in. Lesson
  recorded: ambiguity in a frozen parent must be resolved toward the
  MEASURED substrate (anchors), not the ANALYZED one.

## Disposition (no deletion, no rewrite of history)

- `learning/taste-energy.mjs` baseline (config + state + update +
  reset + restore + validation) + `tests/odor-baseline.test.mjs`
  (3/3 green): re-designated SPARE — a built, fixture-proven adaptive-
  baseline instrument on the main line, available to future
  taste-energy-line work, NOT part of R8. It stays green (standing
  triage covers it); it is never cited for R8's verdict.
- R8-V1 + A1 frozen texts stand as the hypothesis/verdict record
  (H8, falsifier, gates, caps unchanged); only the instrument target
  is wrong, which is what A2 (frozen, next) redirects.

## Redirect spec (for freezing, not frozen)

Target: `learning/odor-routed-taste.mjs::update()` — the supervised
0/1 fixed-step update that produced the diagnosed attractor.

1. State: `state.taste.baselineC` (init 0 at body creation; cleared by
   `resetOdorRoutedTaste`; rides anchors automatically as JSON;
   restore-compat: undefined → 0 wherever old states rehydrate).
2. Plumbing: `createOdorRoutedTasteBody(agentId,seed,{baselineRate=0}
   ={})` + `OdorRoutedExperiment` constructor option `baselineRate`
   (default 0, validated 0≤α≤1), threaded to body creation. R1-plain
   default 0 = current behavior bit-identical (no options key today;
   absent key ≡ 0 path).
3. Update: `update(state,record,mode)` — EMA `c ← c+α(t−c)` computed
   always, applied on live only (memory-sample replay centers with
   current c, never moves it); centered error `(t−c)−pred`; frozen
   α=0.05, init c=0 (values carried from A1 unchanged).
4. Billing: that file bills plain (`scalarOperations+=` constants) —
   uniform +N plain ops inside `update()` in both modes (N counted at
   freeze; null path bills the equivalent, behavior changes only when
   α>0). No `m` wrapper exists here; none introduced (minimal diff).
5. Fixtures (3, restated for the new substrate): centering math exact;
   null-default identity exact (α=0 ≡ absent key ≡ legacy fixed-step);
   billing uniform + reconciled. Full-suite triage again (this file is
   touched by every ODOR runner — zero new failures allowed).
6. Runner + scorer + verdict + caps per R8-V1/A1 unchanged (transfer-
   primary 5/8 + posfrac 6/8 + acquisition gate; 8 reused histories;
   single attempt; no second run).

## What A2 scoping does NOT do

- Not frozen (freeze needs: N counted, mode-flag signature, plumbing
  diff, reset/restore coverage list, 3 fixtures restated — next doc).
- No code, no fixtures, no triage change, no worlds.
- Does not touch A1/chunk-1/fixtures (spare, green, preserved).
- Does not rescore or reopen R1–R7, V-series, or C-series.
