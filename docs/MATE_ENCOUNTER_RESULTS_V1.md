# MATE-ENCOUNTER V1 — RESULTS (single authorized attempt)

**Verdict: MATE-ENCOUNTER-GO-V1** — hub gen-2 = 5 ≥ 2 and > spread 3; manipulation
passes (hub births 35 > spread 25 by 40% and +10 absolute). Spatial concentration
lifts lineage compounding at this scale. Line CLOSES per plan (GO → carry-over /
attraction follow-ups need fresh rationale + frozen plan + fresh bank).

## Attempt (ONE, authorized, 2026-10-31)

- Bank: `evidence/mate-encounter-dev/fresh-01/` (427001–427054, 6 histories × 9 seeds), built post-freeze, force-added.
- Runner: `runMateEncounterDev` — 2 arms (spread control vs hub treatment, both nutrient
  override 5.0 + maternal transmission + bar 50 + decoupled) × 6 histories = **12 mains**,
  ZERO probes, BT_TICKS=1792.
- Ledger (`attempt-01/ledger.json`): 12 mains / 0 probes / 21504 world-ticks / 2.32e9 scalar ops. No cap breach, no crash, no resume (clean single pass).
- Integrity: G1 true (12/12 rows, 6/arm, finite endpoints). Accounting residuals < 1e-7 (checkMainIntegrity on all 12).

## Per-arm outcomes

| arm | births | gen-1 | gen-2 | gen-2 seeds |
|---|---|---|---|---|
| spread | 25 | 22 | 3 | [1,0,1,0,1,0] |
| hub | 35 | 30 | 5 | [0,1,2,0,0,2] |

- Manipulation gate: hub 35 > spread 25 × 1.1 (= 27.5) ✓ and +10 ≥ 5 ✓ — the topology knob ENGAGED (knob verified end-to-end: hub runs show single fixed center {500,320}).
- GO bar: hub gen-2 = 5 ≥ 2 ✓ and 5 > 3 ✓.
- No INCOMPLETE (hub gen-1 = 30). No INVALID (G2 true after correction below).

## CORRECTION (disclosed, analytic-only, no data touched)

- **Before:** scorer returned INVALID — `config/birth/generation/topology audit failed`.
- **Cause:** G2 checked `r.verticalTransmission==='maternal'`, but the frozen row schema never
  defined that field (all rows `undefined` → tautological fail). The RUNNER is correct:
  `verticalTransmission:'maternal'` is a hardcoded literal in the TasteExperiment call
  (zero per-arm variation possible; corroborated by `attempt.json` + sources closure).
- **Fix:** replaced the single-field clause with the frozen-literal + attempt.json establishment
  (comment in `scoreMateEncounterDevRows`, 2026-10-31). All other G2 clauses unchanged.
  Same class as the BRAKE-LIFT-V1 `note()` swap: bookkeeping/audit repair, not rescoring —
  no rows, bank, or engine behavior touched; verdict recomputed deterministically.
- **After:** G2 true → MATE-ENCOUNTER-GO-V1.
- **Why the freeze fixtures missed it:** synthetic `mkRow` INCLUDED `verticalTransmission`
  (9/9 green at freeze) while the real runner never wrote it. **Process lesson:** audit-gate
  fixtures must assert the row schema the RUNNER produces (schema-conformance), not a
  hand-built superset. Future instruments: add a fixture comparing synthetic-row keys
  against runner-row keys.

## Interpretation (thin margin, honestly held)

- Margin is +2 gen-2 (5 vs 3) across 6 histories — same class as MATE-INHERIT-V1b's thin
  margin, which did NOT replicate in V1c. This GO licenses FOLLOW-UPS (carry-over design,
  attraction-knob rationale), not a compounding claim.
- Mechanism sketch (hypothesis only): single-hub food concentrates founders → higher
  encounter rate → more matings (35 vs 25 births) → more gen-1 (30 vs 22) → more gen-2
  rolls (5 vs 3). Concentration lifts the BIRTH bottleneck that MATE-SOCIAL showed
  transmission cannot fix. Whether gen-2 rate per birth differs is NOT established
  (5/35 ≈ 0.14 vs 3/25 = 0.12 — indistinguishable at this n).
- Encounters remain the bottleneck: even hub histories max 2 gen-2; 2/6 hub histories childless at gen-2.

## What did NOT happen

- No second attempt, no rescoring of data, no bank regeneration, no tuning.
- No RSI/population claim. No transfer claim.
- Cumulative program spend: 7695 + 12 = **7707 mains-equivalent** (per-line ledgers authoritative).

## Status

MATE-ENCOUNTER V1 CLOSED AS GO (first hub-concentration evidence). Next: any follow-up
(carry-over persistence, attraction knob, scaled hub) needs fresh rationale + frozen plan
+ fresh bank. Transmission-mechanism space remains CLOSED (V1/V1b/V1c/social); the open
question is now encounter TOPOLOGY, and this result is its first positive datum —
unreplicated.
