# Embodied-kernel feasibility V1: INFEASIBLE-AS-PORT (zero new worlds)

Read-only interface comparison. Question from `docs/ALGORITHM_UPGRADE.md`
("Next goal requirements"): install the accepted RBF-gradient kernel in a
live fly; test for better physical choices; qualify action/survival.

## The two sides (as built, no modifications)

- **Kernel learner** (`learning/kernel-learner.mjs`, accepted program
  `{kernel:'rbf',update:'gradient'}`): scalar FORECAST (MSE on windows);
  inputs |v|≤1, dims ≤128 (used at 20); targets |t|≤1 (throws otherwise);
  ≤256 records; per-update cost O(records×dims) kernel evals; state =
  {records, coefficients, inverse?, program} (no World import).
- **Fly controller** (`learning/tick-actor-critic.mjs`, 161 fixed params):
  4 action-logits + critic value (policy, not forecast); 33-dim inputs
  (raw 17 + odor 16); eligibility traces; per-op billing + energy charge;
  checkpoint/transplant schema = flat 161-vector (tick-AC) or keyed
  taste/actor/critic arrays (taste-energy); ~O(161) fixed cost per update.

## Six mismatches (each sufficient to refuse a direct port)

1. **Arity/semantics**: 1 scalar forecast vs 4 logits + value. A forecaster
   is not a controller (the upgrade doc itself: "measures forecasting,
   not chosen-action quality or survival").
2. **Dims/bounds**: 20-dim |v|≤1 (throws otherwise) vs 33-dim tick features.
   Needs a projection/clamp adapter (new behavior, new code).
3. **Cost class**: O(records) growing per-update vs O(161) fixed. Budget
   re-analysis required (BT_MAIN_OP_CAP, energy charge) — not done here.
4. **State schema**: {records, coefficients, inverse} vs weights-arrays.
   Checkpoint/restore/lineage/transplant machinery would need extension.
5. **Validation-throws**: kernel `inputs()` throws on out-of-range; the
   fly's observations are not certified |v|≤1 (adapter or proof needed).
6. **Category**: installing a forecaster as a controller changes the
   algorithm (new learner track), not a port of the accepted revision.

## Verdict: INFEASIBLE-AS-PORT

Feasible only as a NEW learner track (forecast→policy adapter + schema
extensions + budget analysis + its own frozen gates) — new-line scope
comparable to building a dev line, not a qualification step. Flagged as
future work; NOT licensed here (no frozen plan, no bank, no code).

## RSI-paragraph ledger (sharpened, all ledgered)

- Search productivity: FAILED (fixed gate; `docs/RECURSIVE_SEARCH.md`,
  224 fresh worlds, self == static, fixed wins 1 history).
- Repeated beneficial revisions: revisions occurred (14/16 selecting,
  32.81%/21.24% MSE cuts on a new bank) WITHOUT recursive advantage
  (the revisions don't establish the modifier improves search).
- Embodied benefit: UNTESTED; this note finds it infeasible-as-port.
- The open core is therefore narrow and named: embodied coupling via a
  new learner track, or a new-rationale second-revision design. Everything
  else in the paragraph is negative, published, and closed.
