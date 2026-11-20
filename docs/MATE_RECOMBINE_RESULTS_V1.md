# MATE-RECOMBINE RESULTS V1 — crossover neutral (NOGO, line CLOSED)

Date: 2026-11-02. Plan: `docs/MATE_RECOMBINE_PLAN_V1.md` (FROZEN, design only).
Implement: `6d8e50f` (biparental uniform crossover + per-row transmission +
11/11 fixtures + fresh-01 bank 441001–441054).
Attempt-01 (single, authorized): 18 mains / 0 probes / 32256 worldTicks /
774144 founderSlots / 3.53e9 ops. Ledger exact, `redone: []`, G1+G2 true.

## Verdict: MATE-RECOMBINE-NOGO-V1

Recombination does not lift compounding: hubRecombine gen-2 = 4 vs hub
gen-2 = 5. Neither disruption catastrophe nor rescue — crossover of learned
weight vectors is approximately NEUTRAL at this scale. Per the frozen rule
this is not the canonical benefit: line CLOSED (no MLR2 without new rationale;
single-point named but unlicensed).

## Per-arm totals (6 histories each)

- hubRecombine (hub + biparental): births 35, gen-1 31, gen-2 4
  per-seed gen-2 [0,1,1,1,1,0] (seeds 441001…441046).
- hub (hub + maternal): births 38, gen-1 33, gen-2 5
  per-seed gen-2 [0,1,2,2,0,0].
- spread (maternal, descriptive): births 34, gen-1 29, gen-2 5
  per-seed gen-2 [2,1,0,0,0,2] (incl. one zero-birth row 441028).

## Mechanism read (descriptive, non-gating)

- firstMatingTick IDENTICAL per-seed hubRecombine vs hub (8th bank running).
  Mating scheduling is invariant to every knob tried (sense, bias, gate,
  leave, transmission) — encounters are clockwork; all action is downstream.
- The neutral result is itself informative. Ratchet-halt needs what this
  design lacks: (a) MULTI-GENERATION mutation accumulation to purge
  (one mating round cannot show purging — our weights start competent,
  not loaded; tNoise was null by design, so there was nothing to purge);
  (b) standing deleterious variation with small effects. Uniform crossover
  of co-adapted learned policies shuffles without degrading (4v5, within
  noise) — no disruption catastrophe either, which rules OUT the fragility
  reading (learned policies are not brittle to mixing).
- So: mating's canonical benefit is a LONG-arc phenomenon (accumulate over
  generations, purge by recombination). A single-round test was fair but
  structurally unable to show it — the plan's GO bar assumed single-round
  visibility, which the theory (R86's own ratchet: clicks accrue over
  generations) does not support. This is a design lesson, not a refutation:
  any future transmission test must run multi-generation mutation loads
  first (load, THEN recombine) — specified as the named direction, not
  licensed (needs frozen plan + fresh bank, and a load phase design).
- The R86 critique stands unrefuted and unconfirmed: mating still lacks its
  canonical job in this codebase (no linkage, no purge demonstrated), but
  the null is now "neutral, not harmful" rather than "untested".

## Arc position

Mating arc: 11 interventions across sensing/steering/interaction/gating/
leaving/transmission; two thin GOs (ML1 unreplicated, PROXIMITY dose
replicated once), rest NOGO/INVALID. The through-line: encounters are
clockwork, conversion is energetic, spacing helped once, transmission is
neutral. Licensed frontiers unchanged (sex-conditioned leaving,
detection-sharing, differentiation-first, fear ecology, load-then-recombine
— all need fresh rationale + frozen plans). No RSI claim.
Cumulative program spend: 7959 (+18 ledgered).
