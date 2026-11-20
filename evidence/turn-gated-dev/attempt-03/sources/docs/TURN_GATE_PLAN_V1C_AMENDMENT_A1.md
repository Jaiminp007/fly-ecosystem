# TURN-GATE Plan V1c — Amendment A1 (pre-execution metric clarification)

Date: 2026-10-26. No code written, no worlds run, no bank built — this
amends the DESIGN ONLY plan before implementation (same standing as V1b
Amendment A1).

## Issue

`docs/TURN_GATE_PLAN_V1C.md` describes the flip-split as "per-subset
contact-weighted gaps via the frozen scorer restricted to cue subsets"
but carries the numeric band same-val ≥0.85 / flipped in [0.4,0.7] — which
was calibrated in CORRECTNESS space (post-hoc adjudication: same-val
0.944–0.951, flipped 0.510–0.618 unweighted). Read-only calibration on the
frozen V1b rows (zero new worlds) confirms the mismatch:

| pair | same gap | same wcorr | flipped gap | flipped wcorr |
|---|---|---|---|---|
| 407001→407010 | 0.9026 | 0.951 | 0.0922 | 0.615 |
| 407019→407028 | 0.8818 | 0.946 | 0.1192 | 0.590 |
| 407037→407046 | 0.8875 | 0.944 | 0.2466 | 0.640 |

Pooled subset gaps (flipped 0.09–0.25) do NOT fit the frozen band; the band
is correctness-scale. Applying gap-space scoring under a
correctness-calibrated band would manufacture a false mechanism
non-confirmation.

## Amendment (replaces the flip-split metric paragraph; everything else frozen)

The flip-split reports contact-weighted per-cue CORRECTNESS per subset —
same formula family as the motivating adjudication, plus contact-weighting
so rare cues cannot swing a subset:

- same-valence subset: wcorr of transferred behavior vs TEST labels on
  cues whose valence did not change between train and test rows.
- flipped subset: wcorr vs TEST labels on cues whose valence changed.
- replayed: wcorr of transferred behavior vs TRAIN labels on jointly
  observed cues (second lens: pure replay → ≈ train-self; full
  adaptation → low).

Cue split defined by train-row vs test-row labels; cues observed in only
one row are excluded from all subsets (counts + contact totals reported).
Empty subset → null (reported, never imputed).

The frozen numeric band is UNCHANGED and applies to correctness:
mechanism confirmed iff same-val ≥0.85 AND flipped in [0.4,0.7] on the
fresh bank. G-gates, bars, verdict strings, bank, caps, and single-attempt
provisions are untouched.
