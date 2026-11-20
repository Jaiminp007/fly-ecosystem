# 03. Taste-program search line, V1–V4 (2026-11-11 to 11-12)

The substrate is shared with V5–V7.

- **Level 0** is the fly's taste learner, written as a program
  `{taste code, step, replays, ...}`. The taste code is a set of Walsh terms
  over a 4-bit odor cue. Changing the code changes which odors share learned
  information.
- **The score** is the surviving flies' own taste discrimination, measured
  in embodied worlds with 24 flies.
- **The evaluator** is `learning/taste-program-eval.mjs`.

## V1: bounded self-improving search (`docs/RSI_SEARCH_RESULTS_V1.md`, `scripts/rsi-search.mjs`)

- The level-1 proposer holds mutation weights and rewrites them from its own
  accept/reject record.
- **Gate (a), successive revisions: met.** It made two confirmed revisions,
  step 0.5 → 4 (+0.178) and pairwise → identity code (+0.075). It
  rediscovered the identity code without being told.
- **Gate (b), better subsequent search: not met.** Copying the best program
  (0.461) beat both the fixed proposer (0.329) and the revised one (0.387).
- **Gate (c), embodied benefit: weak.** Skill went from 0.432 to 0.614
  (31/1 histories), but the survival edge was p ≈ 0.07.
- **Diagnosis:** the landscape has one dominant direction, so the space does
  not compound.

## V2/V3: composable codes and odor-chemistry worlds (same doc, "Follow-up"; `scripts/rsi-compose.mjs`)

- The code can be any subset of the 16 Walsh terms. The worlds hide a
  product rule over the cue bits. A matched code scores about 0.68, the full
  code about 0.50, and a wrong sparse code about 0.
- **Gate (a): met again.** Compositions kept producing accepts.
- **Gate (b): not met.** V2 showed a small 7–3 edge. V3 changed the credit
  rule after seeing V2, used fresh banks, and got 10–9, so the edge did not
  replicate.
- **Diagnosis:**
  - There is too little signal (about 40 proposals per revision).
  - Operator statistics cannot find which 1 of 15 terms matters. The
    improver needs to propose from data (the flies' own experience).

## V4: data-guided search (`docs/RSI_GUIDED_PLAN_V1.md` → `RSI_GUIDED_RESULTS_V1.md`, `scripts/rsi-guided.mjs`)

- Ten operators were hand-written, including `guidedReduce`, which shrinks
  the code to the term the flies' recorded taste experience points to (via
  a read-only experience hook).
- The improver reweighted itself: the `guidedReduce` weight went 1 → 2.97 →
  4.37.
- **Gate (b): passed in both fresh banks.**
  - v2 vs v0: 26–0 (p = 1.5e-8) and 20–4 (p = 7.7e-4).
  - Successive revisions: v1 > v0 29–10, and v2 > v1 22–0.
- **Embodied energy:** v2 beat v0 in 49/50 pairs.
- **Honest scope, which is why it is not RSI:**
  - The operator menu, including the winning guided move, was hand-written.
  - The update rule was fixed.
  - The test stayed within the same world family.
  - All flies survive these short worlds.
- VISION briefly said "RSI met" on the strength of V4. The user rejected
  that, and it was reverted.
