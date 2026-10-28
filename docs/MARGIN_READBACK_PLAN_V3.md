# Margin-readback repair plan V3 (D1-FIX correction of the correction)

Frozen 2026-10-28. Status: DESIGN ONLY until implementation + execution.
Single authorized attempt only. V1 (NO-GO per its bars) and V2 (NO-GO per its
bars) are preserved untouched — new attempt, not a rescore, no second run
under any plan.

## Why V3 (frozen basis)

V2 proved everything except its own G2: G1 ✓ (1024/1024 shaped phi-96),
G3 ✓ billed-cost to 1.04e-13, G4 ✓ (5 spent keys bad=0, digest unchanged).
G2 failed because its premise was factually false: version `'reset'` takes
the taste-program branch (`taste-experiment.mjs:137,139` — zeroed weights +
compact, `program='taste'`), so `choose` IS called and margins MUST emit.
Read-only trace of every weight-write path confirms the reset stream is a
zero-weight constant control:

- Taste learning gated on `acquisition` (:323) — off after compact.
- `renewalUpdate` needs `motorPending` (:332), which `choose` sets only when
  `acquisition` (:302) — null in probes. `consolidateMotor`/`anchorActorDirection`
  gated on rates that are 0 in BT options.
- Hence actor weights stay EXACTLY zero; `dot(0,phi)=+0` for finite phi, so
  baseProbability is bit-identical every tick (observed mean sits at the
  zero-weight value 0.25 to 2.8e-17 on both synthetic and spent rows).

A genuine fixed-program negative was never tested. V3 tests it, and promotes
reset to the positive control it actually is.

## Deltas from V2 (everything else inherited unchanged)

1. Seeds: fresh synthetic 380021–380029, ledgered in
   `evidence/margin-readback/fixture-seeds-03.json` BEFORE use. Spent-bank row: bank-order-third V2
   history **604620731** (atC anchor: 24 learners, 17 alive, ecology 96-dim —
   verified read-only). Rows 2789221780 and 3101318742 already ran batteries
   and are NEVER duplicated.
2. Collector: track `minMargin`/`maxMargin` over accepted records (summary
   includes both; null when n=0).
3. Script adds one synthetic probe — fixed-program negative:
   `runTasteProbe(anchor,{family:'transfer',version:'acceptStationary',
   seed:history.probeSeeds.transfer,founders:4,ticks:256,emit:wrapped})`
   with probe key `'fixedneg'`. `fixed('acceptStationary')` is true → fixedBody
   replacement + `program='fixed'` → `choose` never called → zero motor-margin
   records possible; decision records still flow, so `seen>0` keeps the check
   non-vacuous.
4. G2neg (new): `fixedneg` seen>0 AND events===0 AND n===0.
5. G2pos (new, replaces old G2): reset probe survivors===4 AND n===1024
   (4 founders × 256 ticks, full emission) AND bad===0 AND
   minMargin===maxMargin (bit-identical zero-weight baseProbability) AND
   |meanMargin−0.25|≤1e-9.
6. G1/G3/G4/G5 unchanged in content (G4 on row 604620731; G5 re-triage vs
   stashed-pristine baseline; fixture tests +96-dim/seen cases must pass
   before execution).
7. Output: `evidence/margin-readback/attempt-03/`. Same caps as V2.
8. Instrument files UNCHANGED (`learning/taste-energy.mjs`,
   `learning/taste-experiment.mjs`). Changed: `scripts/margin-readback-check.mjs`
   (collector min/max + fixedneg probe + G2neg/G2pos),
   `tests/margin-readback.test.mjs` (+min/max + constancy case — must pass
   before execution).

## Not included (unchanged)

No dev bank, no qual bank, no learner revision, no intervention effect, no H2,
no ELSEWHERE sensing, no RSI, no Option B, no rescoring of attempts 01/02, no
duplicate of run batteries, no second V3 run. On NO-GO: D1-FIX closes, D1
remains the documented blocker. On GO: the repair is ACCEPTED and a
margin-gated follow-up may be PROPOSED under its own frozen plan — no worlds
for it here.
