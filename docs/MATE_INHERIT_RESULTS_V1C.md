# MATE-INHERIT Results V1c — exact V1b replication FAILS (line CLOSED as unconfirmed)

Date: 2026-10-26. Plan: `docs/MATE-INHERIT_PLAN_V1C.md` (no amendments).
Bank: `evidence/mate-inherit-dev/fresh-03/` (fresh, 6 histories).
Evidence: `evidence/mate-inherit-dev/attempt-03/`.

## Verdict: MATE-INHERIT-NOGO-V1C — edge does not replicate; line CLOSED

- **G1 integrity ✓** — 12/12 mains complete; ledger exact (12/0/21504/
  516096/2.37e9); `redone: []` (single clean run, no crash, no resume).
- **G2 audit ✓** — all rows maternal, decoupled, bar 50, enriched
  nutrient 5.0 both arms, transmissionNoise null (exact) / 0.05
  (mutant), births integer ≥ 0, lineage-verified generations.
- **G0 replication FAILS** — mutant gen-2 = **1** (< 2 required) and
  mutant (1) < exact (**3**). Verdict NOGO per the frozen bar.

Per-seed gen-2 (gen-1 in parentheses):

| seed | exact | mutant |
|---|---|---|
| 417001 | 0 (6) | 0 (6) |
| 417010 | 0 (2) | 0 (2) |
| 417019 | 0 (7) | 0 (7) |
| 417028 | 1 (7) | 1 (7) |
| 417037 | 0 (6) | 0 (3) |
| 417046 | 2 (6) | 0 (7) |

Founder spread (descriptive): exact gen-2 from founders [15, 7] +
one gen-3 (founder 17) — the first gen-3 birth observed under lineage
tracking (V1/V1f/V1b tracked or produced none); mutant gen-2 from
founder [5] only. Max generation: exact 3, mutant 2.

## Reading: close the line (descriptive; no further mating line without a new rationale)

The V1b edge (mutant 3 > exact 2) does not replicate — V1c reverses it
(exact 3 > mutant 1), and the V1b bar (≥2 + direction) fails on both
counts. Pooled across both lines, mutant gen-2 = 4 vs exact gen-2 = 5
on 12 mains per arm (≈0.3–0.4 gen-2/main): indistinguishable from no
effect, with the single V1b excess fully accounted for by one seed
(416046). The spread analysis
confirms concentration (not mechanism): gen-2 events cluster in 1–2
histories per arm per line — the ecology, not the transmission mode,
decides where compounding happens.

Per the frozen V1c plan this NOGO closes the mating line as
UNCONFIRMED: no V1d is licensed. A future mating line would need (a) a
mechanism that changes the per-encounter odds substantially (σ=0.05
does not move the needle vs exact copy at this power), or (b) an order
of magnitude more mains (the observed base rate, ~0.2 gen-2/main/arm,
makes 6-arm lines underpowered for anything but large effects), or
(c) a different transmission channel altogether (paternal/mixed,
learned-behavior copying rather than weight copying, or evolved
mating preferences). None of these are authorized here.

Standing record: what the mating track ESTABLISHED (all preserved):
actuation is exonerated (MATE-ACT), density backfires (MATE-DENSE),
bar50 unlocks births (MATE-ENERGY, first births in program history),
maternal transmission works but is neutral (V1, 16/16 identical),
gen-2 exists under enrichment (V1f, first gen-2), and mutated
transmission does not compound beyond exact copy at σ=0.05
(V1b weak-positive, V1c NOGO). The population track ends here until a
new rationale arrives. No RSI claim.
