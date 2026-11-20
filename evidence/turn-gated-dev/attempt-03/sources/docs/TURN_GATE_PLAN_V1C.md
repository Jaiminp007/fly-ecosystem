# TURN-GATE Plan V1c — transfer replication + pre-registered flip-split (DESIGN ONLY)

Status: FROZEN 2026-10-31. No code, no worlds, no bank build under this doc.
Next: implement under this plan, then single authorized attempt.

## Question

V1b (GO: transferred mean 0.578, unlearned flat) showed same-agent weights
carry cue-turning to a new codebook with a tax. Post-hoc analysis of the
frozen V1b rows (read-only, zero new worlds, spent-bank MEASUREMENT —
non-qualifying) finds the tax structure:

| pair | train-self | transferred, same-valence cues | transferred, flipped cues |
|---|---|---|---|
| 407001→407010 | 0.905 | 0.951 (3 cues) | 0.510 (6 cues) |
| 407019→407028 | 0.910 | 0.944 (3 cues) | 0.562 (6 cues) |
| 407037→407046 | 0.906 | 0.944 (6 cues) | 0.618 (4 cues) |

(Correctness = turn iff test-history-harmful, unweighted mean over
jointly-observed cues; G2a gaps are the contact-weighted equivalents:
0.518/0.547/0.669.)

Reading (hypothesis, NOT claim): carried weights retain still-valid
associations at-or-above train level (0.94–0.95) while flipped cues sit
near chance (0.51–0.62) — partial correction under continued learning
within 1792 ticks, not pure train-valence replay (which would score
≈0.10 on flipped cues) and not full relearning (≈0.90). The transfer tax
≈ uncorrected-flip residue. Same-valence slightly EXCEEDING train-self is
an unexplained observation (continued-learning benefit? selection on
jointly-observed cues?) — recorded, not interpreted.

V1c converts this post-hoc observation into a pre-registered confirmatory
test: replicate the V1b design on a fresh bank, with the flip-split
pre-registered as a DESCRIPTIVE (non-gating) analysis.

## Design (identical to V1b except bank + flip-split analysis)

- 3 pairs × (train + transferred + unlearned) = 9 mains, 0 probes,
  BT_TICKS=1792, N=24, same collector/scorer/checkpoint-carryover
  transplant (`snapshotWeights`/`copyWeights`/`assertFreshTarget`/
  `checkTransplantIntegrity` — transplant-integrity unit replaces any
  pairing-rule fixture per Amendment A1 precedent).
- Train/test pairing: sequential [(H0,H1),(H2,H3),(H4,H5)] on the fresh
  bank's 6 histories — arbitrary but pre-registered (frozen-row pairing
  rules do not transfer to unobserved banks).
- Gates (unchanged bars): G1 transplant-integrity 9/9 (join ≥0.99 all);
  G0 train gap ≥0.5 all 3 else INCOMPLETE-UNTRAINED; G2a transferred mean
  gap ≥0.3; G2b unlearned |gap| ≤0.1 all 3. Verdict GO/NOGO (+INCOMPLETE/
  INVALID fail-closed). No RSI claim.
- Pre-registered DESCRIPTIVE flip-split (no gate): per-subset
  contact-weighted gaps via the frozen scorer restricted to cue subsets
  (same-valence vs flipped, train-row labels vs test-row labels defining
  the split): report same-val correctness, flipped correctness, and
  train-valence-replayed-on-test. Success criterion for the MECHANISM
  hypothesis (recorded separately from the GO verdict): same-val ≥0.85
  AND flipped in [0.4,0.7] on the fresh bank — i.e., the V1b structure
  replicates. If instead flipped ≈ train-self (≈0.9: full relearning) or
  flipped ≈ 0.1 (pure replay), the V1b reading is falsified and the line
  re-opens (new plan required; no within-line reinterpretation).

## Bank (fresh, build AFTER fixtures pass)

`evidence/turn-gated-dev/fresh-03/`: 6 histories × 9 = 54 seeds
406001–406054 (verified clean 2026-10-26, held in reserve for V1c; re-verify
at build against the grown exclusion set incl. 407001–407054 + all fixture
seeds). Union-exclusion: every prior `evidence/**/protocol.json` + tests +
engineering lists + the entire V1/V1b lines. Caps: ≤300 exec (9 used),
≤20e9 ops, ≤3600s wall, ≤100MB. Single authorized attempt; crash-resume
with dual provenance only (MATE-ACT/V1b precedent).

## Why this advances the program

Transfer is the live explanatory thread (Vision milestone 4; BODY_TRANSFER
V2 FAIL-body contrast: taste-gains don't transfer across bodies, but
cue-turning transfers across codebooks with a structured tax). Confirming
the tax structure promotes it from observation to mechanism — the
prerequisite for any future intervention (extended-run plasticity probe,
canalizing-core/periphery architectures per Round 13). A failed
replication is equally informative (kills the rigidity story early).
