# P1 plan: does taste skill change energy and survival? (committed before the run)

Date: 2026-11-14. This is step P1 of the independent review
([fable-review/FABLE_REVIEW.md](fable-review/FABLE_REVIEW.md), finding H4).
Script: `scripts/p1-skill-matters.mjs`.

## Why

In the RSI worlds, a fly with no taste discrimination got the same energy
and survival as one with the correct code. No RSI design can show an
embodied benefit until taste skill matters.

## Code change (opt-in, defaults unchanged)

- `engine.mjs` gains two settings, both defaulting to 1:
  - `toxinScale` multiplies the damage from eating bad food;
  - `nutrientScale` multiplies food regrowth.
- `learning/taste-program-eval.mjs` accepts both as world options.
- Finding M4 is fixed: a world with no surviving phase-C anchor now returns
  `discrimination: 0` instead of omitting the field, which caused NaN.

## Design

- **Worlds:** default long phases (512/512/512/256), 24 flies.
- **Rules:** balanced only, so every family can hold both classes.
  - Factorial bank (992001–992004): s3+, AND(0,1)−, OR(2,3)+, s12−.
  - Confirmation bank (993001–993004): s5−, AND(1,3)+, OR(0,2)−, s10+.
  - Each bank has 4 histories per rule, so 16 paired histories.
- **Codes** (all with step 4 and replays 1):
  - bias-only: `[0]`;
  - identity: all 16 Walsh terms;
  - correct: the bias plus exactly the rule's terms.
- **Factorial:** 8 settings.
  - taste decision: sampled (default, with an acceptance floor of 0.05 to
    0.95) or `threshold` (deterministic);
  - `toxinScale`: 1 or 3;
  - `nutrientScale`: 1 or 0.5.

## Selection (factorial, dev bank)

1. A setting **qualifies** if correct beats bias-only on both survivors and
   energy. Each comparison needs wins > losses over 16 paired histories and
   a one-sided sign-test p < 0.05.
2. Among qualifying settings, choose the one with the largest correct − bias
   survivor difference. Break ties on energy.
3. If no setting qualifies, the gate fails, and the confirmation is not run.

## Gate (confirmation, fresh bank, chosen setting only)

**Pass** requires correct vs bias-only, paired by history over 16
histories, to show:

- survivors: wins > losses, one-sided sign test p < 0.01, higher mean;
- energy per founder: the same.

The identity code's place between the two is reported, not gated.

**If the gate fails:** the taste channel cannot carry an embodied benefit
in this design. The taste-program RSI line stops, as the review recommends,
and nothing further is run on it.

**If it passes:** the chosen setting becomes the world for the next RSI
plan, with energy per founder as the objective. That RSI plan (review step
P2) will be written and committed separately, and the user approves it
before it runs.
