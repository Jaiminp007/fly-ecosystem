# TURN-GATE PLAN V1M — shrinkage dose ladder (FROZEN, DESIGN ONLY)

Date: 2026-11-02. Status: FROZEN before code (freeze-before-code rule).
License: V1k (α=0.5 → HB-seg1 0.59; single constant tested) + M2 addendum
MET bar (HB-seg1 within 0.1 of train flips M2 to MET). New rationale (V1l
demanded one): dose-response for shrinkage — which α minimizes the
seg1 tax, and does any α reach the MET bar? Untested (V1j/V1k/V1l all
ran α=0.5 exactly once).

## Design (dose panel, not data-dredging)

Per pair (3 pairs, sequential [(H0,H1),(H2,H3),(H4,H5)] — same family,
fresh bank; dose varies the TRANSPLANT, not the codebooks):
1. **train** (1792, H_tr) — snapshot end weights.
2. **transferred-exact** (1792, H_te + exact transplant) — HB baseline.
3. **lossy-0.25 / lossy-0.5 / lossy-0.75** (1792 each, H_te + transplant
   ×α once, +n muls billed per arm) — the dose arms (α fixed
   pre-registration; 3 values, no ladder adaptation).
4. **unlearned** (1792, H_te) — flat control.
6 runs × 3 pairs = 18 mains, 0 probes, BT_TICKS=1792, N=24.
All else V1k-identical (comparability; the NOVELTY is the α panel).

## Gates (existential over pre-fixed doses; conjunctive, fail-closed)

- G1 transplant-integrity on ALL rows incl. all α tags (join ≥0.99;
  provenance + α-application proof per arm). Fail → INVALID.
- G0 train ≥0.5 all 3 else INCOMPLETE-UNTRAINED.
- **G2a-MET (PRIMARY)**: max over α∈{0.25,0.5,0.75} of pooled HB-α
  ≥ pooled train-gap − 0.1 (M2 addendum MET bar, applied verbatim).
  Fail (G0 intact) → NOGO-V1m (dose curve still mapped — see below).
- G2b unlearned flat ≤0.1 all 3. G2c-BH floor: all lossy arms pooled
  BH ≥ 0.7. G2d same-val floor: all lossy arms pooled same ≥ 0.5.
- GO-V1m ⟺ G1 ∧ G0 ∧ G2a-MET ∧ G2b ∧ G2c ∧ G2d.
- INCOMPLETE-UNTRAINED on G0 fail; INVALID on integrity/config/geography fail.
- DESCRIPTIVE (either verdict): HB(α)/BH(α)/same(α) dose curves per pair
  + pooled; best-α identification; exact-arm replication check (HB-exact
  ≈ 0.37, 3rd replication expected).
- No RSI claim. GO flips M2 to MET (per addendum bar — the milestone shot).

## Fixtures (12, gate before bank)

11 V1l-mirror adapted (6-arm tags; transplant exact/scaled×3/fresh-target/
integrity/billing; direction-split; HB/BH/same branches; INVALID/
INCOMPLETE preserved; bank-build form) + 1 dose-selection unit (synthetic
3-α rows: best-α = argmax pooled HB; MET-bar math vs pooled train;
empty-α-direction → null fail-closed NOGO).

## Bank, caps, attempt discipline

- Fresh-14 bank `evidence/turn-gated-dev/fresh-14/`: 6 histories × 9 =
  54 seeds, range **450001–450054**. VERIFIED clean 2026-11-02 (zero
  exact-seed/registry/test hits across docs/scripts/tests/learning/engine
  pre-freeze). attempt-14 + fresh-14 verified free pre-freeze. Builder
  re-verifies at build; fixture-seeds file after build; post-bank refusal;
  union-excluded (spent through 449xxx + own 450001–450054 appended).
- Caps: 18 mains / 0 probes / 32256 worldTicks / 774144 founderSlots /
  5.0e9 scalar ops (1.7× linear from V1l actual) / 10800s wall. Fail-closed.
- ONE authorized attempt (attempt-14). `redone: []` expected; repair only
  result-independent one-line cap form with dual provenance; any other
  deviation → INVALID, line closes.
- Triage: zero NEW failures vs pre-freeze baseline (record both).
