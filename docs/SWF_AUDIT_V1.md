# SWF AUDIT V1: no verdict flips between total and average gen-2 (16/16 robust)

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Recomputes every published mating-arc arm comparison under AVERAGES
(totGen-2/totBirths) and locates any critical level c* where
CL(c) = totG2 − c·totBirths would flip the verdict (Parfit/Blackorby).
Script: `scripts/swf-audit.py` (68 bank×arm groups, frozen rows).

## Findings

1. **Zero flips in 16/16 published comparisons.** Every direction under
   totals holds under averages (hub>spread, duo>both, hubLeave>hub,
   maternal>copy*, enriched>control, exact/mutant splits, hub>
   hubDisperse, hub≈hubAttract, hub≈hubRecombine).
2. **No finite c* exists for any decisive pair.** Where totals differ,
   averages agree in sign — so NO critical level flips any verdict.
   The mating arc is SWF-invariant (total, average, and every
   critical-level rule agree). Repugnant-conclusion pressure: absent
   (rates 0.03–0.24 move WITH totals — births don't vary enough
   between arms to decouple the two).
3. **Ties tilt trivially, verdicts stand.** Three dTot=0 ties lean
   slightly under averages (copybest 0.037>0.034; hubRecombine
   0.114>0.105; hub 0.097>0.083 over L2) — all published as tie/neutral,
   all within noise; no claimed direction threatened.
4. **Counting-definition caveat (honest):** audit gen-2 =
   generations.byGeneration.2 tallies; published verdicts use
   lineage-verified counts (±1 in RECOMBINE hub 4v4 vs 5v4, ML2 hub/L2
   3v3 vs 4v4). Directions agree under both countings; the caveat
   changes no sign.

## Verdict (measurement — no GO/NOGO)

- **LICENSED:** total-gen-2 verdicts as stated; welfare-function
  objections closed for this arc (no SWF in {total, average,
  critical-level} reverses any comparison).
- **NOT LICENSED:** cross-bank welfare comparisons (rates are
  within-bank descriptive; banks differ in food/topology/bars —
  averages across banks would confound engagement with conversion).
- No bank, instrument, or verdict rescored. Cumulative worlds unchanged.
