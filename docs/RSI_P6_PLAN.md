# RSI P6 plan: invented moves, a revised update rule, an unseen rule family (frozen before any bank run)

Date: 2026-11-15. P5 passed the narrow RSI gate: a learned move order over 18 hand-written moves, on a surrogate evaluator, with additive steps ([RSI_P5_RESULTS.md](RSI_P5_RESULTS.md)). The user then asked to keep going until the VISION RSI milestone is met.

P6 tests the three things the project's own stronger bar requires ([RSI_V5_PLAN.md](RSI_V5_PLAN.md)):

1. invented moves;
2. a revised update rule (level 2);
3. transfer to an unseen world family.

It uses V7's audit lesson: **the trained library is the unit of evidence**, not the search row.

## Fixed labels (any writeup must keep them)

- **Surrogate evaluator.** It is the P5 surrogate (`scripts/rsi-p6-lib.mjs`, copied from `rsi-p5-lib.mjs`), not the embodied simulation. One change: valence reads `problem.terms`, and rule seeds are hashed before use. The hashing fixes P5's sign skew.
- **Constructed tasks.**
- **Primitive genes are hand-written.** The system invents *combinations* of genes. It does not invent primitives.
- **The level-2 optimiser is a fixed hill climber.** Nothing revises it.

## Levels

- **Level 0.** The fly's taste program `{masks, step, replays}` over 8 odor bits. S0 is the constant term plus 8 single bits, step 4, replays 1. Search budget is 18. The accept rule is the same as P2–P5.
- **Level 1.** A library of moves. Each move is one gene combination:
  - action ∈ {extend, remove, keepOnly};
  - rank ∈ {evid, weak, random};
  - k ∈ {1, 2, 3, 4}.

  That makes 36 term moves, plus 4 knob moves.
  - **Seed library:** only the blind moves extend/random/1, remove/random/1 and keepOnly/random/1, plus the 4 knob moves. No evidence-guided move is given.
  - **Training:** with probability ρ per proposal, the library invents a move by mutating one gene of its best term move. Otherwise it picks by Thompson sampling, with scale `explore`, over the library.
  - **Credit:** each proposal's dev gain is credited to the move, as the raw gain or as max(gain, 0). The posterior mean is sum/(n+N0).
  - **Evaluation:** the frozen library orders moves by posterior mean.
- **Update rule U.** U = {N0, ρ, credit, explore}, with U0 = {1, 0.25, gain, 1}.
- **Level 2.** A hill climber over U with 6 proposals. Each proposal changes one parameter, drawn from
  - N0 ∈ {.5, 1, 2, 4};
  - ρ ∈ {.1, .25, .5};
  - credit ∈ {gain, positive};
  - explore ∈ {.5, 1, 2}.

  Each candidate trains 6 libraries, with library k on staircase rules 1101000+10k+i and training seed k. They are validated frozen on 6 staircase validation rules (1102001–1102006). A proposal is accepted if its mean is higher and per-library wins > losses against the incumbent. The final incumbent is U\*.

## Test (12 libraries; each library is one paired unit)

- **Libraries.** Library k (k = 1..12) trains on staircase rules 1105000+10k+i (i = 0..5) with training seed k. Four arms share those rules and seeds:
  - **U\***: trained with U\*;
  - **U0**: trained with U0;
  - **noInv**: trained with U0 and invention off (ρ = 0);
  - **L0**: the untrained seed library, uniform order.
- **Unseen family.** The test rules are "pairs": a majority of three disjoint pairwise products, sign·sgn(T_ab + T_cd + T_ef), 12 rules with seeds 1104001–1104012. That structure (no single-bit term, three equal-weight order-2 terms) is never seen in training or validation.
- **Score.** Each arm's score per library is the mean final score over the 12 test rules (8 held-out histories each).
- **Statistics.** Each comparison is a set of 12 per-library differences. The test is an exact one-sided sign-flip test.

**Criteria. All three must pass:**

- **C1, the update rule is revised and the revision helps:** U\* ≠ U0, and U\* − U0 has mean > 0 with p < 0.05.
- **C2, the system generates its own useful moves:**
  - the top-ranked term move of the U0 library is an invented move in ≥ 8/12 libraries;
  - U0 − noInv has mean ≥ 1.0 with p < 0.01.
- **C3, the gain carries over to an unseen kind of world:**
  - U\* − L0 has mean ≥ 1.0 with p < 0.01 on the pairs family;
  - the mean U0 score is above the no-search S0 score.
- **Reported, not gated:** U\* − L0 on 6 fresh staircase rules (1106001–1106006); which moves were invented; U\*.

## Exploration disclosed (non-bank seeds)

- **Seeds used:** pairs headroom 80000–80002 (histories 5–7); trial libraries 81010–81045; trial test sets 82000–82005 and 83000–83005; smoke runs offset +500.
- **Pairs headroom** (S0 → S0 + the target terms): 15.0 → 31.1, 9.7 → 26.1 and 3.0 → 20.9.
- **Four trial libraries on pairs:**

  | Arm | Score range |
  |---|---|
  | Invention | 29.3–37.9 |
  | No invention | 20.6–23.7 |
  | Seed library | 18.1–20.8 |

  The invention libraries' top moves included extend/evid/2 and extend/evid/4, which were invented. No level-2 run was made on non-smoke seeds before freezing.

There are no reruns, no criterion changes and no rescoring. Failures are reported as failures.

Runner: `scripts/rsi-p6.mjs level2`, then `scripts/rsi-p6.mjs test`. Outputs go to `evidence/rsi-p6/`.
