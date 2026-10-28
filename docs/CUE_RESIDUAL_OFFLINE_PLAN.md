# Fixed cue-residual factual replay screen

The recent-replay screen gained B accuracy at the expense of A accuracy. Test
one representation change rather than tuning that mixture: retain the shared
11-feature taste model and add one learned residual for each of the 16 raw
four-bit cues. The cue index is computed only from the body's observed cue;
there is no family clock, hidden valence or oracle. Each factual update and its
uniform-reservoir replay update the shared and addressed residual weights.

Both compared learners allocate, retain, compute, update and pay for the same
16 residuals, factual reservoir, eight-entry recent queue, four RNG draws and
two gradient updates per example. The shared-only control computes and trains
shadow residuals but masks their contribution to the predicted logit; the
candidate includes its own cue residual. Both start at zero, receive identical
own examples, and use a fixed step size and bounded weights. Count encoded
bytes and declared work equally; inference must also be priced before any
physical deployment. Neither variant receives phase metadata.

Apply the same preregistered offline screen as the earlier replay comparison:
separately for the original and adjacent-conflict corpora, require a lower mean
B-at-B log loss in at least six of eight per-history means and no increase in
mean A-at-C log loss relative to the matched control. Missing histories fail.
Evaluate only using the previous provenance-verified factual own examples and
evaluator-only codebook labels, with independent update, RNG, storage and score
reconstruction. These corpora share seeds and are outcome-selected. A pass is
not physical causality or qualification: a paid embodied study must still pass
all original skill, functional-pressure, recovery, transfer and fresh gates.
