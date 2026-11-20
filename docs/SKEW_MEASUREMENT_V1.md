# SKEW MEASUREMENT V1: who reproduces is egalitarian — the constraint is event count, not allocation

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Executes the R119-specified skew formalization on frozen rows.
Script: `scripts/skew-measurement.py` (analysis RNG only; spends nothing).

## Question

Reproductive-skew theory (Vehrencamp transactional/concessions vs
Keller–Reeve vs Reeve–Ratnieks tug-of-war, Johnstone synthesis; R119)
asks how reproduction is divided among group members. Our mating arc
counted gen-2 (the product) but never fitted the division (the process).
This measurement fits it: Nonacs' B index per row over founders.

## Method (frozen)

- 324 rows with `founderOffspring` tallies across 8 instruments / 14
  banks: encounter (3 attempts), attract (5), leave (2), social (2),
  proximity (3), informed, recombine, disperse.
- Semantics verified in code (`learning/taste-experiment.mjs:67`): each
  newborn's every parent id gets +1 — maternal+paternal combined;
  absent key = 0; sum over founders = 2×births. Sex roles merged
  (caveat below).
- Per row, founders only (ids 1..N, N=24 uniform — dense arms excluded,
  they predate the counter): K_f attributions, p_i shares,
  B = Σ(p_i−1/N)² − (1−1/N)/K_f, Monte-Carlo p (20k multinomial sims),
  max share, zeros fraction. Descendant (gen-1 parent) attributions
  excluded from B, reported separately. K_f=0 rows: none (all 324
  reproduced at least once at founder level).

## Findings

1. **No detectable skew anywhere.** Median B per (bank, arm) sits in
   [−0.037, +0.024] — centered on zero; median Monte-Carlo p 0.26–0.99;
   significant (p<0.05) in ~5/324 rows, i.e. at the false-positive rate.
   Reproduction is statistically indistinguishable from dealing K≈10
   attributions to 24 founders at random.
2. **The zeros are extensive-margin, not despotism.** Median zeros
   fraction 0.48–0.75: most founders never parent — but at median K=10
   over N=24, ~60% zeros is the binomial expectation, and B≈0 says the
   non-zero mass is unconcentrated (median max share 0.12–0.25). The
   action is mate-vs-not (encounter bottleneck, R88), not how-many.
3. **Hub−spread diff is a ripple on a floor.** Paired same-seed
   hub-minus-spread B: median +0.0122, 43/59 positive — directionally
   despotic, substantively nil (both arms ≈ 0). Hubs starve subordinates
   (energetic despotism, mortality round) without monopolizing
   reproduction (no reproductive despotism).
4. **Exit option does not change skew.** Leave-knob minus hub paired
   diffs: +0.0003 (ML1), +0.005/​+0.008/−0.003 (ML2 ladder) — null, as
   expected at floor: the knob cannot flatten what is already flat.
5. **Copying does not change WHO reproduces.** Copy-minus-maternal
   paired diffs: +0.0005 (copybest), +0.0000 (copyalways), +0.0014
   (copycond) — third independent null on the copy rule (same
   history/lineage, V1; same gen-2, V2; same skew, here).
6. **Under-dispersion, not monopoly.** B leans negative (more even than
   chance): each mating event involves two distinct parents and repeat
   matings by the same founder are rare — monogamy-ish per event.
7. **Compounding is shallow.** 7.8% of all attributions go to gen-1
   (descendant) parents — the gen-2 bottleneck in one number.

## Verdict (measurement, not intervention — no GO/NOGO)

- **LICENSED:** skew is at floor across the whole mating arc; allocation-
  side knobs (copy rules, recombination, dispersal, leaving) are inert
  because there is almost no reproductive output to contest. The binding
  constraint is EVENT COUNT (K≈10/run), which only encounter-rate
  instruments (topology/attraction) move.
- **NOT LICENSED:** any claim of reproductive monopoly/despotism, or
  that hub poor performance runs through skewed parentage. Hub harm is
  energetic (starvation), not genetic (monopoly).
- **UNTESTABLE as designed:** the transactional vs tug-of-war
  discriminator (voluntary staying/leaving against outside options).
  Founders cannot emigrate as adults; DISPERSE scattered newborns, not
  adults; the leave knob gates departure effort, not emigration with an
  outside-option payoff. A genuine test needs an adult-emigration knob
  with a measurable outside option — specified, not built.
- **Logging gap (blocks per-sex skew):** `founderOffspring` merges
  mother+father roles. Male (mating-success variance) vs female
  (fecundity variance) skew is uncomputable until the birth path logs
  role per attribution — specified as a one-line instrumentation change
  for any future mating line, no behavior change.

Cumulative worlds unchanged (analytic only). No bank, instrument, or
verdict rescored.
