# ODOR DEV ROUND 4 PLAN V1 — FROZEN 2026-11-02 (guarded distillation)

Status: FROZEN. Authorizes exactly one implementation matching this
plan verbatim, fixtures, triage (read-only round-1 trace reuse
check), and single execution on the SAME 8 reused histories. No
fresh bank. No second run, no tuning, no qual claim. Zero worlds
spent by this freeze. Lead candidate of the R4 slate (signal vs
architecture); B/C stay queued behind its falsifier.

## 1. Design (single-variable isolation vs R1-learned)

- Teacher pairs: (features, action) per decision from the ROUND-1
  guarded acquisition traces (read-only reuse — zero teacher cost,
  no new rollouts). 8-dim features (guard channels NOT included:
  the ONLY difference vs R1-learned is the training signal).
- Student: fresh 8-dim steering bodies, trained in curriculum order
  (A512/B512/C512/D256 slices of the teacher pairs — same 1792
  budget shape), supervised perceptron rule (frozen):
  pred = argmax values; if pred≠expert: w[expert][i] += .05·phi[i],
  w[1−expert][i] −= .05·phi[i], clipped [−8,8] (same bounds/rate
  as the live rule); if pred==expert: no update. Billing honest
  per-op (values 2·2·D + update 2·(2·D+1), routed through the work
  counter like probeOps).
- Slot anchors: checkpoint the BC learner at each slot end
  (A/B/C/D) → same probe wiring as round 1 (final-A designated
  'A', keep all).
- Probes: A/B earlier-current-reset + transfer 5 modes from the BC
  D anchor (same seeds, same scorer code path as rounds 1–3).

## 2. Instrument change contract (exact)

- New `superviseOwnSteering(state, features, expert)` in
  `learning/own-steering.mjs` implementing the frozen rule above
  (pure function + honest billing; no other file touched).
- R4 script: teacher-pair extraction (read-only) + BC training
  loop + slot checkpoints + standard probe suite.
- Fixtures: perceptron convergence on synthetic separable data;
  already-correct no-update path; clip bounds; billing identity
  (billed == executed); anchor wiring (4 keys + final-A);
  no-new-seeds (teacher pairs reference round-1 seeds only).

## 3. Caps

Teacher cost zero (traces exist). BC training ≈ R1 acquisition
(~2.4e9) + full probes (~23.9e9) ≈ 26.3e9 → frozen caps 40e9 ops,
3600s wall, same 8 reused histories.

## 4. Verdict (frozen)

- GO iff transfer gate (6/8 vs reset AND vs cheap native-full,
  nonnegative survivor diffs) AND A≥95% AND B≥95%.
  (No beat-guarded bar: student≈teacher is expected, not superior;
  the guarded comparison is reported descriptively — if BC MATCHES
  guarded, signal was the gap; the bar is the transfer gate the
  lane has never cleared.)
- PARTIAL if transfer passes but a retention fails.
- Else NO-GO (signal-side closed → promote candidate B,
  nonlinear head; dataset-distillation fallback stays queued).
- Descriptive dev verdicts in all cases. A GO triggers
  qual-freeze consideration (iv-b) — authorizes nothing further.
