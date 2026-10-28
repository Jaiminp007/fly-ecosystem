# Cue-aware native proof: transfer gate failed

The fixed cue-aware shortcut uses the actual observed cue and proves native
steering either by exact coefficient equality or a conservative value bound.
It is used only in frozen cue-shared probes; it leaves availability and
recommendation explicitly unknown when they are not computed. Reset and
forced-native controls receive the same proof access; forced-guarded uses only
the wall shortcut because its action can differ from the learned preference.

| Proof policy versus | Mean energy / founder | Positive histories | Survivor difference |
| --- | ---: | ---: | ---: |
| Wall-only policy | +0.023094 | 8/8 | 0 |
| Proof reset | +0.089022 | 4/8 | 0 |
| Proof forced native | +0.025625 | 5/8 | +1 |
| Wall-only guarded | -0.776072 | 3/8 | 0 |
| Cheap native-full | -0.073906 | 4/8 | -1 |

The proof arm skips 6,514 pair searches by cue proof and 1,628 by wall proof.
Its matched wall-only engineering comparison improves, but the unchanged
learned transfer gate **fails** against both required controls. The reset arm
also benefits from exact-tie proof; optimizing only the candidate would have
weakened that control. These reused histories are outcome-informed, not fresh
qualification or evidence of a new acquired skill.

The captured protocol, sources, starts, traces and results are in
`evidence/cue-native-proof-transfer/20261026-v1`. Ten focused tests pass. The
readback reconstructs 84,698 decision/receipt pairs, 25,479 cue proofs and
8,269 wall skips across all arms, 70,444 sensor-work checks, frozen RNG,
encoded storage and reported ledgers, plus 48 captured-source replays. A
separate checker verifies outcome arithmetic. Floating-point safety margins
are conservative engineering checks, not a formal proof for every possible
machine or an independently simulated physical world. Declared operation and
byte prices are not direct hardware energy measurements. A/B retention,
functional pressure, transfer, fresh qualification and RSI remain unmet.
