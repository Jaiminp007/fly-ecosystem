# RSI search wave A4/B4 (memory grid, v4 bank) — claimant mem64-8, no productivity edge

Bank: `search-20261030-v4` (`1f140581…`), 16 worlds/proposal. Gen0-memory
(32/8) line 5.673 (seq +4.524, vsReset +1.149).

## A4 greedy (96 worlds)

One-step moves of (32,8): (16,8) 4.097 dual-true; (64,8) **6.207** A-true/B-false;
(32,4) 5.778 A-true/B-false; (32,16) 6.091 dual-true. Incumbent → (64,8).
Neighbors: (64,4) 6.207, (64,16) 6.207 — exact ties (audit below). Best 6.207.

## Tie audit (same history, 64/4 vs 64/8)

Same-history rows: endpoints, scalarOperations (169,524,769), probes all
bit-identical; only final taste weights differ. The memory policy changes the
replay stream (weights differ) but no discrete decision flips on this bank, so
behavior/energy are identical while internals differ. Score-level tie
{(64,4),(64,8),(64,16)}; selection rule (predeclared best-score, first
evaluated) → claimant (64,8). The dual-true (32,16) at 6.091 is noted but NOT
evaluated — score rule blocks cherry-picking the retention-friendly runner-up.

## B4 random (seed 20261030, 96 worlds, 6 draws of 8 non-Gen0 cells)

(32,4) 5.778, (32,16) 6.091, (16,16) 3.246, (64,16) 6.207, (16,4) 4.230,
(64,4) 6.207. Deterministic reruns reproduce A4 exactly (same seeds → same
scores: 5.778/6.091/6.207), confirming reproducibility. B-best 6.207 via
overlap with A's cells.

## Productivity

Both procedures' best = 6.207 (same cell). A found it in 4 proposals; B drew
it among 6 only through overlap. No method advantage — the dimension yielded
the gain, not the search method. No productivity win either way.

Evidence: `evidence/rsi-taste-v1/search-20261030-v4/{gen0-search4,a4-*,b4-*}/`.
