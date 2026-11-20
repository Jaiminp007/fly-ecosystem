# R-GAP status (gap-widening recursive search, Phase A)

Child of M-DISCRIMINATE (gate OPEN, 10 contexts). First RSI-attempt with a
measurable target instead of a menu: widen trained-vs-zeroed, don't retain.

- 2026-10-29: verified read-only (reset-invariance CONDITIONAL on symmetric
  billing: M-GATE wobble ~1.0 vs S-GATE bit-exact 0.0000; menu census — 12
  never-searched dials, most banned/ablations; gap scale mean 1.265 sd 0.72;
  margin class cleanly rejected). `docs/R_GAP_PLAN_V1.md` FROZEN (DESIGN
  ONLY): S1 representation / S2 scheduling / S3 critic-asymmetry (contradicts
  motor-prior); anti-degeneracy (symmetric billing + transfer guard ≤0.1);
  fresh 387001–387054; ≤8 proposals ≤96 worlds; conjunctive G1(+0.5)/G2/G3/G4
  (baseline sanity [0.5,2.5])/G5. Claim bar restated (no early victory).
- 2026-10-29: Phase A EXECUTED → **INVALID-BILLING, line CLOSED**. G1 FAIL
  (best validated +0.045); G2 guard tripped by S1 only (dT 0.3–3.8, all 12
  arms; S2/S3/control exactly 0.0). Mechanism: pause-bias, not billing
  (trained<reset in transfer, consistent sign; symmetric configs immune).
  S1 disqualified (would-be best +0.229 = bias, not discrimination); S2/S3
  clean nulls. No Phase B. 252 exec in caps, no crash. Cumulative 7648.
- 2026-10-29: V1b recomputation COMPLETE (zero new worlds, separate output
  file, dual provenance) → V1B-NOGO: corrected S1 gaps NEGATIVE (−0.86 —
  pause-bias exceeded the signal); best validated +0.045 (S2-frontload);
  guards clean. Line CLOSED, no Phase B. ARENA contexts stand as the
  licensed testbed for future mechanisms. Cumulative 7648 (V1b added
  0 worlds). Full record: `docs/R_GAP_RESULTS_V1B.md`.
