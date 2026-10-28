# Spatial-index workload census

Captured-source replay of the eight reused replay-arm C segments and current
transfer forks exactly reproduced all 16 final checkpoints. An independent
observer reconstructed each of 83,617 strict-tie recommendations and checked
that every pair within the existing 32-unit forward filter belongs to the same
or an adjacent 32-unit cell. The observer did not alter decisions or prices.

| Segment | Decisions | Mean points | All pairs | Outside neighboring cells |
| --- | ---: | ---: | ---: | ---: |
| C | 67,348 | 40.50 | 60,969,252 | 37,339,161 |
| Transfer | 16,269 | 39.96 | 14,335,203 | 8,708,175 |

Ignoring all new index costs, these outside-cell pairs represent at most
112,017,483 and 26,124,525 existing abstract scalar checks, respectively.
At the existing operation price, that gross ceiling is about 0.1716 and
0.0400 energy per original founder. It excludes index construction, lookup,
tie handling, retained bytes and any changed physical trajectories; **it is
not a measured net saving**. In particular, the transfer ceiling alone cannot
be treated as proof that an indexed learner will overcome the observed
0.0695/founder cheap-native deficit, because prices and trajectories interact.

Per-history source/input hashes, counts, histograms and exact-checkpoint results
are in `evidence/spatial-index-census/20261026-v1`; the observer implementation
is `scripts/census-spatial-index.mjs`. This is not independently simulated
physics. The density and gross pruning justify testing a single exact index,
including negative coordinates, duplicate points and original strict ties,
with its construction, search and retained memory explicitly billed. Such an
engineering optimization is not itself a learned skill or a qualification pass.
