# Replay-steering development: failed gates

The fixed eight-history comparison completed with the externally scheduled
motor freeze after A in both arms. This was an outcome-informed development
study, not fresh qualification or an autonomous phase detector. Original and
replay arms finished acquisition with 62 and 64 survivors respectively.

| Replay transfer control | Mean energy / founder | Positive histories | Survivor difference |
| --- | ---: | ---: | ---: |
| Matched reset | +0.115262 | 4/8 | 0 |
| Matched native | +0.128546 | 4/8 | 0 |
| Matched guarded | -0.250614 | 2/8 | 0 |
| Cheap native-full | -0.069508 | 4/8 | 0 |

Transfer fails the unchanged requirement of positive mean, at least 6/8
positive histories and nonnegative survivor difference against both reset and
cheap native-full. Same-D-body descriptive retention is 91.63% for A and
118.02% for B, with positive saved-over-reset advantages in both; A remains
below 95%. These ratios are not confidence bounds and do not establish
retention under functional pressure. Replay is not promoted.

The original arm reproduces the earlier motor-freeze aggregate: transfer is
5/8 positive versus reset and 4/8 versus native-full, and A retention is
88.45%. Comparisons between the two arms use different resulting bodies and
interacting worlds, not paired isolated effects. No fork outcomes were used as
training labels. Earlier failures and closed reserves remain unchanged.

Captured source, protocol, starts, ends, anchors, complete traces and results
are in `evidence/steering-replay-development/20261026-v1`. The preregistered
checker verifies source and trace hashes, 906,176 decision/receipt pairs,
reported commands, support, frozen probe weights and reported-work/storage/
payment ledgers. A separate post-outcome checker independently reconstructs
440,189 replay-arm steering decisions and 280,288 factual updates, including
128 terminal updates; it also verifies 128 checkpoint links and 176 probe
starts using captured source plus explicit model-weight checks. It does not
independently simulate physics, reconstruct all sensing or establish general
low-level operation adequacy. These results do not satisfy fresh qualification,
functional pressure or later autonomous revision gates.

## Factual support census

The 64 surviving replay founders each retain 32 factual records at D: 582 from
A, 591 from B, 587 from C and 288 from D, with 1,354 native and 694 midpoint
actions. These are outcome-selected surviving memories, not causal evidence.
The complete acquisition counts are in `support-census.json` alongside the
study traces. The observed A-retention failure cannot be attributed simply to
the complete absence of A records; the census alone does not identify its
cause or establish that different replay sampling would pass.
