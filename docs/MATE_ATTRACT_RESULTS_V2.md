# MATE-ATTRACT V2 — RESULTS (single authorized attempt)

**Verdict: MATE-ATTRACT-NOGO-V2** — taxis fails: attract gen-2 = 2 vs spread 3
(births 31 vs 33, flat). Even hardwired steering toward mates does not lift
compounding at this scale. Line CLOSES (ATTRACT arc: sensing CLOSED, steering CLOSED).
Cumulative program spend: 7857 (+18).

## Attempt (ONE, authorized, 2026-11-02)

- Bank: `evidence/mate-attract-dev/fresh-03/` (436001–436054, 6 histories × 9 seeds), built post-freeze, force-added.
- Runner: `runMateAttractV2` — 3 arms (attract spread+k=2 vs spread control + hub/k=0 anchor)
  × 6 histories = **18 mains**, ZERO probes, BT_TICKS=1792. k=2 parity with the food coefficient.
- Ledger (`attempt-03/ledger.json`): 18 mains / 0 probes / 32256 worldTicks / 3.59e9 ops. No crash, no resume, `redone: []`.
- Integrity: G1 true (18/18, 6/arm, finite endpoints). G2 true (arm/topology/sense/bias/geography per-arm maps; billing symmetric by construction). Residuals < 1e-7.

## Per-arm outcomes

| arm | births | gen-1 | gen-2 | gen-2/seed |
|---|---|---|---|---|
| attract (spread+k=2) | 31 | 29 | 2 | [0,0,1,0,0,1] |
| spread (control) | 33 | 30 | 3 | [0,0,2,1,0,0] |
| hub (anchor) | 40 | 34 | 6 | [1,2,1,1,1,0] |

- Taxis contrast (the verdict): 2 vs 3, wrong-signed and tiny — flat. The knob engaged
  (scripted fixture: k=2 orients, k=0 blind) but live rows show no timing shift either:
  firstMatingTick attract [215,214,232,242,314,217] vs spread [215,214,232,242,253,227]
  (4/6 seeds IDENTICAL) — encounters happen on the same schedule regardless of steering.
- Hub anchor 6 gen-2 (V1-direction holds again; sixth bank reading: hub beats spread 5/6).
- Energies (descriptive): attract −30.1 vs spread −25.0 vs hub −41.9 (hub starvation replicates).

## Interpretation (honestly held)

- The R65 patching logic inverted: V1/V1b nulls could be read as "wrong level" (sensing
  bypassed). V2 intervenes IN the causal path (movement → proximity → mating) with a
  proven-engaged knob and STILL gets a null. Suppression-of-alternatives now favors:
  encounters do not limit compounding at this scale; the bottleneck is downstream
  (encounter→birth conversion and/or birth→gen-2 survival, both flat across arms).
- Birth totals (27–40 across all V2 arms, all banks 25–49) move with food/topology,
  never with sensing/steering knobs — six lines of evidence that mating volume is
  ecologically, not informationally, set. What compounding needs is not more meetings
  but more surviving lineage — an energy/lifespan question, not an encounter one.
- Emlen-Oring adjudication (V1b left it open): food-vs-encounters is now MOOT in the
  tested regime — varying encounters by three independent mechanisms (sensing range,
  sensing suppression, hardwired taxis) moves nothing, while food geography moves births
  without compounding them either (V1c hump: most births, no lift). Neither lever compounds.

## What did NOT happen

- No second attempt, no rescoring, no pooled gating, no tuning (k=2 pre-registered parity; sign verified by fixture).
- No RSI/population claim. No transfer claim.

## Status

MATE-ATTRACT V2 CLOSED AS NOGO-V2. ATTRACT arc CLOSED (sensing irrelevant/bypassed + steering irrelevant/even-forced). Mating program net (final): transmission inert; topology insufficient-alone; sensing bypassed; steering inert; proximity orders (2 replicated banks) but saturates; food gates but does not gradient; knowledge does not establish. The remaining licensed items (coupled action, quality-signal, detection-sharing, N-donor, noise-dose) are program-level decisions or fresh rationales — no experiment in the current instrumentarium can move them.
