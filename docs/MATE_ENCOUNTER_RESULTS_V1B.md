# MATE-ENCOUNTER V1b — RESULTS (single authorized attempt)

**Verdict: INVALID (manipulation failed)** — hub births 36 do not exceed spread 33
by ≥10% (+9%) and ≥5 (+3). Per the frozen plan, the knob did not engage on the fresh
bank: compounding cannot be tested, instrument/ecology outcome, not a mechanism result.
Line CLOSES (no V1c without new rationale). Cumulative program spend: 7719 (+12).

## Attempt (ONE, authorized, 2026-10-31)

- Bank: `evidence/mate-encounter-dev/fresh-02/` (428001–428054, 6 histories × 9 seeds), built post-freeze, force-added.
- Runner: `runMateEncounterV1b` — same 2 arms × 6 histories = **12 mains**, ZERO probes,
  BT_TICKS=1792. Row schema frozen + asserted at write time (no schema correction needed).
- Ledger (`attempt-02/ledger.json`): 12 mains / 0 probes / 21504 worldTicks / 2.37e9 ops. No crash, no resume, `redone: []`.
- Integrity: G1 true (12/12, 6/arm, finite endpoints). G2 true (first future run with the
  V1-corrected audit passing clean — schema-conformance fixture worked). Residuals < 1e-7.

## Per-arm outcomes

| arm | births | gen-1 | gen-2 | gen-2 per seed |
|---|---|---|---|---|
| spread | 33 | 31 | 2 | [0,1,0,1,0,0] |
| hub | 36 | 29 | 7 | [1,0,3,2,1,0] |

- Manipulation gate: hub 36 vs spread 33 → +9% (< +10%) and +3 (< +5). FAILS BOTH prongs → INVALID.
- firstMatingTick (descriptive, non-gating): spread [230,238,252,200,256,447] median 245;
  hub [348,272,219,257,227,238] median 247.5. NO timing shift; ranges overlap. The R58
  variance-dominance prediction gets no support from these data.
- Starvation check (descriptive): hub endpoint energies (−32.6 to −47.2, mean ≈ −36.7)
  LOWER than spread (−16.5 to −33.9, mean ≈ −24.6). Concentration has an energy cost —
  the fixed-abundance conservative design bites, as the V1 plan anticipated.

## What the failed gate leaves on the table (hypothesis-generating ONLY, not verdicts)

- Gen-2 DIRECTION replicated with a larger absolute margin (7 vs 2, +5) than V1 (+2).
- Gen-2 per birth differs 3×: hub 7/36 ≈ 0.19 vs spread 2/33 ≈ 0.06 (V1: 0.14 vs 0.12,
  indistinguishable). V1's "more births → more rolls" sketch is NOT supported by V1b
  (births flat, gen-2 up) — IF the effect is real, it works through per-birth
  compounding rate, not birth count.
- These are observations from an INVALID attempt: they license NO claim and NO
  auto-escalation. They are recorded so a future rationale (Emlen-Oring food-vs-encounter
  split, λ-dose, carry-over) starts from data, not memory.

## Pooled V1+V1b (descriptive, no gate)

- Births: hub 71 vs spread 58 (+22% pooled — the manipulation passes pooled but the
  frozen bar is per-attempt, correctly: bank variance swamped V1b's spread arm 25→33).
- Gen-2: hub 12 vs spread 5. Direction consistent across 12 histories, two banks.

## What did NOT happen

- No second attempt, no rescoring, no pooled gating, no tuning (V1b bar was
  frozen-identical — replication fidelity held even though it produced INVALID).
- No RSI/population claim. No transfer claim.

## Status

MATE-ENCOUNTER V1b CLOSED AS INVALID (knob-didn't-engage). V1 GO stands UNREPLICATED
(V1c precedent: thin-margin GO + failed replication = unconfirmed, line closed).
Any follow-up (Emlen-Oring split needs the unbuilt attraction knob; λ-dose needs
scaled-hub rationale; carry-over needs persistence rationale) needs fresh rationale +
frozen plan + fresh bank. Transmission-mechanism space remains CLOSED; encounter
topology is now 1 GO (unreplicated) + 1 INVALID (knob flat, gen-2 direction held).
