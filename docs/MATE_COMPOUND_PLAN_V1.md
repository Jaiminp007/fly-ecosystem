# MATE-COMPOUND PLAN V1 — FROZEN (selection × transmission interaction)

Date: 2026-11-03. Status: FROZEN (design only until implemented).
Single authorized bounded world run (disk floor 1 GB; ~5G at freeze).

## Rationale (new question, not a replication or variation)
Two adjacent GO-thin signals point at an untested interaction:
- MATE-SELECTION V1/V1b: learned founders out-reproduce never-learners
  with transmission OFF (6>5, 17>10/16) — bare selection, no compounding
  (gen-2 ≤ 1/arm).
- MATE-INHERIT V1b: maternal transmission works and gen-2 exists (3 ≥ 2),
  but founders never differed in learning (both learned) — no selection.
No line has ever run a LEARNING contrast with transmission ON: does
maternally transmitted learning COMPOUND the selection signal across
generations (gen-2+ amplification), or does it wash out? This is the
M2-vehicle question one step further (selection retaining/compounding
what lifetime learning builds). Different arms (2, maternal both),
different bank, different verdict (compounding read) from MATE-SELECTION
V1/V1b — an interaction test, not a replication. INHERIT closed the
MUTATION question (V1c NOGO); learning-contrast was never its question.

## Design (frozen; proven plumbing only — no engine changes)
- Instrument: `scripts/mate-compound-dev.mjs` (new; mate-selection
  verbatim pattern). 2 histories × 2 arms (maternal-candidate /
  maternal-unlearned) = 4 mains, ZERO probes, bar 50 + nutrient 5.0
  (births-occurring), reproduction true, matingActionRequired false,
  verticalTransmission 'maternal' (exact-copy; V1-proven path), BT_TICKS,
  BT_FOUNDERS, body N. Candidate line learns every generation;
  unlearned line frozen every generation (constructor + newborn paths).
- Metric: total line births per arm per history (founders + all
  descendants). Descriptive: gen-2+ counts, gen-1 lifespan, founder vs
  descendant births.
- Bank: `evidence/mate-compound-dev/fresh-01/` 473100–473117 (2 × 9),
  verified clean pre-freeze (0 exact hits evidence + tracked), builder
  re-gates at mint. First use is the single run.
- Fixtures (new `tests/mate-compound-dev.test.mjs`, green required):
  bank tmp-mint shape/exclusion, scorer GO/NOGO/INCOMPLETE branches on
  synthetic rows, arm→learning options contrast at tick 0 (throwaway
  synthetic seed 7) + maternal-mode wiring, generation-summarizer parity.
  Triage-analogue = zero-tick (no worlds pre-run).
- Caps: mate-selection values; expected output <2M. `df` pre/post, abort
  under 1 GB. Single attempt, no rescoring (V1/V1b/INHERIT stand).

## Gates (frozen)
- G1: ledger exact (4 mains / 0 probes, 2 per arm).
- G2: config audit (maternal both arms, bar 50, nutrient 5.0, births
  integers, generations valid, founder accounting intact).
- Verdict: all-zero births → INCOMPLETE-NOBIRTHS (void, V1 precedent);
  else candidate-line total > unlearned-line total → GO (selection
  signal persists under transmission; thin n=2, licenses replication
  ONLY — compounding read descriptive); else NOGO with stop-rule
  analogue. Compounding note (descriptive, no bar): gen-2+ by line.
- Scope: NO population/learning/RSI/retention claim beyond the licensed
  next step. No cross-line pooling (different transmission mode).
