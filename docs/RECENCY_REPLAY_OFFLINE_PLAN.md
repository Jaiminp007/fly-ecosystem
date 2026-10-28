# Fixed offline two-timescale replay comparison

Use the actual A/B/C tapes of the existing observe arm in both the original
random-codebook development and the additional adjacent-opposed curriculum.
For each corpus, restrict to its own eight-history D survivors. Reconstruct
only own stationary, accepted, odor-present, homogeneous-contact examples
with nonzero own `lastFood`. Feed the identical chronological examples to two
fresh per-founder learners, without feeding phase, codebook or valence labels.
This changes neither physical history nor the prior trained models.

Both learners have an 11-weight logistic taste model, one factual update plus
one replay update per example, the same 32-record reservoir, eight-record
recent queue, four RNG draws, indices, example copies and metered work. The
control always replays the reservoir; the candidate uses the recent candidate
when the shared coin is below one half, otherwise the reservoir candidate.
Use one fixed seed derived from history and founder. Snapshot after each
phase; evaluate balanced A and B cue log loss with evaluator-only codebook
valence. Report all per-founder examples, weights, source hashes, work and
encoded state; no physical-cost or causal claim follows.

The fixed offline screening rule requires, separately in **both** corpora,
lower mean B-at-B log loss and improvement in at least six of eight per-history
means, plus no increase in mean A-at-C log loss versus the control. All eight
histories must be present; no imputation or tuning. Even a pass cannot establish
physical safety, skill acquisition, retention under pressure, original-ecology
transfer or qualification. The original benchmark, all prior failures and
closed reserves remain untouched.
