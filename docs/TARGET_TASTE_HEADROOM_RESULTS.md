# Paid target-cue taste intervention

The opt-in interface exposes cues for already-sensed target patches, scores
the recommended pair using the body's own taste weights, and suppresses a
learned midpoint choice when the two acceptance probabilities sum below one.
Matched observe and reset controls receive the same cue access, predictions,
storage and baseline computation; actual veto writes are charged. Odor-free
transfer masks all target cues to zero and uses the existing accept default.
No hidden valence enters the controller.

| Filter versus control | A mean / founder; wins; survivors | B mean / founder; wins; survivors | Transfer mean / founder; wins; survivors |
| --- | --- | --- | --- |
| Matched observe | +0.071896; 4/8; 0 | +0.055879; 3/8; 0 | 0; 0/8; 0 |
| Matched reset | +1.491793; 8/8; +5 | +0.821242; 8/8; +2 | +0.248158; 5/8; 0 |
| Cheap native-full | +1.216042; 8/8; +6 | +0.638226; 7/8; +1 | +0.084419; 4/8; 0 |

These are outcome-informed frozen interventions on reused D bodies, not new
training or qualification. The observe comparison is mixed in A/B, and the
unchanged transfer consistency gate fails against both required controls.
Filter and observe transfer trajectories match because absent target cues
cannot trigger the fixed veto; this mechanism alone cannot change transfer.
The combined taste/steering rule is compiled, not evidence of an acquired
steering skill or of functional-pressure retention.

The first run omitted charges for action rewrites; its evidence is preserved
but undercharged and not promoted. `docs/TARGET_TASTE_V1_ACCOUNTING_NOTE.md`
explains the correction. V2 repeats the same rule after those outcomes, so it
is not an independent confirmation. Fifteen focused tests pass. The V2
readback checks 174,242 decision/receipt pairs, 130,905 sensor-work checks,
87,449 score/action checks and 96 exact source replays, including encoded
state and reported debt. It does not independently simulate physics or measure
hardware energy. Protocols, captured sources, traces and readbacks are in
`evidence/target-taste-headroom/20261026-v1` and
`evidence/target-taste-headroom/20261026-v2`. All reserves remain closed.
