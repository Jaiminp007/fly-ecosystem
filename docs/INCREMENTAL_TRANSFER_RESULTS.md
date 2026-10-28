# Indexed transfer: selector gain, learning gate failed

On the fixed eight reused D checkpoints, the incremental selector improved
budget-adjusted energy over the original filtered selector by +0.008997 per
original founder on average, positive in 8/8 histories with no aggregate
survivor difference. This is an outcome-informed physical engineering
comparison: the selector is hand-coded, not an acquired skill.

| Indexed learned versus | Mean energy / founder | Positive histories | Survivor difference |
| --- | ---: | ---: | ---: |
| Filtered learned | +0.008997 | 8/8 | 0 |
| Indexed reset | +0.114704 | 4/8 | 0 |
| Indexed forced native | +0.127988 | 4/8 | 0 |
| Cheap native-full | -0.060511 | 4/8 | 0 |

The unchanged transfer rule requires positive mean, at least 6/8 wins and
nonnegative survivor difference against both reset and cheap native-full.
It therefore **fails**. The selector comparison does not override the failed
learned transfer or A-retention evidence. The filtered and cheap-native
endpoints reproduce the corresponding earlier development results in all
eight histories. No training or counterfactual label was introduced.

Captured protocol, sources, matched starts, traces, finals and results are in
`evidence/incremental-overlap-transfer/20261026-v1`. The readback checks
81,345 decision/receipt pairs, shared starting worlds, frozen weights,
reported-work/storage/payment ledgers and 40 exact captured-source replays.
It does not independently simulate physics, reconstruct every encoded byte
or establish complete low-level operation adequacy. Fresh qualification,
functional-pressure retention and the later autonomous revision/search
productivity requirements remain unachieved; closed reserves remain closed.
