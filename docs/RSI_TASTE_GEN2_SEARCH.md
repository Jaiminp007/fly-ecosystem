# RSI gen2 search (progress subspace, v3 bank) — no claimant

Bank: `search-20261029-v3` (`d90bdddf…`), 16 worlds/proposal. Gen0 line 4.995.

## A3 greedy (96 worlds)

Singletons (Hamming-1 of Gen0):
* feeding-matching 2.551 (A-false/B-true); pairwise 3.758 (A-true/B-true);
  cruise1 1.845 (A-true/B-false); rate01 1.116 (A-false/B-true).
Pairs of most promising (pairwise, the only dual-true singleton):
* pairwise+cruise1 0.769 (A-false/B-false); pairwise+matching 1.223 (A-true/B-true,
  lifetime too low).
Best 3.758 < Gen0 4.995. No claimant. Notably, pairwise alone holds both
retentions descriptively on this bank but gives up −1.2 lifetime — a retention
gain that fails the lifetime leg, hence not a revision under the joint gates.

## B3 random (seed 1420247616, 96 worlds)

6 draws from the 9 remaining subspace configs: best 0.685
(matching/orth/c1/t1); rest 0.09/0.13/0.55/0.20/−0.02. No claimant.

## Round verdict

No claimant either side → no fresh eval (nothing warrants spending 48 eval
worlds). Progress-subspace interaction hypothesis falsified under matched
budget on this bank. Gen1 (td) failed fresh eval; gen2 fails to propose.
Successive acceptances: 0/2. Cumulative RSI: prior 512 + 96 + 96 = **704 worlds**.

Evidence: `evidence/rsi-taste-v1/search-20261029-v3/{gen0-search4,a3-*,b3-*}/`.
Next: either amendment v3 opening a new dimension (e.g. memory capacity/replay
or motor granularity via code change, with costs charged) on fresh banks, or
suspend revision attempts with Gen0 as the unrevised qualified base. No RSI.
