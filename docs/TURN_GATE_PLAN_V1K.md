# TURN-GATE PLAN V1k — direction-gated lossy confirmation (FROZEN, DESIGN ONLY)

Date: 2026-11-02. Status: FROZEN before code (freeze-before-code rule).
CORRECTION 2026-11-02 (bookkeeping only, no design change): attempt-11 →
attempt-12 and fresh-11 → fresh-12 — both names are taken by the DAMAGE line
(turn-gate-damage-dev attempt-11 + its fresh-11 bank). Gates, bank range,
caps, fixtures unchanged.
License: `docs/LOSSY_DIRECTION_MEASUREMENT_V1.md` (post-hoc HB +0.2342
vs BH +0.0099 on frozen V1j rows → pre-registered direction-gated test).
Line V1b–V1j closed (GO + annex); V1j explicitly demands new rationale —
this plan IS the new rationale (direction-specificity, untested in V1j).

## Question

Does lossy transplant (×0.5) specifically unlock the HB (harm→ben,
must-extinguish) direction while leaving BH (ben→harm, must-acquire)
intact? V1j's aggregate lift (+0.1324) came entirely from HB cues
(post-hoc); V1k pre-registers the split as the PRIMARY gate.

## Design (V1j mirror, direction-gated verdict)

Per pair (3 pairs, sequential [(H0,H1),(H2,H3),(H4,H5)] as V1b–V1j —
same pair family, fresh bank; each test codebook contains BOTH BH
and HB flipped cues, so no new pair construction needed):
1. **train** (1792, on H_tr) — snapshot end weights, V1j-identical.
2. **transferred-exact** (1792, H_te + exact transplant) — V1j-seg1
   replication arm; carries the HB baseline.
3. **transferred-lossy** (1792, H_te + transplant ×0.5, once at
   transplant, per element, +n muls billed; symmetric billing both
   arms except the scale) — the treatment arm.
4. **unlearned** (1792, H_te) — flat control.
4 runs × 3 pairs = 12 mains, 0 probes, BT_TICKS=1792, N=24.
Learner options, pricing, codebook family, body N, cruise 0 —
V1j frozen-identical (comparability; the NOVELTY is the
pre-registered direction gate, not new arms).

## Direction-split scorer (pre-registered, not post-hoc)

`scoreFlipSplit` extended (V1j function, additive BH/HB subsets —
no V1j code touched; new export in the V1k instrument):
- HB = train-harmful → test-beneficial cues (must extinguish).
- BH = train-beneficial → test-harmful cues (must acquire).
Contact-weighted correctness, V1j `wcorr` logic verbatim.

## Gates (conjunctive, fail-closed)

- G1 transplant-integrity on ALL rows incl. lossy tag (join ≥0.99;
  V1j-A1 machinery: provenance + α-application proof). Fail → INVALID.
- G0 train ≥0.5 all 3 pairs else INCOMPLETE-UNTRAINED (V1d precedent).
- **G2a-HB (PRIMARY)**: mean lossy-HB − exact-HB ≥ +0.1 (program
  yardstick; measurement predicts +0.23). Fail (G0 intact) → NOGO.
- G2b unlearned flat: |gap| ≤ 0.1 all 3 (V1d bars, yardstick not tuning).
- G2c-BH no-harm floor: mean lossy BH ≥ 0.7 (exact was 0.81; protects
  against collapse of the already-working direction). Fail → NOGO.
- G2d same-val retention floor ≥ 0.5 both arms (V1j yardstick).
- GO-V1k ⟺ G1 ∧ G0 ∧ G2a-HB ∧ G2b ∧ G2c-BH ∧ G2d.
- INCOMPLETE-UNTRAINED on G0 fail; INVALID on integrity/config/geography fail.
- DESCRIPTIVE: per-pair HB/BH deltas, contact counts, op counts.
- No RSI claim. GO licenses: (a) lossy as the unlearning-direction
  transfer standard (extends V1j's retention-claim rule); (b) M2-across
  wound-has-treatment (NOT wound-closed: HB 0.51 ≠ converged — honesty:
  treatment, not cure). GO does NOT fire M4 trigger 2 (overall tax gates it).

## Fixtures (10, gate before bank)

9 V1j-mirror (transplant unit exact; scaled-integrity ×0.5 unit;
pairing-rule; scorer binding; HELD bars; null-default engine;
refusal-guard form; schema-conformance; billing-symmetry) +
1 direction-split scorer unit (synthetic cues with known BH/HB
labels: asserts BH/HB subsets partition flipped cues, weights
match hand computation, empty-direction → null fail-closed).

## Bank, caps, attempt discipline

- Fresh-12 bank `evidence/turn-gated-dev/fresh-12/`: 6 histories × 9 =
  54 seeds, range **448001–448054**. VERIFIED clean 2026-11-02 (zero
  exact-seed/registry/test hits across docs/scripts/tests/learning/
  engine pre-freeze). Builder re-verifies at build; fixture-seeds file
  after build; post-bank refusal; union-excluded (spent through 447xxx
  + own 448001–448054 appended). Spent = V1j's list + own range.
- Caps: 12 mains / 0 probes / 21504 worldTicks / 516096 founderSlots /
  3.0e9 scalar ops (1.6× V1j actual 1.90e9) / 7200s wall. Fail-closed.
- ONE authorized attempt (attempt-12). `redone: []` expected; repair
  only result-independent one-line cap form with dual provenance
  (V1-cap precedent); any other deviation → INVALID, line closes.
- Triage: zero NEW failures vs pre-freeze baseline (record both;
  12a641d repair is in).
