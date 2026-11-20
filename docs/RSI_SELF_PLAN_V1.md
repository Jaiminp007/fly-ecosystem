# RSI-SELF plan V1 — in-agent propose → evaluate → adopt loop (FROZEN, DESIGN ONLY)

Status: FROZEN 2026-10-30. Single authorized Phase-A attempt only. No code
written under this plan yet; no bank built; no worlds spent. Any change to
the mechanism, bars, or caps below requires a new frozen version (V1a+),
never an edit to this file's frozen content.

## Objective

Demonstrate the VISION mechanism — "an agent can propose and evaluate
changes to its own learning system" — executing INSIDE a run on the agent's
own state, with its own compute budget, under guardrails. Phase A is a
MECHANISM demonstration: success = the loop runs correctly end-to-end
(proposes, evaluates honestly, adopts-or-keeps per evidence, never harms).
Acceptance of any specific change is NOT required and NO improvement may be
claimed from Phase A under any outcome (pre-registered).

## Mechanism (contract)

- Scheduling (harness-provided interrupt, documented): the dev runner steps
  `TasteExperiment` directly (`step()` API) and, at ticks {448, 896, 1344}
  (BT phase boundaries), invokes `selfPropose(learnerState)` for every agent
  whose `config.selfMod===true`. Proposal, evaluation, and adoption compute
  SOLELY from that agent's own state (weights, buffers, surpriseEma,
  config). No external information enters. (Phase B may internalize
  scheduling; Phase A explicitly does not.)
- Proposal rule (scale-free, relative-to-self, pre-registered): at each
  checkpoint compute `testErr` = mean|target − prediction| on the agent's
  last 8 stored records with current weights. First checkpoint (no history):
  propose `rate × 0.5` (conservative default) and store testErr. Later:
  `testErr > prevTestErr` (strictly worse) → propose `current × 2`;
  otherwise propose `current × 0.5`. Clip proposal to [0.05, 2]. Base
  tasteRate 1.0. Store testErr for the next checkpoint either way.
- Evaluation protocol (sandboxed, held-out): fit-batch = stored records
  except last 8 (cap 32, oldest-first); test-batch = last 8. If total stored
  < 16 → SKIP (log skip, no change). Deep-clone taste weights twice; apply
  fit-batch updates with incumbent rate vs candidate rate (same update fn);
  measure mean|err| on test-batch for both. Adopt iff
  `candErr < incErr × 0.99` (strict 1% better); ties and noise → KEEP
  (conservative). All sandbox compute billed to the LIVE meter at a
  pre-registered flat fee per evaluation:
  `fee = 2 × (fitN + testN) × (tasteDimensions + 1)` ops
  (conservative: forward passes billed at update rate; formula logged).
- Records: every checkpoint appends
  `{tick, incRate, propRate, fitN, testN, errInc, errCand, decision}` to
  `state.selfMod.proposals` (checkpointed with state) and the runner ledger.
- Arms (loop isolated as the ONLY difference): fixed = BT base +
  `surpriseGain:0.5, surpriseWindow:16`, no loop. selfmod = identical config
  + `selfMod:true` loop. (surpriseGain>0 required: BT base has 0, leaving
  surpriseEma dead; both arms share the value so G3 isolates the loop.)

## Grid and bank

- 2 arms (selfmod/fixed) × 4 histories = 8 mains, 0 probes (M-RELEARN
  precedent: mechanism demo, in-loop eval IS the evaluation; endpoints from
  mains feed G3).
- Fresh dev bank `evidence/rsi-self-dev/fresh-01/`: 4 histories × 9 slots =
  36 seeds, range 396001–396036. VERIFIED clean 2026-10-30: zero hits in
  tests/scripts/docs/learning; the five evidence-JSON regex hits are digit
  substrings inside float weights (e.g. `-8.123960076346947`), not seeds —
  investigated and cleared. Spend: 8 mains (2 arms × 4 main-seeds). The
  remaining 28 slots are reserved-excluded in the bank record (M-POP
  precedent) and must never be spent elsewhere.
- Caps: ≤300 exec (8 used), ≤20e9 ops, ≤3600s wall. Single attempt; no
  resume except crash-resume with dual provenance (M-GATE precedent); no
  second attempt under this version.

## GO bars (conjunctive, fail-closed)

- G1 integrity: 8/8 mains complete; ledger exact (mains/probes/ticks/slots/
  ops); `redone` empty; all 12 expected proposal records present with all
  fields. Else INVALID.
- G2 auditability: 12/12 logged decisions == mechanical rule recomputation
  (`adopt ⟺ candErr < incErr×0.99`; skips ⟺ stored<16) from logged numbers,
  zero new worlds. Else INVALID (dishonest loop).
- G3 safety: mean(selfmod budgetAdjustedEnergyPerFounder) −
  mean(fixed …) ≥ −0.15. The loop must not harm. Else NO-GO.
- G4 liveness (non-vacuity): across the 12 checkpoints, ≥2 ADOPT and ≥2
  KEEP decisions live, and ≤2 skips. A loop that always-keeps, always-adopts,
  or never-fires is untested → INCOMPLETE (not GO). Qualitative mandate.
- G5 fixtures (gate before bank): 6 green tests — proposal rule (rise→×2,
  fall→×0.5, bounds clip, first-checkpoint default); sandbox
  (win→adopt, loss→keep, tie→keep, thin→skip); billing exactness
  (meter delta == fee formula); bank build + union-exclusion;
  hook bit-identity (stepped-with-null-hook == stepped-without-hook on
  fixed arm, fixture world); full `npm test` triage clean (6 known
  shifted-pristine failures only).
- Verdict GO ⟺ G1∧G2∧G3∧G4 (G5 gates execution). GO licenses PROPOSING a V1b
  (fresh plan + fresh bank + fresh goal), never executing one here.

## What this does not do

No learning-rate tuning on eval (rule is fixed, scale-free, relative).
No cross-line comparison claims. No RSI claim: one mechanism demo with no
required improvement is a substrate result, not self-improvement. The
bounded-RSI requirements (successive accepts, copied-improvement control,
total budget) are untouched and remain open.
