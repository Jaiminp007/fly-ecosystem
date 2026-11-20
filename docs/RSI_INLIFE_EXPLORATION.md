# In-life self-revision inside the fly: exploration (no pre-registered test)

Every result here is exploration on non-bank seeds (98001–98004, 98100), so none of it is a pre-registered result. No test was run, because the bound check below showed the effect would be too small to test honestly at this data scale. Fable review consulted (2026-11-16).

## What was built (opt-in)

`tasteProgram.selfRevise = {mode, every, z, cap, evidence, oracle}` in `learning/odor-routed-taste.mjs`. It is null by default; without it, behaviour is unchanged.

During its lifetime, the fly keeps evidence E_m = Σ term_m(odor)·r over its own taste examples. The weight r depends on the evidence mode:

- **residual** (default): target − own prediction before the update.
- **raw**: 2·target − 1.

Every `every` examples, the fly scores the one-bit extensions of its current masks. If the best extension has |E| > z·√Σr², the fly adds a mask, according to the mode:

| Mode | Mask added |
|---|---|
| `evid` | the best extension (the move the offline system invented, now run by the fly on itself) |
| `random` | a random extension, added at the same times (matched sham) |
| `oracle` | the next true term (bound check only) |

A new mask's weight starts at 0, and records already in replay memory gain the new feature. The work is billed in scalar operations.

## Findings

Setup: many-odor world (shift 32), 4 rules (2 pairs, 2 staircase) × 8 histories, energy per founder.

| Arm | Mean energy |
|---|---|
| S0 (no revision) | −52.35 |
| SELF (raw evidence, every 8, z 2) | −52.59 |
| SHAM | −52.39 |
| ORACLE-add at SELF's times | −49.92 (+2.43 over S0) |
| True terms from birth | −45.71 (+6.64) |

- **Other SELF configs.** Residual evidence at z 1.5–2 with every 4, or raw evidence at z 2.5, gave SELF − S0 between +0.3 and +1.0, with SHAM about −0.3. Run-to-run chaos is about ±1: adding 29 billed operations per example shifted one config by 1.2.
- **Diagnosis.**
  - Raw evidence makes false additions. Taking the maximum over ~28 candidates on few examples passes the threshold too often. The evidence is also selection-biased, because 86% of tasted foods are good.
  - Residual evidence at z 3 almost never fires, since flies get only about 10–40 examples.
- **Bound.** Even perfect discovery at these times gains only +2.4: a term added late has few examples left to pay off.
- **No useful prior.** An inherited prior over candidates cannot narrow the choice, because each rule uses random odor bits.
- **No dose-response through longer lives.** Making lives longer does not give more data. At 2× and 4× phase length, all flies die (energy at the −65 floor), and tastings per founder stay at about 85–95 against about 83 at 1×.

## Conclusion

In this world, in-life self-revision is **data-limited**. The fly does not taste enough foods within a lifetime to discover structure reliably, and even perfect discovery pays little. A meaningful in-life test would need a world where flies taste many more foods per lifetime. The decision below explains why that route was not taken.

## Decision: stop this line (Fable review, 2026-11-16)

The oracle-add bound is +2.43 of the +6.64 available from birth. That falls between the stop rule set in advance (under +2) and the continue rule (+3 or more), so the facts about discovery decide it.

Two limits are named:

1. **Too few examples.** About 33 examples per lifetime cannot pick a true term out of 28 candidates.
2. **Too late to pay off.** A term added mid-life has too few examples left to learn its weight.

Three routes are closed:

- **An inherited prior.** The relevant bits are random per rule, so a prior cannot narrow the candidates.
- **Longer lives.** All flies die before they reach more examples.
- **Lineage pooling.** Flies do not reproduce within a run.

Even a third of the ceiling (+0.8) would need over 100 rules to test at the measured noise.

A dose-response with a changed energy balance was considered and not recommended, for two reasons:

- It would be a third world change, and it would change the outcome scale.
- Its answer is predictable (feature selection works once there are enough samples), so it adds little to P8–P10.

If in-life RSI becomes a goal of its own, it should be a separate line with its own stopping rule. The VISION RSI row stays "met in bounded form" (offline improvement).
