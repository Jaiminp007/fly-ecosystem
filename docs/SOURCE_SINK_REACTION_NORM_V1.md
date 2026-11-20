# Source-sink, reaction-norm & Levene measurement (analytic-only, zero worlds)

Date: 2026-11-02. Sources: frozen rows/dev-results from 8 mating banks
(encounter 01–03, attract 04–05, leave 01–02, recombine 01; 126 mains)
+ frozen flip-splits from 7 turn-gate banks (attempts 04–10; 21 pairs).
No new executions, no rescoring, no verdict changes.

## 1. Hubs are sinks, spread is (weakly) source (R106 Pulliam test)

Per-capita B−D by arm (births minus deaths over starting founders):

- Hub arms: ALL 8 negative (−0.04 to −0.31). Every hub in every bank is
  a demographic sink: more deaths than births, sustained only because
  runs end at tick 1792, not by self-replacement.
- Spread arms: positive or break-even in 6/7 banks (+0.03 to +0.13;
  attract-04 −0.01). Weak sources.
- Duo: +0.10 (source). All taxis/leave/recombine variants: sinks
  (manipulations never flip the sign).
- Attractive-sink diagnosis (Battin/Kokko): hubs attract (food gradients,
  mates) AND kill (starvation) — preference decoupled from fitness, with
  no selection across runs to evolve avoidance (R106). The V3 "trap"
  language is now quantitative: sink status is the mechanism, starvation
  the currency, persistence the puzzle (populations compound gen-2+
  while shrinking — compounding is lineage depth, not growth).

## 2. Reaction norms: no intercept variation, all slope variation (R108 Dingemanse)

Per-pair same-val (intercept) vs flipped (transfer) correctness, 9 bank-arms:

- Same-val sd: 0.0018–0.0056 (all pairs 0.94–0.96 — no intercept variation).
- Flipped sd: 0.020–0.113 (0.45–0.81 — 10–20× the intercept variance).
- Slope (flipped−same) sd 0.02–0.11, means −0.24 to −0.44.
Dingemanse reading: histories do NOT differ in capacity (intercepts
identical) — they differ purely in plasticity (slopes). "Retained distinct
skills" is not about how much is retained (all retain ~0.95) but about
how steeply each history's transfer decays — and that steepness varies
widely and stably. Koolhaas gloss (descriptive): steep-slope pairs are
reactive (context-bound), shallow-slope pairs proactive (portable);
the program never selected on this axis.

## 3. Levene: variation lives WITHIN banks, not between them (R107)

Bank-mean flipped correctness (uniform/exact arms, 7 banks): 0.533–0.624,
between-bank sd = 0.026 vs typical within-bank sd ≈ 0.04 (up to 0.09).
Banks do not diverge: the same distribution reappears every bank.
Polymorphism is maintained within banks and erased between them — the
opposite of bank-level adaptation. Two lifts, two signatures: gain
(att-09G) lifts the mean (0.667) but SPREADS pairs (sd 0.113); lossy
(att-10L) lifts the mean (0.665) UNIFORMLY (sd 0.029). Same headline,
different variance — lossy is the egalitarian lift, gain the elitist one
(pair 414028 gains +0.10 while 414046 stalls, vs lossy +0.08/+0.17/+0.14
evenly). Unlicensed reading (descriptive): uniform lifts generalize,
skewed lifts concentrate.

## Licensed / not licensed

- LICENSED: nothing new (measurement + three pre-registered readings
  confirmed/cashed: attractive sink, pure-plasticity variation,
  within-bank polymorphism).
- NOT LICENSED: any intervention (source-sink reversal needs dispersal
  rates; slope selection needs a slope knob; bank-divergence needs a
  reason banks should differ — all specified-not-executed).
- Zero worlds spent. Cumulative unchanged (7941).
