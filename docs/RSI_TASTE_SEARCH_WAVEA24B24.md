# RSI v24 search: live/replay rate split (NEW CODE) — CLAIMANT b26-r15

## v26 bank (`166ac1d6…`): the level/retention tradeoff exposed as one dial

Gen1 R=4 ρ=1: baseline 4.209 dual-true (A 2.427 vs 2.282, B 2.345 vs 2.277).

| cell | ρ | score | seq | vsR | A | B |
|---|---|---|---|---|---|---|
| gen1-search4 (bar) | 1 | 4.209 | 4.336 | −0.127 | True | True |
| a26-r05 | 0.5 | 7.736 | 5.467 | +2.268 | False | True |
| a26-r20 | 2.0 | 4.547 | 4.505 | +0.042 | True | False |
| b26-r025 | 0.25 | 6.630 | 4.878 | +1.752 | False | True |
| b26-r15 | 1.5 | **4.471** | 4.467 | +0.004 | True | True |

B menu draw mulberry32(20261118) → ['0.25','1.5'].

## The mirror (most informative single-dial result of the program)

Slow replay buys level with A-retention: ρ 1→0.5→0.25 gives level
+0/+3.5/+2.4 while A goes True→False→False (monotone erosion).
Fast replay buys level with B-retention: ρ=2.0 level +0.3, B dies.
Rehearsal step-mass is a ZERO-SUM budget across legs: shrinking
rehearsal lets live learning dominate (level up, A — the oldest leg,
under-rehearsed, dies); growing it lets rehearsal dominate (B — the
return leg, over-consolidated, dies).

## Claimant: b26-r15 (B-procedure, ρ=1.5)

Dual-true (A 2.455 vs 2.330, B 2.497 vs 2.146), score 4.471 beats the
same-bank baseline 4.209 by +0.26. Small margin, both legs positive —
exactly the profile that has accepted before (Gen12/Gen13 margins were
boundary-thin and held). Fresh-evaluate as Gen16 on a new 8-history
bank (6 arms, v2 gates + world-cap, copy control). B-won round for the
productivity ledger (A cells both single-leg failures). 80 worlds.
Cumulative 3920.
