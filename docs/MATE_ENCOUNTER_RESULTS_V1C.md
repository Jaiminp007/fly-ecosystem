# MATE-ENCOUNTER V1c — RESULTS (single authorized attempt)

**Verdict: MATE-ENCOUNTER-NOGO-V1C** — no dose pattern: spread gen-2 2 / duo 10 /
hub 2. Weak monotonicity (spread ≤ duo ≤ hub with hub > spread) FAILS because duo
beats hub (10 > 2). Per the frozen gate, concentration does not order compounding;
V1 GO reads as bank luck. Line CLOSES (no V1d without new rationale).
Cumulative program spend: 7737 (+18).

## Attempt (ONE, authorized, 2026-11-01)

- Bank: `evidence/mate-encounter-dev/fresh-03/` (429001–429054, 6 histories × 9 seeds), built post-freeze, force-added.
- Runner: `runMateEncounterV1c` — 3 arms (spread/duo/hub) × 6 histories = **18 mains**,
  ZERO probes, BT_TICKS=1792. Geography audit read from live world state per row.
- Ledger (`attempt-03/ledger.json`): 18 mains / 0 probes / 32256 worldTicks / 3.60e9 ops. No crash, no resume, `redone: []`.
- Integrity: G1 true (18/18, 6/arm, finite endpoints). G2 true INCL. geography audit
  (centers 3/2/1 match arms on all 18 rows — knob-pathology catch never fired).
  Residuals < 1e-7.

## Per-arm outcomes

| arm | centers | births | gen-1 | gen-2 | gen-2/seed | gen-2/birth |
|---|---|---|---|---|---|---|
| spread | 3 | 29 | 27 | 2 | [0,0,0,1,0,1] | 0.07 |
| duo | 2 | 49 | 39 | 10 | [3,0,4,1,0,2] | 0.20 |
| hub | 1 | 35 | 33 | 2 | [0,0,1,1,0,0] | 0.06 |

- Dose shape: HUMP (duo wins everything), not monotone → frozen NOGO-V1C.
- firstMatingTick (descriptive): medians spread 248 / duo 282 / hub 265.5, ranges
  overlapping — no timing ordering; R58 variance story gets no support (third time).
- Energies (descriptive): duo −20.5 > spread −24.3 > hub −41.9. Hub starves (replicates
  V1b's cost); duo eats best AND compounds most.
- Cross-attempt regularity (descriptive, hypothesis-generating ONLY): the arm with most
  births also has the highest per-birth gen-2 rate — V1b hub 0.19 vs 0.06, V1c duo 0.20
  vs 0.06–0.07. Births AND rate move together in the winning arm (compounding, not just
  rolls). Untested mechanism; recorded, not claimed.

## Interpretation (honestly held)

- The frozen question (does concentration order compounding monotonically?) answers NO.
- The hump is fully consistent with the ACCEPTED total-food confound (food scales 1<2<3
  centers): duo = most food per encounter-opportunity. The plan's conservative direction
  (concentration must win despite less food) is satisfied by NO arm — hub ≈ spread on
  gen-2 despite the concentration, duo wins with the most food.
- This MOTIVATES (not licenses) the Emlen-Oring food-vs-encounter split: duo-vs-hub
  differs in both food amount and encounter structure, and only a design separating them
  (attraction knob — unbuilt) can say which drives the hump. That rationale is now
  data-backed rather than speculative.
- Pooled encounter-line gen-2: V1 hub 5 vs spread 3 (GO, thin) + V1b hub 7 vs spread 2
  (INVALID) + V1c spread 2 / duo 10 / hub 2 (NOGO). No arm replicates across banks
  except duo's single appearance. The line's net finding: encounter outcomes are
  bank-volatile; the only stable pattern is cost (hub starves twice).

## What did NOT happen

- No second attempt, no rescoring, no pooled gating, no tuning (hump was a
  pre-registered NOGO shape — the gate held against an interesting result).
- No RSI/population claim. No transfer claim.

## Status

MATE-ENCOUNTER V1c CLOSED AS NOGO-V1C. Encounter-topology line: V1 GO (unreplicated) +
V1b INVALID (knob flat) + V1c NOGO (hump, food-confounded) → ENCOUNTER TOPOLOGY
INSUFFICIENT as a compounding lever at this scale; the line closes pending the
Emlen-Oring split (needs attraction-knob engine work + fresh rationale + frozen plan
+ fresh bank). Transmission-mechanism space remains CLOSED.
