# Target-taste acquisition: partial development signal, no qualification

The fixed outcome-informed comparison trained two cue-shared learners with
equal paid target-cue sensing and taste predictions. `observe` ignores the
target score; `filter` applies the compiled veto and trains on the action
actually executed. Both also use the paid contact-cue filter and the earlier
external motor-freeze schedule. These are reused histories, not independent
qualification data, and the two arms have different interacting worlds.

| Arm and transfer control | Mean energy / founder | Positive histories | Survivor difference |
| --- | ---: | ---: | ---: |
| Observe versus reset | +0.929069 | 7/8 | 0 |
| Observe versus cheap native-full | +0.747378 | 7/8 | 0 |
| Filter versus reset | +0.136475 | 3/8 | 0 |
| Filter versus cheap native-full | -0.048675 | 1/8 | 0 |

Observe meets the fixed **exploratory transfer threshold** against both
controls on these eight histories; this is not fresh qualification, and the
observe policy does not use the new target scores. Its descriptive A/B
retention ratios are 100.22% and 104.35%, with positive saved advantages, but
its A interference is -0.112109 and corresponding A net-intake contrast is
-0.134471 per founder. Thus the required functional pressure is not shown.
Filter fails transfer consistency, has 88.63% A retention, and its B
acquisition contrast is -0.123560. Its A interference of +0.026533 is below
5% of the saved A advantage. No stage is qualified. D acquisition survivors
are 61/192 observe and 65/192 filter; these totals are not paired effects.

Eight focused tests pass. The main readback checks 968,631 decision/receipt
pairs, 128 checkpoint links, 208 probe starts and reported ledgers. A separate
outcome readback checks 60,489 A-probe receipts and comparison arithmetic. The
acquisition replay checks 568,031 decisions, 344,987 target scores, 29,799
vetoes, cue masking, actual pending actions, sensor work and encoded state in
64 exact source replays. The first acquisition checker failed on JSON's
normalization of negative zero; `docs/TARGET_TASTE_AUDIT_NOTE.md` documents
the post-outcome V2 audit repair. These checks do not independently simulate
physics or establish actual hardware energy costs.

Captured source, protocol, tapes, checkpoints and readbacks are in
`evidence/target-taste-development/20261026-v1`. All previous failures and
closed reserves remain intact. Acquired skills under pressure, fresh audited
qualification and successive autonomous revisions remain unproved.
