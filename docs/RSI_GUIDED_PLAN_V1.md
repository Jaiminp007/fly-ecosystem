# RSI V4 plan: data-guided improver (written before any V4 run)

Date: 2026-11-12. Script: `scripts/rsi-guided.mjs`.

## Design

- Same level-0 space, worlds and training problems as V2/V3
  (`docs/RSI_SEARCH_RESULTS_V1.md`).
- New operators guidedAdd and guidedReduce. Each picks the Walsh term that
  is most strongly associated with good versus bad taste outcomes in the
  flies' own recorded experience during the incumbent's dev runs (a
  read-only hook; no change to learner state, billing or random draws).
- All improver versions have these operators and the same data. v0 weights
  all 10 operators and all term orders equally.
- Self-revision (gain credit, as in V3) after training problems 2 and 4
  produces v1 and v2. Training budget is 20 per problem.

## Test (fixed before running)

- Two fresh test banks: 990000 with signs as listed, and 995000 with signs
  flipped. Each has 6 rules (masks 4, 8, 6, 9, 10, 12, disjoint from
  training), 3 search seeds and 2 starts (copied best program, identity
  code). Budget 6 evaluations. Final score on 8 held-out histories.
- PASS for gate (b) requires, in EACH bank:
  1. v2 beats v0 in paired comparison: wins > losses, with one-sided sign
     test p < 0.05 (ties dropped);
  2. mean final score v2 > v0 in both starts;
  3. mean v2 > the no-search score of both starts.
- Successive improver revisions (reported, and required for a "two
  successive revisions" claim): pooled over both banks, v1 vs v0
  wins > losses and v2 vs v1 wins >= losses.
- If V4 fails, it is reported as a failure. No rescoring and no reruns of
  these test banks.
