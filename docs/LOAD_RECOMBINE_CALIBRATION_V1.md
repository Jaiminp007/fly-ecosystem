# LOAD-THEN-RECOMBINE CALIBRATION V1 (analytic, zero worlds)

Date: 2026-11-02. Licensed: "load-then-recombine (analytic calibration
first)". Read-only (code audit, no executions, no seeds spent).

## Question

How much load must accumulate for biparental recombination's benefit to be
detectable under program gates (≥+0.1 pooled, n≈24, single attempt)?

## Substrate audit (taste-experiment + engine, read-only)

- Genomic mutation: ABSENT in the taste substrate. `TasteExperiment`
  hardcodes `mutation:false` (world config) and asserts it. All mating/
  turn-gate lines ran mutation:false. The engine HAS mutation
  (`inherit()`: traits ×= exp(normal×.06) w.p. 0.3) but the taste
  experiment disables it. There is no genome in the taste substrate —
  weights are the heritable material.
- Weight noise: `transmissionNoise` (per-newborn Gaussian on copied
  weights, null-default, billed) is the ONLY load-generating mechanism
  available. Used in V1b (maternal + noise? — neutral result).
- Generations: one effective window (founders do most mating; gen-2 thin
  162/336; gen-3 rare 33 rows; no selection differential engineered).

## Calibration math (order-of-magnitude)

1. **Noise load is uncombinable.** Under i.i.d. per-element weight noise,
   uniform crossover (per-element coin) carries exactly one parent's noise
   per element — same variance as maternal copy. Recombination ≈ maternal
   under pure noise (predicts V1c-like null even WITH load). Load alone
   does not license recombination; COMBINABLE variation does.
2. **No variation exists to combine.** Founder weights converge (Levene:
   within>between; intercept sd~0.003 — 10–20× smaller than slope
   variance). All founders learn the SAME solution. Recombination of
   identicals is identity (V1d lesson generalized: copied==fixed).
3. **Gate arithmetic.** Gate needs +0.1 pooled. Combinable variation worth
   0.1 in the founder pool + enough matings to assemble it (~0.05–0.15/
   main observed — too few) + selection to fix it (absent — no
   offspring-success feedback into mating) + multiple generations
   (absent — one window). Every term fails by an order of magnitude.

## Verdict: INFEASIBLE-AS-SPECIFIED

Load-then-recombine cannot work in the taste substrate without TWO missing
mechanisms (each specified for any future line):
- (a) A VARIATION generator: diversifying selection, niche structure, or
  weight-mutation with accumulation (transmissionNoise is i.i.d. per
  newborn — no accumulation, no epistasis to unlock).
- (b) MULTI-GENERATION selection: offspring-success feedback into mating
  plus ≥3-generation windows (gen-3 currently rare-to-absent).
Either mechanism needs its own frozen plan + fresh bank; neither is
licensed by this calibration (analytic only, no worlds, no bank).

## Standing

The mating transmission-mechanism space stays CLOSED (third closure:
V1c null → copyconditional null → this calibration). Recombination is
correctly neutral where tested; where it could matter (multi-generation
loads) the substrate lacks the prerequisites. No RSI implication.
