# ODOR candidate-B design V1: history-adaptive nonlinear head decoupling the R10 price (design-only, zero worlds, NOT authorized for worlds)

Responds to: R4 ("needs its own design doc first — NOT authorized",
`docs/ODOR_DEV_ROUND4_RESULTS_V1.md`) + ledger ("Candidate B
(nonlinear head) promoted (needs design doc, not authorized)").
This IS the design doc. Worlds remain NOT authorized — execution
needs user authorization under a frozen plan citing the bar
(`docs/ODOR_NEXT_RATIONALE_BAR_V1.md`). No worlds spent here.

## Problem (what R4 + R10 jointly say)

- R4: a linear BC student trained on 267k guarded decisions loses
  to its teacher 0/8 by the R1 margin (−0.57 vs −0.55).
  Per the frozen falsifier: ARCHITECTURE, not signal. Head
  linearity was never the moved locus in R8–R10 (R8 moved
  background/centering, R9 representation/quantiles, R10
  routing/split — all kept linear heads).
- R10: split readout works-but-costs (transfer 5/8, Go-positive
  7/8, acquisition 5/8 misses by one). Mechanized price: No-Go
  RMS 2.0–2.35× Go RMS, directions differ (cos −0.43..−0.78),
  "difference drowns Go 2:1" — the LINEAR difference forces
  symmetric updates through a shared carrier, and No-Go's flood
  taxes Go's positives at acquisition time.

## Proposed instrument (not "more parameters")

A history-adaptive NONLINEAR readout head whose function is to
break the linear coupling R10 mechanized — e.g. separate
nonlinear value surfaces per channel with max-gating instead of
a forced linear difference, so Go's positives need not travel
the shared linear bottleneck No-Go's flood dominates. Per-history
head parameters (R10's price is history-idiosyncratic, so the
decoupling is fit per history, stated in the freeze).
Supervised initialization allowed (R4 curriculum), but the
license lives or dies on PROBE-TIME gates (transfer dynamics +
acquisition), never on weight-matrix state.

## Bar adjudication (clause by clause, `ODOR_NEXT_RATIONALE_BAR_V1`)

- (a) Probe-time: PASS by construction — transfer-primary +
  acquisition-tertiary (difference-based) gates on probes;
  weights are evidence only.
- (b) History-adaptive: PASS — per-history head parameters
  (price is history-idiosyncratic per R10); no phase-gating.
- (c) New locus/channel: PASS, tightly — head ARCHITECTURE
  (linearity itself) was never moved by R8–R10 (background,
  representation, routing, readout-statistics only). Disclosed
  tightness: same readout locus as R10; the novelty is the
  architectural coupling R10's price analysis identified, not
  another statistic. If the adjudicator reads (c) as
  locus-exclusive, this FAILS — recorded here so the freeze
  cannot mis-cite.
- (d) Falsifier with teeth: transfer ≥5/8 AND acquisition
  ≥6/8 (difference gate, R8 lesson) AND mechanism readout
  (No-Go/Go RMS ratio + Go-positive rate) must move TOGETHER
  with acquisition. Kill-condition (pre-registered): head keeps
  Go-positive ≥7/8 but acquisition still ≤5/8 → cost is
  carrier-side (palate), candidate B dies by its own falsifier.
  Second kill-condition: ratio unmoved while transfer lifts →
  lift is not via decoupling (no mechanism credit).
- (e) Single attempt, no rescoring: freeze states it.

## Objections preserved (not rebutted)

- Diagnostic steering-head vestigiality (re-readings: +0.42 on
  ~zero steering weights; motor readout-blind): different head,
  but cautionary — if readout heads are equally vestigial,
  kill-condition 1 will fire. That is the design working.
- "More expressiveness" alone is scaling, not rationale: the
  rationale is the DECOUPLING of the mechanized R10 price, not
  parameter count. A head that adds parameters without moving
  the RMS ratio is a failed instance, scored as such.
- R4's promotion predates the bar; the bar's "readout-tweak
  family exhausted" may be read to include this. The (c)
  tightness disclosure above exists for exactly this reading —
  execution needs the authorizer to accept the
  architecture-vs-statistics distinction.

## Status

CANDIDATE-B-DESIGNED, UNLICENSED (needs authorizer ruling on
(c) + user-authorized single world under frozen plan). No
candidate-B worlds exist. R8/R9 NO-GOs + R10 PARTIAL stand.
Line closed as design; the next touch is a freeze citing this
doc and the bar, or nothing.
