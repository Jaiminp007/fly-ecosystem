# S-GATE status (symmetric-billing margin-gated protection)

Child of M-GATE (DEV-NOGO 2026-10-28). Addresses the recorded killer:
decision-gated billing asymmetry. Compute-always + masked-apply (Design C′,
verified read-only) makes billing constant at identical states; τ=0.3 chosen
above the bites-nothing 0.2 (G1 cuts 0.101/0.207).

- 2026-10-28: `docs/SYMMETRIC_GATED_PLAN_V1.md` FROZEN (DESIGN ONLY).
  Read-only verification complete (single call site, Gen1 outer-condition
  intact, hoist math-preserving, no other slowDir readers).
- Next: implement masked-apply instrument + fixture tests + triage, then the
  single Phase-D attempt (228 exec, 383001–383036). No qual on a negative.
