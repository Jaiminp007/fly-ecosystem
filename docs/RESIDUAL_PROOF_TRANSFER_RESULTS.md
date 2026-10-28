# Optimized residual-mask transfer: gate failed

This fixed, outcome-informed comparison applies the previously selected
residual-only mask to frozen D checkpoints. All model arms pay for frozen
compaction and 16 mask writes. Reset and native controls receive the same
wall and cue-native shortcuts as the proof policy; guarded receives only
the wall shortcut. The cheap native-full reference pays no unused learner.
Eight previously used histories are not fresh qualification data.

| Proof policy versus | Mean energy / founder | Positive histories | Survivor difference |
| --- | ---: | ---: | ---: |
| Standard masked policy | -0.046139 | 6/8 | 0 |
| Wall-only masked policy | +0.002844 | 7/8 | 0 |
| Proof reset | +0.224888 | 6/8 | -1 |
| Proof forced native | +0.251554 | 7/8 | -1 |
| Wall-only guarded | -0.640205 | 3/8 | -1 |
| Cheap native-full | +0.061959 | 4/8 | -2 |

The unchanged exploratory transfer gate fails: survival is worse than both
required controls, and consistency also fails against cheap native-full.
The shortcut alone does not resolve the observed cost-pressure problem.
This is not an acquired skill or evidence of functional-pressure retention,
fresh qualification, or autonomous improvement, even if a comparison had
passed. No closed reserve was opened.

Captured protocol, inputs, source hashes, starts, traces, checkpoints and
results are in `evidence/residual-proof-transfer/20261026-v1`. Eleven focused
tests pass. The independent readback checks 98,752 decisions and receipts,
29,384 cue proofs, 8,452 wall skips, 84,498 sensor-work checks, 336 masked
bodies, and 56 captured-source physical replays. It reconstructs the mask,
proofs, steering and RNG, encoded storage, reported ledger and comparisons.
It does not independently simulate physics or establish actual hardware
energy prices; the floating-point bound is not a formal universal proof.
