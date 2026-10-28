# RSI search wave B2 (wider menu, random control) — no claimant

Plan: amendment v2 (`RSI_TASTE_PLAN_AMENDMENT_V2.md`). Same bank as A2:
`search-20261028-v2` (`6cf32614…`), 4 histories × 4 arms = 16 worlds/proposal.
Gen0 start line 5.606. 6 draws without replacement from the 105 valid configs
not evaluated on this bank (Gen0 + 6 A2 excluded), RNG seed `57639099`
(`random.Random(seed).sample(pool,6)`).

## Results (96 worlds)

* `b2-01` (greedy/pairwise/c1/renewal-r0.3/t0.1): −0.195 + 0.000 = **−0.194**.
* `b2-02` (greedy/pairwise/c1/td-h1/t1): 2.592 + 1.075 = **3.667** (B-best).
* `b2-03` (greedy/pairwise/c0/renewal-r0.3/t0.1): −0.193 + 0.076 = −0.118.
* `b2-04` (matching/pairwise/c1/td-h4/t1): 0.163 − 0.032 = 0.131.
* `b2-05` (greedy/orthogonal/c0/td-h16/t0.1): 1.052 − 0.108 = 0.944.
* `b2-06` (greedy/pairwise/c0/progress-h1/t0.1): 2.063 + 0.456 = 2.519.

No draw beats Gen0 (5.606) or A2's claimant (7.601). Random control yields no
claimant on this bank.

## Productivity (v2 bank)

* A (greedy Hamming-1): 6 proposals, best 7.601, 1 claimant → failed fresh eval.
* B (random): 6 draws, best 3.667, 0 claimants.
* A found the (ultimately failing) claimant; B found nothing. Since the
  claimant failed acceptance (`RSI_TASTE_GEN1_EVAL.md`), this is **not** a
  search-productivity advantage toward RSI — a faster route to a rejected
  revision carries no improvement per total budget. Preserved as a negative.

Evidence: `evidence/rsi-taste-v1/search-20261028-v2/{b2-01,…,b2-06}/`.
Round totals: A2 96 + B2 96 + gen1-eval 48 = 240 worlds.
