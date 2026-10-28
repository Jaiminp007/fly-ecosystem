# Margin-readback study — status (persistence file)

Objective: establish the next intervention line after M-ACTOR exhaustion
(taste-anchor null, motor-anchor harmful, H1m overwrite story mechanistically
falsified despite shared-block premise). Long-term objective:
`docs/VISION.md` (milestone 2). Basis:
`docs/RETENTION_MECHANISM_RESULTS_V1.md` (R1 SUPPORT-H1-motor, saturation
mechanism, ELSEWHERE/H2 branches) +
`docs/MOTOR_ANCHOR_RESULTS_V1_DEV.md` (DEV-NOGO, D1 gap preserved) — neither
re-litigated here.

## Adjudication (read-only, zero new worlds, 2026-10-28)

Three candidates per the goal:

- **(a) ELSEWHERE sensing — DEFERRED, content-free.** The only concrete "new
  sense" in the record is V2's Option B, which was never predeclared beyond a
  name (V2 FAILED, so the unlock never fired). C2 stands: `localResourceSense`
  already failed its offline screen (sensed-policy gain CI crosses zero,
  paired-vs-unsensed ≈ −0.003..−0.001, forecast MSE not better), and any
  candidate must beat that screen first AND state what differs (live embodied
  integration + retention readouts, not offline forecast gain). No candidate
  sense exists in code or docs. Inventing one is legitimate exploratory work
  but has no grounding yet — it cannot be the next frozen line.
- **(b) H2 constant-shift vs reordering — DEFERRED, no consumer.** E3 already
  observed the pattern descriptively on spent banks (Q uniform tax cor +0.24,
  P reordering cor −0.73). Confirming it on a fresh bank pair costs fresh
  worlds but informs no live intervention: both actuator lines are CLOSED,
  both readout-protection lines failed. Revisit only when a new actuator or
  compensation hypothesis needs the distinction.
- **(c) D1 probe-margin gap — PURSUE FIRST, now DIAGNOSED.** Both V3 and
  M-ACTOR plans required actor/taste margin readback in their go/no-go bars;
  both failed closed on no-data (`margins:{}` all rows, sham key absent, zero
  events despite probes alive with survivors). Any future dev-gated line
  needs working margin readback — D1 is prerequisite instrumentation, not a
  side quest.

## D1 diagnosis (code-path + anchor evidence, zero executions)

**Cause: the collector listens for learning-update events that cannot exist
in frozen probes — by construction.**

1. `runTasteProbe` (`learning/taste-experiment.mjs`) compacts every
   non-fixed learner via `compactTasteEnergyBody` (`taste-energy.mjs:353`),
   which calls `freezeTasteEnergyBody` (`:338`):
   `state.acquisition=false; state.motorPending=null`.
2. `chooseTasteEnergyAction` (`:302`) sets
   `state.motorPending = state.acquisition ? {...} : null` → always null in
   probes (all versions: `current` runs arm `frozen`; fixed versions replace
   learners with `fixedBody`, no motor learning at all).
3. `progressUpdate` (`:268`) — the sole emitter of `motor-progress` records —
   is called only `if(state.motorPending)` (`:296`, `:330`). Never called in
   probes ⇒ zero `motor-progress` events ⇒ the collector
   (`scripts/motor-anchor-dev.mjs` `collectMarginEvents`, which accepts ONLY
   `type==='update'` + `event.type==='motor-progress'` + `record.cruise===true`)
   records nothing. QED.
4. Anchor check (read-only): V2 atC anchors show `acquisition:true` — that is
   the SAVED checkpoint state; the freeze happens in-memory after restore,
   so filed anchors are consistent with this mechanism, not evidence against.
5. The margin data itself (baseProbability, phi, cruise) IS computed on every
   probe decision inside `chooseTasteEnergyAction` but dropped: `decision`
   records carry `{own, action, outputs}` only — no baseProbability/phi.

**Repair direction (instrument change, to be frozen before implementation):**
opt-in decision-path margin emission from `chooseTasteEnergyAction`
(baseProbability, cruise, phi/block per decision), billed through `m`,
null-default behavior-identical (established emit pattern). Explicitly NOT:
setting motorPending in frozen probes (would fake learning/billing
semantics) or inferring margins from `outputs` (insufficient — outputs lack
the probability and feature vector).

**Validation envelope (predeclared):** synthetic-fixture verification first
(fresh synthetic seeds, zero bank contact, union-excluded like 379001–379009
precedent), then a minimal spent-bank measurement (one history × battery on
V2 N anchors, labeled MEASUREMENT non-qualifying per R1 precedent) to prove
the repair emits on real anchors. No dev bank, no qual bank, no mains until
the repair is proven.

## Expenditure ledger (this study)

- Worlds: 0 new. Seeds: 0 spent. One read-only anchor inspection (two V2
  atC JSONs, acquisition flags only — no rows touched, no rescoring).
- Cumulative program total unchanged: 6812.

## Next action

Freeze `docs/MARGIN_READBACK_PLAN_V1.md` (D1-FIX: decision-path emission +
collector update + fixture tests + synthetic validation + minimal spent-bank
measurement, conjunctive accept bar, single attempt) before touching code.
Only a proven repair unlocks margin-gated follow-up lines (actor-margin
decision-relevance on a fresh dev bank); no intervention claim attaches here.
