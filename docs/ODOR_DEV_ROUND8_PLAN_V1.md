# ODOR DEV ROUND 8 — PLAN V1 (FROZEN)

Date: 2026-11-02. Status: FROZEN — implement exactly as written; any
change needs an amendment, never a silent edit. Zero worlds spent by
this doc.

## Lineage

- Scoping: `docs/ODOR_DEV_ROUND8_SCOPING_V1.md` (H8: background-loss
  centering vs uniform-pessimism attractor, R11 mechanism).
- Comparator: spent R1 rows + anchors (read-only; never re-executed).
- Precedent: R2–R7 dev discipline (same 8 reused histories, single
  variable, caps KEEP 40e9 ops / 3600s wall from R1 actual 35.66e9).

## Instrument (frozen)

1. `learning/taste-experiment.mjs`: centering term `centerRate` in the
   live taste delta — delta uses (reward − c) with c the frozen
   background-loss constant. Null-default c=0 MUST be bit-identical
   to current behavior (fixture-proven before any centered run).
2. Billed through `m` (constant-time subtract; no new scaling; billing
   math in fixtures).
3. No other instrument change. Curriculum, phases, seeds, probes,
   steering, gating: R1-plain literal (single variable = c only).

## The constant c (triage-pinned, frozen before execution)

- c = mean per-tick energy change with zero intake, measured from
  spent R1 A-phase traces at TRIAGE (read-only; script prints value,
  banker records it in the bank protocol).
- c is a single scalar, same for all 8 histories, frozen once pinned.
  No per-history c, no online adaptation, no re-tuning after seeing
  results (seeing results with a different c = a new round, not R8).

## Bank (dev reuse, NOT qualification)

- Same 8 R1 histories (spent-bank MEASUREMENT precedent R2–R7).
- No fresh bank: R8 is dev, never cited for qual/RSI.
- New execution rows live under `evidence/odor-routed-r8/`.

## Arms (1 live + 1 spent comparator)

- `centered`: R1-plain curriculum + frozen c.
- `r1plain`: spent R1 rows, read-only comparator (no re-execution).

## Fixtures (all GREEN before triage; frozen set = 3)

1. Centering math: known-delta recovery — with c pinned to a test
   value, one update step reproduces hand-computed weights exactly.
2. Null-default identity: c=0 run over a fixed synthetic micro-world
   is digest-identical to unmodified code (bit-identity proof).
3. Billing: billed ops for the subtract path match the frozen formula
   (constant per decision; totals reconcile on a fixed trace).

## Triage (before execution)

- Bank check: 8 histories resolve, protocol hash recorded.
- c pinned from R1 A-phase traces, printed + recorded (two readings:
  script output AND bank protocol must agree).
- Fixture report: 3/3 GREEN digests listed.
- Cap check: projected ops ≤ 40e9, wall ≤ 3600s (from R1 actuals).

## Execution (single authorized attempt)

- 8 mains (one per history), full probes (A/B/C/D + transfer-current +
  Native + reset where R1 had them — same probe set, no additions).
- Caps: ≤40e9 ops, ≤3600s wall, ≤100MB, ≤1800s... (KEEP R2–R7
  envelope; exact numbers from R7 plan, unchanged).
- `redone: []` expected; any resume discloses `redone` with dual
  provenance per incident precedent. No second attempt.

## Scorer (frozen)

- Primary: transfer-current endpoint (budgetAdjustedEnergyPerFounder)
  centered vs R1-plain, per history (8 paired comparisons).
- Secondary (mechanism): D-anchor taste-sign audit — mean + posfrac
  per history (same method as R11 re-reading).
- Tertiary: A/B retention (centered must not destroy acquisition:
  A ≥ 80% of R1-plain A on ≥6/8, else PARTIAL at best even if
  transfer lifts — no robbing acquisition to pay transfer).

## Verdict (fail-closed)

- **GO** iff transfer-centered > transfer-R1 on ≥5/8 AND posfrac
  recovers toward ~0.5 (≥0.4) on ≥6/8 AND acquisition gate holds.
- **PARTIAL** iff transfer lifts on ≥5/8 but acquisition gate fails
  (mechanism works, price too high — promote distributional).
- **NO-GO** otherwise (H8 falsified → close R8, promote fix (b)
  distributional; c is never re-tuned inside R8).
- Verdict published in `docs/ODOR_DEV_ROUND8_RESULTS_V1.md` with the
  frozen c, all 8 paired deltas, sign audits, and spend.

## What R8 does NOT do

- No qual bank, no fresh bank, no RSI citation.
- No fix (b)/(c) (stay queued; licensed only on NO-GO/PARTIAL).
- No rescoring of R1–R7 (their verdicts stand untouched).
- No second attempt (one authorized execution; extinction or crash
  handling per R7 precedent: INCOMPLETE + specified repair, no re-run).
