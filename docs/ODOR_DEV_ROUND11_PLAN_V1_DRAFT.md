# ODOR DEV ROUND 11 — PLAN V1 (DRAFT, explicitly UNFROZEN — no bank, no code, no worlds, no authorization)

Status: DRAFT (2026-11-04). This doc is a license application, not a
license. Freezing requires: (1) authorizer ruling accepting the (c)
reading below, + (2) user authorization for one bounded world run.
Until then: no fixtures, no triage, no bank, no code. Citing this
draft as a freeze is mis-citation. Design parent:
`docs/ODOR_CANDIDATE_B_DESIGN_V1.md`.

## License section (bar `docs/ODOR_NEXT_RATIONALE_BAR_V1.md`, quoted)

- (a) Probe-time: the round lives or dies on transfer + acquisition
  PROBE gates; weights are evidence only. HOLDS by construction.
- (b) History-adaptive: per-history head parameters (frozen count,
  fit per history). No phase-gating. HOLDS by construction.
- (c) New locus/channel: claimed as head-ARCHITECTURE (linearity
  itself — never moved by R8/R9/R10). CONTINGENT: needs the
  authorizer to accept architecture-vs-statistics (see design doc
  §Objections). WITHOUT a ruling this clause is UNCITED and the
  round cannot freeze. The drafter does not adjudicate his own bar.
- (d) Falsifier with teeth: below. HOLDS if frozen as written.
- (e) Single attempt, no rescoring. HOLDS by construction.

Ruled-out compliance: not background subtraction (R8), not
representational enrichment (R9), not consequence-split routing
(R10 — reused as comparator/base, not re-argued), not readout
normalization, not phase-gating, not weight-statistics.

## Instrument (single-variable vs R10-literal)

- Base: R10 split matrices verbatim (Go on target=1 only, No-Go on
  target=0 only; same curriculum, same histories-if-dev or fresh
  bank-if-qual; R10 rows read-only comparator).
- Delta (the ONLY change): replace the linear difference readout
  with a per-history nonlinear head — two nonlinear value surfaces
  (one per channel) combined by max-gating (frozen formula), with
  per-history surface parameters (frozen count per history, no
  cross-history sharing, no tuning post-freeze). Purpose per design
  doc: break the linear coupling R10 mechanized (No-Go RMS
  2–2.35×, drowns-Go-2:1), not added expressiveness for its own sake.
- Null-default: head-bypass ≡ R10 bit-identical (fixtures prove it
  before any bank; R10 rows stand regardless).

## Gates (frozen numbers for the future freeze; binding if frozen)

- Transfer-primary: nonlinear-split > R1-plain on ≥5/8 histories
  (same count-gate; shopping one history stays forbidden).
- Acquisition-tertiary (difference-based, R8 lesson): ≥6/8
  (the bar R10 missed by one).
- Mechanism-secondary (independent of transfer): No-Go/Go RMS
  ratio + Go-positive rate must move TOGETHER with acquisition.
- Kill-condition 1: Go-positive ≥7/8 but acquisition ≤5/8 →
  cost is carrier-side; candidate B FALSE, line closes.
- Kill-condition 2: ratio unmoved while transfer lifts → lift is
  not via decoupling; no mechanism credit, candidate B FALSE.
- All 8 D-anchors carry Go/No-Go surfaces (auditable separately).

## Budget and conduct

- Caps: 40e9 ops / 3600s wall (unchanged). Single attempt,
  `redone: []` expected, repair only result-independent.
- Dev only; no fresh bank (never cited for RSI). Bank spec (for
  the freeze, NOT minted): fresh 8-history, whole-token clean scan
  vs all prior banks/protocols/tests — standard discipline.
- Fixtures-first (routing math, null-default bit-identity, billing)
  AFTER freeze, BEFORE bank — none written by this draft.

## Authorization status (read before citing)

DRAFT-UNFROZEN. Missing: (c)-ruling + user world authorization.
The next touch is a ruling, then (if accepted) a freeze citing
this draft + the bar + the design doc — or a rejection closing
candidate B as designed-and-unlicensed. This draft authorizes
nothing by itself.
