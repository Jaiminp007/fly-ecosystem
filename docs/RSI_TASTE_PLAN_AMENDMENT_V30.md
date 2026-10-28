# RSI plan amendment v30: surprise-scaled rehearsal gain (NEW CODE, fifth class)

## Why (graded vs binary)

V28 skip (binary drop of learned records) won a fresh accept (Gen18).
The graded dual: BOOST rehearsal for surprising records instead of
dropping boring ones. Reuses the validated live-surprise criterion
(err² > 2·EMA, warm > 1e-4) read-only in the replay path — no new
state, no new EMA. If rehearsal strides should follow information
(surprise) rather than mere non-mastery (skip threshold), gain beats
gate; if both win, the interaction (gain × gate) is V31.

## Mechanism (`replaySurpriseGain` h ≥ 0, default 0 = exact prior behavior)

In `replayGated`: after scoring err² (shared with skip), if h>0 and
surpriseEma warm and err² > 2·surpriseEma → pass boost=(1+h) into
`tasteUpdate` (new optional 5th param, replay-branch only,
`!==1`-guarded so default path is bit-identical). `surpriseEma` is
NEVER written in replay (live-only, as before). Diagnostic
`state.work.replaySurpriseBoosts++` unbilled. Validation finite && ≥ 0.
Persists/backfills/restores; `keys()` audit. Runner
`--replay-surprise-gain`. Unit-pinned.

Substrate note: the dial needs a live surprise EMA, so the V30 BASE
adds `surpriseGain=2` (Gen1 R=4 + g2, h=0) — the bar holds the live
substrate constant; only the replay boost varies. (g=2 alone was a
below-base loser as a LEAD dial; here it is shared substrate, no free
advantage.)

## Menu (Gen1 R=4 + g2 base, (32,8) S=1 orthogonal greedy tr=1.0 R=4)

* Baseline: Gen1 R=4 + surpriseGain=2, h=0.
* A (greedy): h ∈ {1, 3} — double vs quadruple surprising rehearsal.
* B (random, matched): two of {0.5, 2, 5} via mulberry32(20261124) →
  ['0.5','2'].

## Rules/stakes unchanged

New search bank v32, `--count 4`, 6 arms + baseline same bank,
≤96/procedure matched A/B. No eval without dual-true beating baseline.
Claimant → fresh 8-history bank (6 arms, v2 gates + world-cap, copy
control) as gain line 1/2. Bounded RSI iff any line reaches 2/2
successive with 2/2 A-directed productivity + budgets.
