# TURN-GATE PLAN V1O — multi-codebook training (FROZEN, DESIGN ONLY)

Date: 2026-11-02. Status: FROZEN before code (freeze-before-code rule).
License: R367 (Enomoto/PMDG pseudo-multi-from-single; Gan valence-as-
attribute; Lee canonical-projection; Wang domain-vs-content) + transfer-
map family #2. New rationale (FIRST training-protocol intervention on
transfer: every prior transfer line varied TRANSPLANT/gain/threat/lossy
or the loop — none varied the TRAINING. Training on A + pseudo-codebooks
synthesized from A, transferring to B, tests whether multi-context
exposure teaches cause-inference per Song/R366. Untested anywhere).

## Design (train-protocol panel, not data-dredging)

Per pair (3 pairs, sequential [(H0,H1),(H2,H3),(H4,H5)] — same family,
fresh bank; dose varies the TRAINING, transplant fixed lossy α=0.25
(the deployed transfer — lift measured OVER the working baseline)):
1. **train-single** (1792, H_tr codebook A) — snapshot end weights.
2. **train-multi** (1792 TOTAL, H_trm: thirds from A + pseudo-A2 +
   pseudo-A3) — snapshot end weights. TRUE dose-match by construction
   (equal total train ticks; thirds split pre-registered).
   Pseudo-codebooks (pre-registered, deterministic, no tuning):
   A2 = A with cue-label order REVERSED; A3 = A with cue labels
   ROTATED by one position. Both preserve harmful/beneficial counts
   and the valence rule; both differ from A and from each other; the
   transfer codebook B is flipped vs A (unchanged convention).
3. **transferred-single** (1792, H_te codebook B + lossy transplant
   of single-train weights, α=0.25) — single-training baseline.
4. **transferred-multi** (1792, H_te codebook B + lossy transplant
   of multi-train weights, α=0.25) — the multi-training test.
5. **unlearned** (1792, H_te) — flat control.
5 runs × 3 pairs = 15 mains, 0 probes, BT_TICKS=1792, N=24.
All else V1m-identical (comparability; the NOVELTY is the train panel).

## Gates (conjunctive, fail-closed)

- G1 transplant-integrity on ALL rows incl. both train sources
  (join ≥0.99; provenance + α-application + pseudo-scheme proof
  per arm — A2/A3 ≠ A ≠ B verified in-row). Fail → INVALID.
- G0 train-single ≥0.5 AND train-multi ≥0.5 all 3 pairs else
  INCOMPLETE-UNTRAINED.
- **G2a-MULTI (PRIMARY)**: pooled transferred-multi HB −
  pooled transferred-single HB ≥ +0.1 (V1-series yardstick) AND
  ≥2/3 pairs transferred-multi HB ≥ transferred-single HB − 0.05
  (non-degradation guard).
- G2b unlearned flat ≤0.1 all 3. G2c-BH floor: all transferred
  arms pooled BH ≥ 0.7. G2d same-val floor: pooled same ≥ 0.5.
- GO-V1o ⟺ G1 ∧ G0 ∧ G2a-MULTI ∧ G2b ∧ G2c ∧ G2d.
- INCOMPLETE-UNTRAINED on G0 fail; INVALID on integrity/config/
  geography/pseudo-scheme fail.
- DESCRIPTIVE (either verdict): per-pair multi−single HB deltas;
  train-single vs train-multi (does multi-training cost train
  performance?); exact-arm replication check (lossy HB ≈ 0.9,
  V1j/V1m replication expected on transferred-single).
- No RSI claim. GO licenses a harder-gap multi-codebook line
  (V1p), NOT a claim — single line, needs replication.

## Fixtures (12, gate before bank)

11 V1m-mirror adapted (5-arm tags train-single/train-multi/
transferred-single/transferred-multi/unlearned; pseudo-scheme unit
(A2 = reverse, A3 = rotate, counts preserved, A2/A3/A/B all
distinct); dose-match unit (total train ticks equal across
single/multi); transplant integrity incl. multi-source weights;
direction-split; HB/BH/same branches; INVALID/INCOMPLETE preserved;
bank-build form) + 1 pseudo-validation unit (synthetic rows:
permutation determinism; pseudo-label counts = A counts; B flipped
vs A preserved; empty-pseudo-direction → null fail-closed NOGO).

## Bank, caps, attempt discipline

- Fresh-15 bank `evidence/turn-gated-dev/fresh-15/`: 6 histories × 9 =
  54 seeds, range **470001–470054**. Pre-freeze check 2026-11-02:
  zero hits docs/scripts/tests/learning (evidence/ full-scan timed
  out — BUILDER RE-VERIFIES at build per discipline; post-bank
  refusal; union-excluded spent through 469xxx + own).
  attempt-15 + fresh-15 verified free pre-freeze (no c16/turn V1o
  artifacts on disk).
- Caps: 15 mains / 0 probes / 26880 worldTicks / 645120 founderSlots /
  4.2e9 scalar ops (linear from V1m actual) / 10800s wall. Fail-closed.
- ONE authorized attempt (attempt-15). `redone: []` expected; repair only
  result-independent one-line cap form with dual provenance; any other
  deviation → INVALID, line closes.
- Triage: zero NEW failures vs pre-freeze baseline (record both).

## Verdict readings (anti-hype pre-registered)

- GO: multi-context training lifts transfer over matched single →
  licenses harder-gap multi line (V1p). NOT an RSI claim (single
  line; needs replication + productivity evidence).
- NOGO: pseudo-by-permutation adds nothing → closes family #2's
  simplest form (strong negative); inference-gating (family #1)
  and input-side locus unaffected.
- All negatives preserved; no rescoring; bars unmoved.
