# RSI plan amendment v19: stochastic feeding x R=4 (threshold bypass)

## Why (behavior-space, not weight-space)

Gen13 completed the weight-space singularity: even step-size-only change
(same records, order, count) silences to exact-zero. The threshold is the
enemy, and greedy feeding (`eat w.p. .95 iff prediction>.5 else .05`) is
the threshold made flesh: sub-threshold prediction differences change NO
behavior. `feedingRule=matching` (`eat w.p. .05+.9*prediction`) makes
behavior SMOOTH in predictions — small weight changes move action
probabilities continuously, so learning cannot collapse to
prior-identical no matter where predictions sit. No new code
(`feedingRule` already {matching,greedy}-validated, persisted in body
config — a legitimate persistent algorithm revision; `--greedy-inference`
stays on for all arms so frozen inference is equal). Virgin at R=4 (v1
menu tested it only at R=1, where greedy won on score — but alive is all a
first accept needs, and matching's smoothness is exactly what the seven
zeros lacked).

## Menu (Gen1 R=4 flags otherwise: orthogonal, tr=1.0, (32,8), S=1)

* A (greedy): feeding in {matching} + one repeat of greedy as same-bank
  reference? NO — baseline cell covers greedy. A runs matching with two
  seeds? Procedure is deterministic per bank; instead A = {matching} plus
  {matching x tr=0.5}? NO — one dial per round. A: {matching} single cell
  + second cell {matching, capacity 40}? NO. Keep it clean: A runs
  {matching} once; the round is 1 A-cell + 2 B-cells + baseline.
  Hmm — matched budgets need equal worlds/procedure. A=1 cell (16 worlds)
  vs B=2 cells (32 worlds) breaks matching. FIX: A = {matching x R=4,
  matching x R=6} (rate companion, same family), B = random two of
  {matching x R=3, matching x R=5, matching x R=8} via mulberry32(20261113).
  All cells matching; rate varies. ≤96 worlds/procedure both sides
  (A: 32, B: 32 + baseline 16 shared).

## Rules unchanged

New search bank v20 (bank() scan excludes all prior), `--count 4`, 6 arms
`candidate,unlearned,reset,acceptCruise` + Gen1 R=4 GREEDY baseline cell
on the same bank (the bar to beat does not move), ≤96 worlds/procedure,
matched A/B. No eval without a dual-true cell beating the same-bank
greedy baseline. Any claimant fresh-evaluated on a new 8-history bank
(6 arms, v2 gates + world-cap, copy control). ≥2 successive accepts +
productivity for any RSI claim. All prior failures stand.
Prediction on record: matching cells are ALIVE (no exact-zero — smoothness
forbids the collapse); level likely trails greedy baseline on score (v1
precedent); the prize is a dual-true live cell, which re-opens the game
even below baseline via the retention-first line's independent-eval rule
— NO, the line requires beating the baseline too. Prediction honest:
likely no claimant, but a live matching cell proves the threshold bypass
works and sets up V20 (matching x dials that raise its level).
