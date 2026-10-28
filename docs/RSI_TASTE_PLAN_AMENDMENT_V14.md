# RSI plan amendment v14: replay-rate extension at fixed composition

## Why

Gen9 closed the composition axis: changing the replay mixture in EITHER
direction silences R=4's fresh lifetime gain to exactly 0.0 (dilution via
slots/surprise-overwrite keeps predictions sub-threshold; concentration-old
via (48,8) over-anchors A into prior-identical actions). The one untested
direction preserves composition exactly and scales only RATE: higher
`replayPasses` draws from the SAME (32,8) buffer, pulling harder toward the
same mixture. V8 tested R in {2,3,4,5} (R=5 held dual-true descriptively,
trailed R=4); R>=6 is virgin. Billing grows linearly per pass and is
honestly charged, so a win must clear total-budget productivity, not just
the score. No new code (`replayPasses` already integer-validated).

## Menu (Gen1 R=4 flags, (32,8), all else fixed)

* A (greedy): R in {6,8}.
* B (random, matched): two of {7,9} drawn by mulberry32(20261108).

## Rules unchanged

New search bank v15 (bank() scan excludes all prior), `--count 4`,
6 arms `candidate,unlearned,reset,acceptCruise` + Gen1 R=4 baseline cell on
the same bank, ≤96 worlds/procedure, matched A/B. No eval without a cell
beating the same-bank R=4 baseline. Any claimant fresh-evaluated on a new
8-history bank (6 arms, v2 gates + world-cap, copy control). ≥2 successive
accepts + productivity for any RSI claim. All prior failures stand,
including gen9. Prediction on record: rate-only scaling holds or degrades
smoothly (no exact-zero expected — composition untouched); an exact-zero at
higher R would implicate saturation/clip dynamics instead and is itself
informative.
