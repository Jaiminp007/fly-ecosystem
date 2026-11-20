# ODOR DEV ROUND 8 — AMENDMENT A1 (SCOPING, not frozen; blocks R8-V1 implementation)

Date: 2026-11-02. Zero worlds. Implementation survey of frozen
`docs/ODOR_DEV_ROUND8_PLAN_V1.md` hit a freeze-implementation gap:
R8-V1 is NOT implementable as written. No code written; no worlds
spent; the frozen plan stands untouched (amendment discipline, never
silent edit). This doc scopes the repair; nothing here is frozen.

## The gap (2 parts, both found read-only)

**G1 — no reward variable exists in the taste path.** R8-V1 says
"delta uses (reward − c)". The live taste update
(`learning/taste-energy.mjs::tasteUpdate`) is supervised, not TD:
`error = record.target − prediction` with `target ∈ {0,1}` from
`outcomeSign` (`observeTasteEnergyBody`; records form only on
contact+intake, positive or negative). There is no per-tick reward to
subtract c from. The only faithful mapping is reward := supervised
target (the sole reward signal in this path), i.e. centered error =
`(target − c) − prediction`. Stating this mapping IS an instrument
change (it fixes an ambiguity the frozen text left open) → needs a
frozen amendment before code.

**G2 — c is unmeasurable from spent artifacts, and the agnostic
constant is unsafe.** R8-V1 pins c = "mean per-tick energy change
with zero intake, measured from spent R1 A-phase traces". Two
failures: (a) units — trace energy deltas are in energy/tick (≈ −0.05
scale, polluted by work-billing: a read-only probe found ALL
contact-accept energy deltas negative, 0/11243 positive — billing
dominates, sign unrecoverable); targets are unitless {0,1}. No
conversion exists. (b) The quantity that matters is p = P(target=1
among taste records), and record signs were never logged — anchors
keep counts only (`acquiredTasteExamples`), traces keep decisions,
not records. p is unrecoverable read-only. The agnostic fallback
c=0.5 is UNSAFE: if p<0.5, centered targets have negative mean while
sigmoid predictions floor at 0 → all errors negative → weights slam
to clip (−8): uniform pessimism made WORSE and saturated. c=0.5
gambles the round on an unknown p.

**Confound logged (not resolved):** mean-negative weights may partly
be prior-correction, not pure pessimism — `priorLogit=log(3)≈1.1`
(optimistic 0.75) with a lower base rate forces negative weights to
calibrate even under healthy differentiation. R11's "everything is
bad" reading and the calibration reading predict the same sign of
the mean; they differ on structure (shared-undifferentiated vs
calibrated-but-ordered). The frozen verdict survives this confound:
GO requires transfer lift (5/8, primary) AND posfrac recovery AND
the acquisition gate conjunctively — cosmetic posfrac movement alone
cannot pass. Transfer-primary is immune; only the instrument is
blocked.

## Candidate resolution (for freezing, not frozen)

**Adaptive baseline (replaces fixed-c):** c becomes online state, not
a constant — EMA of observed targets per agent
(c ← c + α(target − c)), centered error = (target − c) − prediction.
No pre-measurement needed (chicken-and-egg dissolved); no gamble on
p (baseline tracks whatever p is, per agent, per phase —
non-stationarity-robust across A→B→C→D, which fixed-c could never
be); null-default (α=0, c=0) bit-identical; billed through `m`
(EMA: 2 ops/taste-record, constant). Prior art in-code: `surpriseEma`
(α=0.05 EMA, same pattern). H8 unchanged (centering breaks the
attractor — adaptive centering is still centering); falsifier
unchanged; verdict gates unchanged; caps unchanged. G1 mapping
(reward := target) stated explicitly in the frozen text.

## What A1 does NOT do

- Not frozen (scoping only — freeze needs: α value + init c value +
  billing formula + 3 fixtures restated + triage pinning replaced by
  init-value recording).
- No code, no fixtures, no triage, no execution, no worlds.
- R8-V1 frozen text untouched; R1–R7 verdicts untouched; fixes (b)/(c)
  stay queued (A1 repairs the instrument of fix (a), not its place
  in the queue).
