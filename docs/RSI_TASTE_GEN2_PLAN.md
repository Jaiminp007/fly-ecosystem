# RSI gen2 plan (frozen): transfer-safe progress subspace

Lesson from gen1 (`RSI_TASTE_GEN1_EVAL.md`): td/hold1 buys search score but
breaks the transfer floor on fresh seeds (−1.12) and fails A-retention there.
Gen0's `progress` family ties transfer everywhere tested. Gen2 therefore stays
inside the transfer-safe family — `motorRule=progress, hold=1` fixed — and
searches the interaction that A2 never combined:

* `feedingRule ∈ {matching, greedy}` × `taste ∈ {pairwise, orthogonal}` ×
  `cruiseSpeed ∈ {0,1}` × `tasteRate ∈ {0.1, 1}` = 16 configs.
* Gen0 = greedy/orthogonal/c0/t1. A2 tested 3 of the other 15
  (feeding-matching, taste-pairwise, cruise1, tasterate01 — 4 actually, all
  singletons). Untested: the 11 remaining, especially pairwise+cruise1,
  matching+cruise1, pairwise+matching combos that each fixed A alone on v2-search.
* Hypothesis (falsifiable): an interaction (e.g. pairwise+cruise1 under
  progress) jointly holds A-retention and the transfer tie where singletons
  did not. If none does under matched budget, close the progress-subspace line.

Rules unchanged: new search bank v3 + new gen2-eval bank (no reuse of
`83fb6bd4…`, `6cf32614…`, `f0d44a06…` or any prior bank); ≤96 worlds/procedure
(6 proposals × 16 worlds); fresh 8-history full eval with v2 gates + world-cap
for any claimant; copy control and ≥2-successive + productivity thresholds for
any RSI claim. Gen1 failure stands; 0/2 accepts.

Step 1 here: freeze plan, create `search-20261029-v3`, baseline Gen0 (16 worlds).
Proposals (A greedy singletons-first-then-pairs / B random 6) next turn.
