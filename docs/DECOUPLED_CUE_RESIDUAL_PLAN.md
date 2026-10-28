# Decoupled shared and cue-residual offline screen

The earlier active cue residual changed the shared model's training gradient,
including predictions for unobserved cues. Test one fixed decoupling: update
the shared weights using the shared-only factual logistic error, and update
the addressed cue residual using the full shared-plus-residual factual error.
Compute both predictions and both updates on every own example and its
uniform-reservoir replay. Both matched policies retain exactly the same model,
reservoir, recent queue, RNG draws, declared work and encoded state; the
control masks residuals at evaluation while the candidate includes them.
Observed raw cue bits alone address the 16 residual slots. Never supply a
phase, true label, world identity or counterfactual outcome to learning.

Use the exact previously provenance-verified 26,956 factual examples from
the two eight-history, D-survivor corpora. Apply the unchanged offline joint
rule: in each corpus, mean B-at-B log loss must improve in at least 6/8 history
means, and mean A-at-C loss must not increase. Independently reconstruct both
gradients, RNG, stores, ownership, storage and scores. This is an
outcome-informed screen, not a fresh sample or physical intervention. Even a
pass requires priced embodied acquisition on the original benchmark, real
functional-pressure/recovery and strong transfer controls, and fresh audited
qualification. Preserve all prior failures and closed reserves.
