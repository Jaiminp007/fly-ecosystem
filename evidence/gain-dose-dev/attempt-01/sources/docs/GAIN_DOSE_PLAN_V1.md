# GAIN-DOSE Plan V1 — optimal surprise-gain dose + overdose law (FROZEN, design only)

Date frozen: 2026-10-26. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Objective

Find the optimal surprise-gain dose (quadratic peak over d) and test
the Yerkes-Dodson inverted-U (does high gain hurt?). Pre-specified in
LOSS_AVERSION_LAMBDA.md (YD untestable frozen → this clean sweep).
Secondary (non-gating, piggybacked): first-contact-tick logging in all
arms to enable the bank-ease timing test post-hoc (VALUE_PROBE
bank-dependence finding) at near-zero cost.

## Dose knob (single degree of freedom)

Coupled pair scaled by d ∈ {0, 0.5, 1.0, 2.0, 4.0}:
{surpriseGain: d, replaySurpriseGain: 3d}. d=1 is V1g/V1h-identical
(deployed instrument — built-in replication anchor); d=0 is uniform
(base options — built-in reference). One parameter, V1g continuity,
no re-tuning (the VALUES at d=1 are held, only d varies).

## Arms, bank, caps

- Arms (7): train + gain-0/0.5/1/2/4 (transferred + dose d) +
  unlearned. 7 × 3 pairs = 21 mains, BT_TICKS=1792, base options
  otherwise (BT_LEARNER_OPTIONS), transplant from train-end weights
  (V1i-identical machinery), per-cue per-third behavior + first-contact
  tick logging (passive, all arms).
- Bank `evidence/gain-dose-dev/fresh-01/`: 6 histories 422001–422054
  (turn-gate 9-seed structure; drawn .seed {001,010,019,028,037,046}).
  422xxx verified pristine 2026-10-26 (zero exact-seed/registry/test/
  script hits). Builder re-verifies drawn-seed zero-collision at build;
  post-build refusal guard.
- Caps (V1i-scaled + probe/headroom): 21 mains / 37632 worldTicks /
  903168 founderSlots / 5e9 scalarOps. d=4 instability risk noted:
  fixture must assert finite weights/energies at d=4 on synthetic
  histories before bank build (fail-closed at implement time).

## Metrics, gates, verdicts (conjunctive, fail-closed)

- G1 integrity: 21/21 complete, join ≥ 0.99, ledger exact, `redone: []`.
- G0 train-learned: train behavior gap ≥ 0.5 all 3 pairs, else
  INCOMPLETE-UNTRAINED. G2b unlearned flat (|gap| ≤ 0.1), else INVALID.
- G-replication (fail → INVALID, not a verdict): d=1 arm HB
  correctness beats d=0 by ≥ +0.1 (V1g D2 band) on ≥2/3 pairs. If the
  deployed effect vanishes, the line is broken — no dose inference.
- Primary metric: per-pair contact-weighted flipped-HB correctness
  (V1c metric) across the 5 doses (15 points); pooled OLS quadratic
  HB ~ d; peak d* = −b/2a; curvature = R²_quad − R²_lin (descriptive).
- Verdicts:
  - DOSE-OPTIMAL(d*): peak inside [0.5, 2.0] → gain-1.0 ships as
    deployed-optimal; gain question CLOSES (no follow-up).
  - ESCALATE: monotonic rise through d=4 (d* > 4 or HB_4 best by
    >+0.1 over HB_1) → higher-dose line licensed (freeze only).
  - DE-ESCALATE: peak < 0.5 (uniform wins or ties top with d=0 best) →
    gain hurts/neutral → re-deploy at lower dose or drop.
  - OVERDOSE: inverted-U with HB_4 < HB_1 − 0.1 → overdose law
    confirmed → cap future doses below onset.
  - FLAT: max−min HB across doses < 0.05 (knob dead) → contradicts
    V1g D2 → diagnose, no license.
  - INVALID (G1/G0/G2b/replication fail) / INCOMPLETE (halt).
- BH + same-valence descriptive (gain historically BH-flat; any dose
  moving BH gets reported, no gate). Timing secondary: first-contact
  ticks enable the encounter-timing test post-hoc (no gate).

Line closes with its verdict either way. Follow-ups need their own
frozen plans. No V2 without a new rationale. Single attempt,
cumulative +21. No RSI claim.
