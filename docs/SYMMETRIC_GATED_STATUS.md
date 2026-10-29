# S-GATE status (symmetric-billing margin-gated protection)

Child of M-GATE (DEV-NOGO 2026-10-28). Addresses the recorded killer:
decision-gated billing asymmetry. Compute-always + masked-apply (Design C′,
verified read-only) makes billing constant at identical states; τ=0.3 chosen
above the bites-nothing 0.2 (G1 cuts 0.101/0.207).

- 2026-10-28: `docs/SYMMETRIC_GATED_PLAN_V1.md` FROZEN (DESIGN ONLY).
  Read-only verification complete (single call site, Gen1 outer-condition
  intact, hoist math-preserving, no other slowDir readers).
- 2026-10-28: Phase-D EXECUTED → **DEV-NOGO, line CLOSED**. G1 PASS
  (gap 0.265, n=37758); G2 FAIL (bestTau=0, dA≈1e-6 — pull null even when
  fairly compared; selective ≡ uniform); G3 PASS (gate opened AND closed
  on all 4 histories). Symmetric billing confirmed (drift 0.41→1e-6).
  228 exec within all caps; 1 scoring-resume (V1a keying fix, dual
  provenance, redone empty). No Phase Q, no qual spent. Full record:
  `docs/SYMMETRIC_GATED_RESULTS_V1.md`.
