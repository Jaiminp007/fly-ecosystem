# Margin-readback study — status (persistence file)

Objective: establish the next intervention line after M-ACTOR exhaustion
(taste-anchor null, motor-anchor harmful, H1m overwrite story mechanistically
falsified despite shared-block premise). Long-term objective:
`docs/VISION.md` (milestone 2). Basis:
`docs/RETENTION_MECHANISM_RESULTS_V1.md` (R1 SUPPORT-H1-motor, saturation
mechanism, ELSEWHERE/H2 branches) +
`docs/MOTOR_ANCHOR_RESULTS_V1_DEV.md` (DEV-NOGO, D1 gap preserved) — neither
re-litigated here.

## D1-FIX V4 (2026-10-28)

Recomputation attempt-04 executed (ZERO worlds/seeds) → **GO: D1 REPAIR
ACCEPTED**. All V3 formulas pass on the frozen attempt-03 ledger
(caps/G1/G2pos/G3/G4 true; G2neg+G5 carried with stated trust chains).
Attempts 01–03 stand as computed negatives. Margin-gated follow-ups may now
be PROPOSED under their own frozen plans. Full record:
`docs/MARGIN_READBACK_RESULTS_V4.md`.

## D1-FIX V3 (2026-10-28)

Attempt-03 executed (18 exec, within caps) → computed NO-GO
(G1 ✓, G2neg ✓, G2pos ✗, G3 ✓, G4 ✓, G5 ✓). Read-only correction: G2pos's
single failing clause references a nonexistent live field (`re.meanMargin`
→ NaN); ledgered evidence satisfies EVERY bar (reset n=1024 bad=0
min===max TRUE |mean−.25|=2.8e-17). Execution incident disclosed: first
invocation crashed on fixed+emit (fixedBody has no config); 1-line
behavior-identical guard applied, triage re-run clean, single WRITTEN
attempt on plan seeds; 4 crashed executions ledgered, zero output observed.
Acceptance decided by frozen V4 RECOMPUTATION (zero worlds/seeds), not by
re-run. Full record: `docs/MARGIN_READBACK_RESULTS_V3.md`.

## D1-FIX V2 (2026-10-28)

Attempt-02 executed (17 exec, within caps) → verdict NO-GO per frozen bars
(G1 ✓ 1024/1024 bad=0 phi96, G2 ✗ premise-false, G3 ✓ |Δv+billed|=1.04e-13,
G4 ✓ 5 keys bad=0 digest unchanged, G5 ✓). Read-only correction: version
`'reset'` is taste-program (zeroed weights), NOT fixed — its stream is a
perfect zero-weight positive control (constant 0.75 → margin exactly 0.25,
both synthetic and spent rows; sham==A:A sanity holds). Genuine
fixed-program negative never tested → V3 authorized (G2neg acceptStationary
+ G2pos reset-constant, fresh seeds 380021+, third spent row 604620731).
V2 CLOSED as a negative. Full record: `docs/MARGIN_READBACK_RESULTS_V2.md`.

## D1-FIX V1 (2026-10-28)

Attempt-01 executed (17 exec, within caps) → verdict NO-GO per frozen bars
(G1 ✗ key bug, G2 ✓, G3 ✗ value-clause vs billing spec, G4 ✗ phi-16
collector assumption). Read-only correction from ledgered artifacts: the
instrument met spec exactly — 1024 emissions = 4×256 decisions, billing
100352 = 1024×(2+96) EXACT, value delta = billed-energy cost to ~5e-9,
spent anchor digest unchanged. Bar/script defects, not a repair failure.
V1 CLOSED as a negative; corrected V2 authorized (fresh synth seeds +
different spent row, never duplicate the 2789221780 battery).
Full record: `docs/MARGIN_READBACK_RESULTS_V1.md`.

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
