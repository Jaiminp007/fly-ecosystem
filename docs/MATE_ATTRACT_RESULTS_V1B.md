# MATE-ATTRACT V1b — RESULTS (single authorized attempt)

**Verdict: MATE-ATTRACT-NOGO-V1B** — suppression fails exactly: hub/0.5× gen-2 = 5 vs
hub/1× gen-2 = 5 (births 27/27, gen-1 22/22 — identical totals). Food drives it or
nothing replicates. Line CLOSES (no V2 without new rationale).
Cumulative program spend: 7779 (+18).

## Attempt (ONE, authorized, 2026-11-01)

- Bank: `evidence/mate-attract-dev/fresh-02/` (431001–431054, 6 histories × 9 seeds), built post-freeze, force-added.
- Runner: `runMateAttractV1b` — 3 arms (hub/1×, hub/0.5×, spread/1× anchor) × 6 histories
  = **18 mains**, ZERO probes, BT_TICKS=1792.
- Ledger (`attempt-02/ledger.json`): 18 mains / 0 probes / 32256 worldTicks / 3.45e9 ops. No crash, no resume, `redone: []`.
- Integrity: G1 true (18/18, 6/arm, finite endpoints). G2 true (sense/topology/geography
  per-arm maps). Residuals < 1e-7.

## Per-arm outcomes

| arm | births | gen-1 | gen-2 | gen-2/seed |
|---|---|---|---|---|
| hub/1× | 27 | 22 | 5 | [0,0,2,0,0,3] |
| hub/0.5× | 27 | 22 | 5 | [0,0,2,1,0,2] |
| spread/1× | 36 | 30 | 6 | [0,0,4,0,1,1] |

- Suppression (the verdict): 5 vs 5, EXACT totals (births and gen-1 identical too;
  firstMatingTick per-seed identical across hub arms). Halving mate-sensing range
  changed NOTHING measurable.
- V1-direction fails its fourth bank: spread/1× gen-2 6 > hub 5/5 (V1 5>3, V1b 7>2,
  ATTRACT 6,8>4,4 — direction held 3/4 banks, now reversed). Hub advantage is
  bank-volatile; recorded, not gated.

## Structural finding (post-hoc read of frozen engine code, zero new worlds)

Decoupled mating (`matingActionRequired=false`, ALL mating-line arms) is
**proximity-gated**: engine.mjs:175-178 — with `needAct=false`, mating executes on
≤26-unit proximity + energy/cooldown/maturity alone; the learned mate-action channel
(actions[3]) is bypassed for BOTH initiation and receptivity. Sensing can therefore act
ONLY via locomotion (steering into proximity), never via the mating act itself. Range
changes in [0.5, 2]× leave ≤26 proximities untouched when movement is food-driven —
hence the exact nulls. This SHARPENS (not overturns) V1's learned-use reading: the
bypass is structural, not just lazy features. R65 cross-link: the activation-patching
illusion literature (2311.17030v2) — intervening on a component outside the causal
path yields nulls that mean "wrong level," not "no effect." Our 0.5×/1×/2× sweep
patched a bypassed channel three times.

## Consequence for the mating program

Every decoupled line (MATE-ACT through ATTRACT-V1b) has been testing
**proximity-mediated mating**; sensing/policy manipulations were always second-order
via locomotion. Future Emlen-Oring work must manipulate PROXIMITY rates, not sensing
(arena/founder-count/duration rethink — MATE-DENSE's density×food-competition
confound stands as the warning). The carried weight-logging requirement is now
conditional: it matters only for coupled (`matingActionRequired=true`) designs where
the action channel is IN the causal path — a coupled line needs its own rationale
(actuation was exonerated + frozen-decoupled for a reason; reopening it is a
program-level decision, not an instrument tweak).

## What did NOT happen

- No second attempt, no rescoring, no pooled gating, no tuning.
- No RSI/population claim. No transfer claim.
