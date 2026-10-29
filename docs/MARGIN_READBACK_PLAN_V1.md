# Margin-readback repair plan V1 (D1-FIX)

Frozen 2026-10-28. Status: DESIGN ONLY until implementation + execution.
Single authorized attempt only. No second attempt, no rescoring around gaps,
no moved bars.

## Objective

Repair probe-side margin readback so a future dev-gated line can use the
margin go/no-go bars that V3 and M-ACTOR both failed closed on. D1 mechanism
(frozen diagnosis in `docs/MARGIN_READBACK_STATUS.md`): `runTasteProbe`
compacts learners → `acquisition=false`, `motorPending=null` →
`progressUpdate` (sole `motor-progress` emitter) never fires in probes →
the update-only collector starves by construction, while the margin inputs
(baseProbability, phi, cruise) are computed on every probe decision and
dropped (`decision` records carry `{own, action, outputs}` only).

This plan authorizes INSTRUMENT REPAIR + validation only. No learner
revision, no intervention, no dev bank, no qual bank, no RSI claim, no
follow-up line (those need a proven repair first).

## Read first

`docs/MARGIN_READBACK_STATUS.md` (adjudication + D1 diagnosis),
`docs/RETENTION_MECHANISM_RESULTS_V1.md` (R1 + saturation mechanism),
`docs/MOTOR_ANCHOR_RESULTS_V1_DEV.md` (D1 gap as preserved).

## Instrument spec (exact changes; implement after freeze, fixture-test before worlds)

1. `learning/taste-energy.mjs`
   - `TASTE_ENERGY_DEFAULTS`: add `marginReadback:false`.
   - `restoreTasteEnergyBody`: compat
     `if(value.config.marginReadback===undefined)value.config.marginReadback=false;`
     + validation `assert.equal(typeof value.config.marginReadback,'boolean')`
     (old checkpoints restore with the flag off — default behavior unchanged).
   - `chooseTasteEnergyAction`: inside the `hold.remaining===0` block, after
     the `motorPending` assignment, add:
     `if(state.config.marginReadback)emit({type:'motor-margin',record:{tick:own.tick,cruise,baseProbability,probability,phi:[...motor]}});`
     plus billing `state.work.scalarOperations+=2+state.config.motorDimensions`
     inside the same `if` (Gen1 base: 18 ops/decision; honest cost of the
     feature copy). Rides the existing `emit` callback (record-wrapped as
     `type:'update'` like `motor-progress`); `canonical()` is a JSON round-trip
     and the record is JSON-safe. Default off = zero behavior change,
     zero billing change (fixture-pinned bit-identity).
   - No signature changes; no other call sites touched.
2. `learning/taste-experiment.mjs`
   - `runTasteProbe`: after the learner-prep loop, add
     `if(emit!=null)for(const id of run.founderIds)run.learners[id].config.marginReadback=true;`
     (probe-local; filed anchors untouched; mains never set the flag).
3. `scripts/margin-readback-check.mjs` (new; `isMain`-guarded, usage assert)
   - Minimal collector accepting wrapped `{probe,event}` AND raw events with
     inner `type==='motor-margin'`: per-key `{n, marginSum (|baseProbability-.5|),
     near (<0.1), blocks via blockOf(phi), finite/baseProbability-range checks}`.
     Does NOT modify `scripts/motor-anchor-dev.mjs` (closed-line instrument,
     preserved as-is).
   - `buildSyntheticAnchor()`: ONE synthetic history (fresh seeds 380001+,
     `{seed,cueSeed,resourceSeeds×4,probeSeeds{A,B,transfer}}`), ONE main
     (Gen1 R=4 base flags, N body, candidate arm, founders=4, 512 ticks),
     returns in-memory checkpoint + history. Seeds ledgered in
     `evidence/margin-readback/fixture-seeds-01.json`
     (`{spentFixtureSeeds:[...]}` — evidence-JSON seed-key scan) before use.
   - `runSyntheticChecks()`: on the synthetic anchor —
     A:current+emit (expect margins), A:reset+emit (fixed program, expect zero
     margin records — negative control), A:current emit vs emit=null
     (survivors+value identical, ops strictly greater).
   - `runSpentBankMeasurement()`: full 12+sham battery with emit on the V2 atC
     anchor of bank-order-first history 2789221780 (spent bank
     `47b44c62…`, labeled MEASUREMENT non-qualifying per R1 precedent);
     expect all 5 emit keys `{A:A,A:B,A:current,A:reset,sham}` with n>0.
     Battery-internal sham-equality + source-checkpoint-digest asserts must
     hold; anchor file digest on disk unchanged after.
   - Writes `evidence/margin-readback/attempt-01/` (`synthetic.json`,
     `spent-bank.json`, `ledger.json`, `attempt.json` with frozen source
     snapshot + bank/protocol SHAs); single sequential run.
4. `tests/margin-readback.test.mjs` (new; zero worlds, synthetic seeds only
   as `tests/*.mjs` literals): default-off bit-identity (flag off + emit set
   ≡ flag off + emit null: identical actions/weights/ops); flag-on billing
   floor (ops increase exactly 2+motorDimensions per decision, actions/weights
   still identical with noop emit); emission shape (finite baseProbability,
   phi length 16, cruise boolean); restore-compat (checkpoint without the key
   restores with `false`); collector accepts wrapped motor-margin, rejects
   non-cruise/absent records. Must pass 100% before any execution.

## Accept bar (conjunctive; else NO-GO, line closed, no follow-up)

- G1 synthEmit: synthetic A:current emits ≥1 motor-margin record, all with
  finite baseProbability∈[0,1] and phi length 16.
- G2 synthNegative: synthetic A:reset emits 0 motor-margin records.
- G3 synthBilling: emit vs emit=null reruns — survivors and value identical,
  scalarOperations strictly greater with emit.
- G4 spentEmit: spent-bank battery — all 5 emit keys present with n>0 and
  finite meanMargin; battery-internal asserts pass; anchor digest unchanged.
- G5 noBehaviorChange: `git diff` on behavior files limited to the spec above;
  full `npm test` shows no NEW failures vs the stashed-pristine baseline
  (triage protocol from M-ACTOR status).

## Budgets and caps (frozen ceiling)

- Executions ≤ 32 (1 synth main + ≤5 synth probes + 13 battery + slack).
- World-ticks ≤ 100k, founder-slots ≤ 1M, scalar ops ≤ 1e9, output ≤ 100MB,
  total wall ≤ 1800s. Per-row caps inherited (600s wall+CPU, 8GiB).
- Seeds: ≤12 fresh synthetic (380001+, ledgered + union-excluded BEFORE use)
  + 0 new bank seeds (V2 reuse is spent, labeled MEASUREMENT, never
  qualification). No `bank()` draw of any kind.
- Any cap breach or assert trip → INCOMPLETE, no retry, no second attempt.

## Stopping rules / not included

- NO-GO on any G-fail closes D1-FIX with zero further spend; D1 remains the
  documented blocker and no margin-gated follow-up may be frozen on
  unrepaired readback. No rescoring, no extra histories, no tuning.
- Not included: dev bank, qual bank, learner revision, intervention effect,
  H2, ELSEWHERE sensing, RSI, Option B. A proven repair unlocks PROPOSING a
  margin-gated follow-up under its own frozen plan — never in this goal.

## Provenance freeze

Files: `learning/taste-energy.mjs`, `learning/taste-experiment.mjs`,
`scripts/margin-readback-check.mjs`, `tests/margin-readback.test.mjs`.
SHA256 recorded in `attempt.json` at execution; any mismatch vs the
fixture-tested tree invalidates the run. Unit-test literals scanned via
`tests/*.mjs`; synthetic seeds via
`evidence/margin-readback/fixture-seeds-01.json`.
