# M-GATE status (margin-gated protection follow-up)

Line: test whether V3-style directional protection helps when gated on the
accepted D1 motor-margin (certainty). New intervention line unlocked by
D1-acceptance; does NOT revisit V3/M-ACTOR verdicts.

- 2026-10-28: `docs/MARGIN_GATED_PLAN_V1.md` FROZEN (DESIGN ONLY). Single
  authorized Phase-D attempt pending: fresh 36-main dev bank (382001–382036),
  τ ∈ {∞, 0, 0.2} × fixed V3 rate, 264 executions, conjunctive G1–G5
  (relevance gate + V3-style effect + fidelity + caps + triage). No worlds run.
- Prerequisite: D1 probe-margin readback ACCEPTED (`MARGIN_READBACK_RESULTS_V4.md`).
- 2026-10-28: Phase-D EXECUTED → **DEV-NOGO, line CLOSED**. G1 relevance PASS
  (margin-outcome gap 0.312, n=37527); G2 FAIL (bestTau=0, dA −0.249);
  G3″ FAIL only on rng-identity for 1/4 histories (slowDir-zeros held — gate
  never applied; billing-asymmetry chaos recorded). τ-0.2 ≡ τ-0 bit-identical
  (gate never closed in-bank). 252 exec within all caps; 1 crash-resume
  (V1d null-restore fix, dual provenance, ledger exact). No Phase Q, no qual
  spent. Full record: `docs/MARGIN_GATED_RESULTS_V1.md`.
