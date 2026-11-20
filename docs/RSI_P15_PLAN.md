# P15 plan: a sip body (frozen before the run)

Design comes from the Fable review (2026-11-16). The taste model has a measured, explained limit. Under threshold decisions a refused food gives no label, so a fly learns only from foods it already accepts. The extreme case is the bias-only fly in P14, with 3–4 tastings per life. P15 changes the body to target this limit directly.

## Body change (opt-in)

When a stopped fly (move −1) refuses food, it takes a **sip**: `sipFraction` = 0.1 of a normal bite from the nearby patches, with the same nutrient or toxin effects (`engine.mjs`, `config.sipFraction`, default 0 = unchanged).

With `sipLabels`, that stationary refusal also produces a taste label from the sip's signed intake (`stationary-taste-credit.mjs`, default off). The 0.1 is fixed now and will not be retuned.

## Exploration (non-bank seeds 98401–98404, 8 histories each)

| Arm | Tastings per founder | Survivors |
|---|---|---|
| S0 | 62–125 | 6.75 |
| SIP | 303–324 | 7.44 |
| SHAM | 53–127 | 6.19 |

- Pairs rules gained +2 to +3 survivors and staircase rules lost about 1.
- This predicts the size gates are **likely to fail**. P15 is run once anyway, as specified.
- The `discrimination` readout was about 0 in every arm. It reads the codebook at the phase-C anchor, which is not informative in the shifting-odor world. G3 therefore uses tastings and reports discrimination without gating on it. This deviates from the review's wording and was decided before the run.

## Design

- **Rules.** 12 fresh embodied rules in the many-odor world (`odorShiftEvery` 32, `nutrientScale` 1). Pairs rules use seeds 2201001–2201006 and staircase rules 2201007–2201012. Odor tables are built as in P14b.
- **Arms.** All use step 4, replays 1 and threshold decisions:
  - **S0**: native body.
  - **SIP**: `sipFraction` 0.1 with `sipLabels`.
  - **SHAM**: `sipFraction` 0.1, no labels (same sips and costs, label discarded).
  - **TRUE**: masks `[0, ...target]`, native body (reference).
- **Histories.** 16 per rule, `makeHistories(2202000+k, 16)`, shared by all arms.
- **Unit and test.** Rule is the unit. Exact one-sided sign-flip test over 12 rules.

## Gates (all must pass)

- **G1:** SIP − S0 survivors, mean ≥ 2 and p < 0.01.
- **G2:** SIP − SHAM survivors, mean ≥ 2 and p < 0.01. This separates information from extra nutrition.
- **G3:** SIP tastings per founder exceed S0's in at least 11 of 12 rules.

**Stopping rule:** this is the last line, run once, pass or fail.

A pass would show that one body change, chosen from a measured limit, raises survival through information. It would not show that learned skill transfers across bodies.

Smoke uses seed offset +500. Runner: `scripts/p15-sip.mjs`. Output: `evidence/p15/run.json`.
