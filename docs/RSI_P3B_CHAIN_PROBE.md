# RSI P3-B chain probe: no second move found

Script: `scripts/rsi-p3b-chain-probe.mjs`. Evidence (gitignored):
`evidence/rsi-p3b-chain/`. This is exploratory. It reuses the spent P3 banks
(997001–997012).

From the program that greedy search reached in P3 (one `keepOnly/evid`
jump), 12 second moves were tried on every rule: `prior`, `memory`, `step`
and `replays`. Gains are energy relative to that program, averaged over the
12 rules.

| Move | Mean gain |
|---|---|
| prior = 0 | −17.9 (catastrophic) |
| prior = 0.5 | −0.05 |
| every other move | −0.12 to −0.95 |

All 12 mean gains are negative. On 6 of the 12 rules, some move exceeded +1.
That is about what noise predicts when taking the best of 12 moves measured
on 6 histories.

**Conclusion:** the reached program is a local optimum over these knobs.
`prior` and `memory` add no chain. Path B needs a different source of
compounding structure, which is a design question for Fable.
