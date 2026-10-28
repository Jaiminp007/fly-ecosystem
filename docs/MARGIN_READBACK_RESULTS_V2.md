# Margin-readback repair V2 — results (attempt-02)

Frozen 2026-10-28. Plan: `docs/MARGIN_READBACK_PLAN_V2.md`.
Verdict: **NO-GO per frozen bars** (G1 ✓, G2 ✗, G3 ✓, G4 ✓, go:false).
Correction (read-only, from ledgered artifacts): G2's premise is factually
false — version `'reset'` is NOT a fixed program. The reset data is instead
a perfect zero-weight positive control that strengthens the repair case.
V2 CLOSED as a negative; corrected V3 authorized. V1/V2 preserved, neither
rescored.

## What ran (single authorized attempt, within all caps)

- `evidence/margin-readback/attempt-02/`: `synthetic.json`, `spent-bank.json`,
  `ledger.json`, `attempt.json` (+ sources). 17 executions
  (1 synth main 512t×4 + 3 synth probes + 13 battery probes),
  4608 world-ticks, 84992 founder-slots, 132814583 scalar ops — all ≤ caps.
- Seeds: 9 fresh synthetic (380011–380019, ledgered in
  `evidence/margin-readback/fixture-seeds-02.json` BEFORE use — now spent,
  never reusable) + ONE spent-bank row (V2 bank-order-second history
  3101318742, MEASUREMENT label; the 2789221780 battery was NOT duplicated).
  No bank drawn, no qual touched.

## Bar results

| Bar | Result | Artifact |
|---|---|---|
| G1 synthEmit | ✓ | `A:current`: n=1024/1024 decisions, bad=0, seen=4096, phiLength=96, meanMargin=0.0943, nearFrac=0.70, blocks {0:717,1:172,2:105,3:30} |
| G2 synthNegative | ✗ (premise false) | `A:reset` emitted 1024/1024 records, bad=0 — see correction |
| G3 synthBilling | ✓ | dOps=100352=1024×(2+96) EXACT; \|Δvalue+billedCost\|=1.04e-13 ≤ 1e-6; survivors 4=4 |
| G4 spentEmit | ✓ | 5 keys n>0 bad=0 (A:A 2890, A:B 2966, A:current 2941, A:reset 2420, sham 2890); anchor digest unchanged |
| G5 no-new-failures | ✓ | 514 tests, 6 fails = the 6 stashed-pristine-baseline failures (shifted +5 by the new fixture file); 5/5 margin-readback fixtures green |

## Correction proof (read-only)

`fixed()` (`learning/taste-experiment.mjs:14`) covers ONLY
acceptCruise/acceptStationary/nativeFullCruise. Version `'reset'` takes the
else-branch (:137: zeroed weights + compact) with `program='taste'` (:139) —
`choose` IS called, the flag IS set (:140), margins MUST emit. G2's "fixed
program, choose never called" premise was wrong in V1 (passed vacuously via
the key bug) and correctly exposed in V2. The reset stream is therefore a
zero-weight positive control, and it is perfect:

- Synthetic reset: constant baseProbability 0.75 → margin EXACTLY 0.25,
  nearFrac 0 (vs trained current: mean 0.094 spread, nearFrac 0.70).
- Spent reset: mean 0.250000 (vs A:A 0.171, A:B 0.151, A:current 0.198) —
  margins separate zero-weight from trained policies on spent data.
- Sanity: sham mirrors A:A exactly (2890/2890, same blocks) by construction.
- A genuine fixed-program negative (acceptStationary: program='fixed', choose
  never called) was never tested — that is V3's G2neg, made non-vacuous by
  V2's `seen` stream-observation mechanism.

## Expenditure ledger (this study, cumulative)

- Attempt-02: 17 executions / 4608 ticks / 84992 founder-slots / 132814583 ops.
  Program total 6846 (6829 + 17). 0 bank worlds, 0 qual, 0 dev-bank.
- Spent: synthetic 380011–380019 (9, union-excluded); spent-row MEASUREMENT
  3101318742 (never re-runnable as a battery).

## What V3 must do (not in this document)

- G2neg: transfer/acceptStationary probe (program='fixed') wrapped with a key;
  require seen>0 AND zero motor-margin events.
- G2pos: reset probe promoted to positive control — require full emission
  (n == founders×ticks) AND constant baseProbability (minMargin==maxMargin).
- Fresh synthetic range 380021–380029 (`fixture-seeds-03.json`) + bank-order-
  third spent row 604620731 (24 learners, 17 alive, 96-dim — verified read-only).
- G1/G3/G4/G5 unchanged in content. Output `attempt-03`. Single attempt.
