# M-GATE status (margin-gated protection follow-up)

Line: test whether V3-style directional protection helps when gated on the
accepted D1 motor-margin (certainty). New intervention line unlocked by
D1-acceptance; does NOT revisit V3/M-ACTOR verdicts.

- 2026-10-28: `docs/MARGIN_GATED_PLAN_V1.md` FROZEN (DESIGN ONLY). Single
  authorized Phase-D attempt pending: fresh 36-main dev bank (382001–382036),
  τ ∈ {∞, 0, 0.2} × fixed V3 rate, 264 executions, conjunctive G1–G5
  (relevance gate + V3-style effect + fidelity + caps + triage). No worlds run.
- Prerequisite: D1 probe-margin readback ACCEPTED (`MARGIN_READBACK_RESULTS_V4.md`).
- Next: implement gate instrument + fixture tests + triage, then execute the
  single Phase-D attempt. No qual spent on a negative; no second attempt.
