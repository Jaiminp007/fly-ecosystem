# Factual delayed-return diagnostic

The learned motor's actual one-step budget reward favors smaller losses for
stationary actions away from contact, while the fixed full-speed transfer
intervention improves the observed frozen-current forks. Neither result proves
that longer credit assignment will learn a better policy.

On the same eight already-recorded learned-acquisition histories, compute each
founder's factual 16-transition discounted budget-energy return beginning at
each actual decision. Use the existing discount `exp(-1/256)` and each next own
decision's budget energy, not physical fork outcomes or other founders' data.
Include terminal energy/debt on death and truncate there; censor a final
nonterminal window without its full 16 transitions. The horizon is fixed before
the calculation: source physics turns by at most 0.28 radians per step and
travels at `speed*0.1`; 16 steps covers more than a half-turn and several
food-radius travel steps at typical speed. This is not a horizon sweep.

Group by initial A/B/C phase, initial executed speed and initial pre-action
contact. Flag windows crossing phase boundaries and report each history as well
as pooled counts. Future actions within each window remain the actual actions
the body took, so the return is an on-policy trajectory description, not an
estimate of holding the first speed for 16 steps or of a counterfactual action.
Different actions occur in different states and bodies; differences in means
are not causal. Verify tape/source hashes and independently reconstruct the
results. No training, future-label leakage, qualification or closed reserve is
permitted in this diagnostic.
