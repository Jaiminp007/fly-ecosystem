# MATE-SELECTION PLAN V1 — FROZEN (selection on learning where births occur)

Date: 2026-11-03. Status: FROZEN (design only until implemented).
Single authorized bounded world run (disk floor 1 GB; ~5G at freeze).

## Rationale (new question, not a variation)
M-POP asked selection-on-learning where births DON'T occur → void twice
(INVALID-FEASIBLE, lines closed). MATE-ENERGY/INHERIT asked bars and
transmission with learning founders but never contrasted learning itself:
no line has ever run learned vs never-learning founders where births occur.
This plan asks exactly that — substrate substitution after lineage-substrate
infeasibility (M-POP V2's own logic), not a knob re-tune: different arms
(learning variants, transmission OFF for all — isolates SELECTION from
transmission), different bank, feasibility-grade verdict. M2-vehicle
relevance: prerequisite to "does selection retain what lifetime learning
cannot" is whether learning variants differentially reproduce at all.

## Design (frozen)
- Instrument: `scripts/mate-selection-dev.mjs` (new; adapted from
  `mate-inherit-v1b.mjs`, no engine changes). 1 history × 3 arms
  (candidate/frozen/unlearned) = 3 mains, ZERO probes.
- Founder learning (first-class TasteExperiment arms, `taste-experiment.mjs:32-33,73-74,190-191,210`):
  candidate learns throughout; frozen learns phase A only then
  `freezeTasteEnergyBody` (`acquisition=false`); unlearned frozen always.
  Behavior (incl. mating) intact in all arms — only updates gated.
- Common conditions (births-occurring, per V1b): `matingActionRequired:false`,
  `matingEnergyBar:50`, `nutrientOverride:5`, `reproduction:true`,
  `verticalTransmission:'none'` (V1 zeroed precedent — newborns equal,
  selection isolated), BT_TICKS=1792, BT_FOUNDERS, body N, cruise 0.
- Bank: `evidence/mate-selection-dev/fresh-01/` 473001–473009 (1 history × 9),
  verified clean pre-freeze (0 exact whole-word hits evidence + tracked),
  builder re-gates at mint (seed-key-aware evidence walk + exclusions +
  spent list incl. 470001–472054 V1O/C16). First use is the single run.
- Fixtures (new `tests/mate-selection-dev.test.mjs`, green required pre-run):
  bank uniqueness/exclusion, scorer GO/NOGO/INCOMPLETE branches, options
  contrast (arm→acquisition mapping at tick 0, throwaway synthetic seed —
  no bank contact), generation-summarizer parity (v1b import), zero-tick
  wiring (serves as triage-analogue; no worlds pre-run).
- Caps: per-main op cap + aggregate cap (v1b values), per-row wall/CPU caps;
  expected output <5M. `df` pre/post, abort under 1 GB free.
- Single attempt, no rescoring; result published as measured either way.

## Gates (frozen)
- G1: ledger exact (3 mains / 0 probes, 1 per arm).
- G2: config audit (transmission 'none' all arms, bar 50, nutrient 5,
  births integers, generations valid, founder accounting intact).
- Verdict: all-zero births → INCOMPLETE-NOBIRTHS (void, V1 precedent);
  else candidate births > unlearned AND candidate ≥ frozen → GO
  (directional selection-on-learning signal; thin n=1 — licenses
  replication ONLY, claims nothing); else NOGO with stop-rule analogue
  (no auto-escalation; deleterious direction reported).
- Validity diagnostic (descriptive): frozen arm checks broken-control —
  if frozen ≥ 1 while unlearned = 0, unlearned-zero reads as selection
  against never-learners, not broken mating.
- Scope: NO population/learning/RSI/retention claim. Descriptive only:
  gen-2 per arm, gen-1 lifespan per arm.
