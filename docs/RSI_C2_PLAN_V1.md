# RSI C2 PLAN V1 (internal-loop execution) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code (freeze-before-code rule).
License: completion-plan Track C + `docs/RSI_C2_SKETCH_V1.md` (all 5
questions resolved below) + C1 module (frozen, implemented, 10/10 +
triage green) + V1d copy-control form + V1l seg-chain machinery + V1m
flip-split scorer (imported frozen). This plan covers implementation
(live-adopt + wire + instrument + fixtures + triage) AND the single
execution (bank + attempt-01 + verdict), like T1/V1n/threat-sim.

## Design (seg-chain successive, sketch option (a))

Per chain (3 histories H0/H1/H2), runs are FRESH learners (zero weights;
only the OPERATOR config carries over — no weight transplant, no
transplant integrity needed):
- `looper-train` (H0, BT options, loop attached): propose op1 at tick
  1024 from retained experience (temporal fit/test split: fit = older-half
  experience ids, test = newer-half), sandbox-evaluate, live-adopt iff
  pass → continue with op1.
- `looper-T1` (H1, fresh, op1 config iff adopted else baseline): propose
  op2 at tick 1024, sandbox-evaluate, live-adopt iff pass.
- `looper-T2` (H2, fresh, op2 config iff adopted else baseline/fallback).
- `static-train/T1/T2` (H0/H1/H2, BT options, no loop, no fees).
- `copied-train/T1/T2` (H0/H1/H2, blind adoption of looper's adopted ops
  with one-seg lag: copied-T1 runs op1 full-run (looper ran it partial:
  post-1024), copied-T2 runs op2 full-run; no sandbox of its own).
- `unlearned` (H2 reference, flat check).
Per chain: 10 runs. 2 chains (histories 0–2, 3–5) = 6 histories,
**20 mains**, 0 probes. Proposal ticks {1024} fixed; lifetime cap 2
(C2-specific, tighter than C1's 4; exactly 2 scheduled, no spares —
if op1 sandbox-rejects, T1 runs baseline and G2a fails closed).

## Live adoption (C1-excluded, defined here)

`adoptOperatorLive(state, operator)`: replayGain/replaySkip → set
`state.config` (read dynamically per replay call); shrinkOnce → scale
all weight arrays × α one-shot and continue. Billed: sandbox fee
(C1 form) at evaluate-time + normal live ops thereafter (no double
count). Experiment wire: `looper` arm (TASTE_ARMS += 'looper';
tasteKernel-style dispatch: attach loop at creation, fire at tick 1024,
live-adopt iff sandbox passes). All other arms byte-identical
(null-default, triage-verified).

## Gates (RSI gate restated; bars unmoved)

- G1 join ≥0.99 + integrity (all 20). G0 looper-train ≥0.5.
- **G2a-PRIMARY (successive)**: looper-T1 HB − static-T1 HB ≥ +0.1
  (op1 helps) AND looper-T2 HB − static-T2 HB ≥ +0.1 AND
  looper-T2 HB ≥ looper-T1 HB (second adoption at least as good;
  fresh histories each — improvement chain, not re-test).
- **G2b (productivity vs copied-improvement)**: pooled looper HB −
  pooled copied HB > 0 (strict; filter+timing must add value over
  blind lagged adoption; magnitude descriptive).
- G2c unlearned flat. G2d same-val ≥0.5 both looper transfers.
- GO-C2 ⟺ G1 ∧ G0 ∧ G2a ∧ G2b ∧ G2c ∧ G2d. Else NOGO (with
  op1/op2 split reported). INVALID/INCOMPLETE per G1/G0.
- **RSI claim iff GO-C2** (≥2 successive live accepts + productivity
  vs copied-improvement + matched/total budgets — the separately-
  satisfying evidence; no other claim licensed).

## Fixtures (14, gate before bank)

Module (6): live-adopt gain/skip/shrink (config set + weight scale +
billing); wire (arm registered, loop fires at 1024 only, non-looper
identical behavior); sandbox-live consistency (adopted config equals
sandboxed config); lifetime cap 2 (3rd proposal refused). Instrument
(8): collector valence; scorer GO/NOGO-split/INVALID/INCOMPLETE
branches (successive logic); bank-build tmpdir (9-schema +
union-exclusion); mains-caps (2 chains × 10 = 20); structural guard
(loop blocks + range); tick guard (proposal at 1024).

## Bank, caps, attempt discipline

- Fresh-18 bank `evidence/rsi-c2-dev/fresh-18/`, V1k-family 9-schema
  (probeSeeds present-but-unused; no weight transplant in this line),
  6 histories × 9, range **456001–456054**. VERIFIED clean 2026-11-02
  (zero hits docs/scripts/tests/learning/engine pre-freeze; sketch
  mention removed pre-freeze). attempt-01 + fresh-18 verified free
  pre-freeze. Builder re-verifies (evidence exact-int scan, fail-closed);
  fixture-seeds after build; post-bank refusal; union-excluded
  (spent through 455xxx + own 456001–456054 appended).
- Caps: 20 mains / 0 probes / 35840 worldTicks / 860160 founderSlots /
  4.0e9 scalar ops (1.2× linear est 3.2e9) / 10800s wall. Fail-closed.
- ONE authorized attempt (attempt-01). `redone: []` expected; repair only
  result-independent one-line cap form with dual provenance.

## What GO/NOGO mean

- GO: the internal loop found, adopted, and validated ≥2 successive
  operator improvements, beating doing-nothing AND blind adoption
  (RSI CLAIM licensed — first in program history if met).
- NOGO (flat): loop finds nothing the hands didn't (substrate has no
  operator headroom the loop can reach; capability stands, product absent).
- NOGO (proxy failure): sandbox adopts, transfer rejects (sandbox→transfer
  gap quantified — mechanism, not loop-breakage).
