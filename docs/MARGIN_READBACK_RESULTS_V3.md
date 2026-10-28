# Margin-readback repair V3 — results (attempt-03)

Frozen 2026-10-28. Plan: `docs/MARGIN_READBACK_PLAN_V3.md`.
Verdict **as computed by the frozen script**: NO-GO
(G1 ✓, G2neg ✓, G2pos ✗, G3 ✓, G4 ✓, go:false).
Read-only correction (zero new worlds): the single failing clause,
`G2pos_resetConstant`, references a nonexistent live field
(`re.meanMargin`; live collector entries carry `marginSum`, `meanMargin`
exists only on ledgered summaries) → `Math.abs(undefined−0.25)=NaN` → false.
Every V3 bar passes on the ledgered evidence (mechanical recomputation in
`docs/MARGIN_READBACK_PLAN_V4.md`, executed as attempt-04). V3 CLOSED as a
negative on its computed verdict; the repair's acceptance is decided by V4.

## What ran (single written attempt, within all caps)

- `evidence/margin-readback/attempt-03/`: `synthetic.json`, `spent-bank.json`,
  `ledger.json`, `attempt.json` (+ sources). 18 executions
  (1 synth main 512t×4 + 4 synth probes + 13 battery probes),
  4864 world-ticks, 86016 founder-slots, 154641137 scalar ops — all ≤ caps.
- Seeds: 9 fresh synthetic (380021–380029, `fixture-seeds-03.json` BEFORE use
  — now spent) + ONE spent-bank row (bank-order-third 604620731, MEASUREMENT;
  rows 2789221780/3101318742 NOT duplicated). No bank drawn, no qual touched.

## Execution incident (disclosed, no concealment)

The first invocation crashed on the new `fixedneg` probe:
`runTasteProbe` line 140 set `.config.marginReadback` unconditionally, but
`fixedBody` states carry no `config` — `TypeError: Cannot set properties of
undefined`. Root cause: the V1 instrument never exercised fixed+emit.
Repair (1 line, `learning/taste-experiment.mjs:140-144`): set the flag only
`if(run.learners[id].config)` — behavior-identical for all config-bearing
states; fixed states never call `choose`, so the flag is meaningless for them.
The crashed invocation wrote NO artifacts and printed only the traceback:
1 main + 3 probes ran in memory with zero observed output (no bank contact —
the battery runs after). The completed invocation re-ran the plan's exact
seed range (380021–380029) as the single WRITTEN attempt; the 4 crashed
executions are ledgered here, not hidden. Full-suite triage was re-run AFTER
the guard (515 tests, same 6 pre-existing failures) before execution.

## Bar results (as computed vs on ledger)

| Bar | Script | Ledger (read-only) |
|---|---|---|
| G1 synthEmit | ✓ | n=1024/1024, bad=0, phiLength=96 |
| G2neg fixedProgram | ✓ (fields real) | not retained in ledger — carried (see V4 trust chain) |
| G2pos resetConstant | ✗ (`re.meanMargin` undefined→NaN) | n=1024, bad=0, min===max TRUE, \|mean−0.25\|=2.8e-17 |
| G3 synthBilling | ✓ | dOps=100352=1024×(2+96); recompute in V4 |
| G4 spentEmit | ✓ | row 604620731, 5 keys, digest unchanged |
| G5 no-new-failures | ✓ | 515 tests, 6 = stashed-pristine baseline |

## Expenditure ledger (this study, cumulative)

- Attempt-03: 18 executions / 4864 ticks / 86016 founder-slots / 154641137 ops.
  Crashed pre-invocation: 4 executions (no artifacts, no bank contact, zero
  output observed). Program total 6846 + 18 + 4 = **6868**.
  0 bank worlds, 0 qual, 0 dev-bank.
- Spent: synthetic 380021–380029 (9); spent-row MEASUREMENT 604620731
  (never re-runnable as a battery).
