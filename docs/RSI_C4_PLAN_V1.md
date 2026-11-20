# RSI C4 PLAN V1 (transplant + operator, jointly) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code (freeze-before-code rule).
License: C3's C4 requirement ("transplant + operator carryover jointly")
+ V1m exact-transplant machinery (frozen, imported) + C2/C3 loop machinery
(frozen, implemented, triaged) + V1h/V1i gain-on-transfer precedent
(+0.13–0.16). Fixes C2/C3's disclosed flaw (fresh runs ceiling G2a):
T1/T2 carry transplanted EXACT weights AND voted operators, so flip-split
HB is real transfer-extinction with headroom (exact wound ~0.3).

## Design (C2/C3 seg-chain + V1m exact transplant)

Per chain (H0/H1/H2), fresh learners EXCEPT transplanted weights:
- `looper-train` (H0, BT options, loop proposes op1=menu 0/gain 0.5@1024,
  sandbox-evaluates, live-adopts iff pass; weights snapshot at end).
- `looper-T1` (H1: EXACT transplant (α=1.0, copyWeights + integrity +
  digest, V1m-verbatim, unbilled memcpy) of looper-train weights +
  voted op1 config; loop proposes op2=menu 1/gain 1.0@1024, adopts iff
  pass; weights snapshot at end).
- `looper-T2` (H2: exact transplant of looper-T1 weights + voted op2
  config; no fire — validation only).
- `static-*` (same chain, exact transplants, BT options throughout).
- `copied-*` (same chain, exact transplants + voted ops blind, no sandbox).
- `unlearned` (H2 reference).
2 chains × 10 runs = 20 mains, 0 probes. Proposal tick {1024}; lifetime
structural (1 per run); temporal sandbox split; majority-vote carryover
(same as C2/C3). Menu 0/1 (gains) for direct C2 comparability:
C2-fresh vs C4-transplant isolates the transfer component (descriptive
cross-bank; the GATED test is within-C4 looper-vs-static).
Shrink/skip/gain-2.0 untried here (documented; C2/C3 covered skips).

## Gates (RSI gate restated; bars unmoved)

- G1 join+integrity (all 20, incl. transplant digests). G0 looper-train
  pooled gap ≥0.5.
- **G2a-PRIMARY (successive)**: looper-T1 HB − static-T1 HB ≥ +0.1 AND
  looper-T2 HB − static-T2 HB ≥ +0.1 AND looper-T2 ≥ looper-T1
  (fresh histories each; real transfer-extinction this time).
- **G2b (productivity)**: pooled looper HB − pooled copied HB > 0.
- G2c unlearned flat. G2d same-val ≥0.5 both looper transfers.
- GO-C4 ⟺ all (≥2 successive live accepts + productivity vs
  copied-improvement + matched/total budgets → RSI CLAIM licensed).
  Else NOGO (with op1/op2 split reported). INVALID/INCOMPLETE per G1/G0.

## Fixtures (14, gate before bank)

Module (6): live-adopt (unchanged from C2, re-verified); wire (unchanged);
exact-transplant copy (imported, integrity + digest); loop-log fresh per
run (no cross-run learner state — carryover is weights + voted config
only, asserted); lifetime structural; sandbox-live consistency. Instrument
(8): collector valence; scorer GO/NOGO-split/INVALID/INCOMPLETE;
bank-build tmpdir (9-schema + union-exclusion); mains-caps (2×10=20);
structural guard (transplant + vote blocks); tick guard.

## Bank, caps, attempt discipline

- Fresh-20 bank `evidence/rsi-c4-dev/fresh-20/`, V1k-family 9-schema,
  6 histories × 9, range **458001–458054**. VERIFIED clean 2026-11-02
  (zero hits docs/scripts/tests/learning/engine pre-freeze). attempt-01
  + fresh-20 verified free pre-freeze. Builder re-verifies (evidence
  exact-int scan, fail-closed); fixture-seeds after build; post-bank
  refusal; union-excluded (spent through 457xxx + own 458001–458054).
- Caps: 20 mains / 0 probes / 35840 worldTicks / 860160 founderSlots /
  4.0e9 scalar ops / 10800s wall. Fail-closed.
- ONE authorized attempt (attempt-01). `redone: []` expected; repair only
  result-independent one-line cap form with dual provenance.

## What GO/NOGO mean

- GO: internally-proposed gains lift REAL transfer (≥2 successive +
  productivity) → RSI CLAIM (first ever if met).
- NOGO (flat vs static): gains don't help transfer even with weights
  carried (operator null for transfer-extinction; loop exonerated 3×).
- NOGO (static high): exact-transfer already high (no wound on this
  bank; ceiling informative — compare V1m 0.29 descriptively).
