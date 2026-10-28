# Feeding context: one fixed state-sufficiency diagnostic

October 26, 2026. The failed three-speed acquisition fixes actual action support,
but its motor sees neither cue identity nor the contemporaneous learned feeding
propensity. The same food/contact vector can therefore represent food that the
body usually accepts or usually refuses. This is an observable potential source
of state aliasing, not yet a demonstrated cause of transfer failure.

Before another policy revision, use ONLY the frozen v1 candidate acquisition
and current frozen transfer tapes from the eight reused histories. Fit three
separate per-founder action-conditioned one-step own-energy predictors online
on actual A/B transitions (tick <=1024), then freeze. Evaluate C and transfer
without updates or any transfer outcome used for fitting. Never borrow another
founder's data or a control/fork outcome. No fresh qualification seeds.

The target is the same executed speed's own budget-energy difference /120,
observed at the next pre-action decision or a terminal observation. Omit the
last nonterminal decision if there is no next observation. No receipt-label
oracle, phase identity, hidden patch, counterfactual reward, or actual sampled
acceptance bit enters. The logged feed propensity is available before physical
execution and depends on lawful current cue and previously acquired taste.

Models, fixed in advance:

- raw: the current 13 motor features.
- context: those 13 plus each times (2*currentFeedProbability-1).
- delayed: the same 26 dimensions but the preceding own decision's propensity;
  initialize the delayed propensity to .725 (the initial odor-present prior).

Three independent action heads start at zero. On each own A/B label apply
normalized SGD with rate .1, denominator 1+sum(phi^2), weights clipped to [-8,8].
No replay, trace, adaptation, early stopping, hyperparameter or feature search.
For the transfer fork, restore the predictor trained on A/B (not a C-adapted
model); initialize delayed context with the body's actual last acquisition
propensity. Count arithmetic and record final parameter bytes, but this offline
test is not an embodied energy gain or proof of affordable on-policy behavior.

Record matched predictions, true own targets, features/action/tick provenance,
per-history squared errors, source hashes and input hashes. The fixed descriptive
information gate requires lower mean MSE and at least6/8 improved histories
versus BOTH raw and delayed on EACH held-out C and transfer. Report transitions
and mortality; empty histories cannot count as wins. Freeze all evaluation
weights and verify frozen-state equality before/after scoring.

Even a pass is predictive information only. A richer lawful motor state would
still need a prospective physically billed own-action learning comparison.
Failure closes this specific feeding-propensity feature hypothesis, without
proving all motor observations sufficient or tuning on the evaluation labels.
