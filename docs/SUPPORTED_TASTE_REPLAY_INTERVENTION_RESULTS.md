# Matched taste replay intervention

The fixed plan in `SUPPORTED_TASTE_REPLAY_INTERVENTION_PLAN.md` compared
physically acquired `mixed` reservoir replay with `fresh` current-record replay
on eight reused development histories. Both arms constructed the same kinds of
buffers, drew the same number of random values and paid the same declared work;
only the factual sample used for the second SGD update differed.

| Descriptive metric | Mixed | Fresh |
| --- | ---: | ---: |
| D survivors / 192 founders | 60 | 63 |
| Transfer vs reset, energy/founder | +0.320184 (7/8 positive) | +0.082904 (5/8) |
| Transfer vs cheap native, energy/founder | +0.134661 (7/8 positive) | -0.099286 (4/8) |
| Transfer survivor difference vs reset / cheap | 0 / 0 | 0 / 0 |
| A interference, energy/founder | -0.018075 | +0.002872 |
| B acquisition, energy/founder | +0.034108 | -0.000557 |
| A net-intake difference/founder | -0.018825 | +0.011612 |
| Descriptive A / B retention | 106.52% / 101.54% | 95.56% / 104.92% |

The fresh arm **fails** the exploratory transfer comparisons, the raw A
pressure threshold (its raw interference is below 5% of its raw A advantage)
and the raw B-acquisition criterion. Its descriptive retention ratios alone
cannot make it pass. Mixed repeats the earlier exploratory transfer result but
also fails pressure. These are outcome-informed reused-world results, not
family-wise statistical qualification. The arms evolved separately, and the
intervention applied throughout acquisition, so this is not an isolated
estimate of replay's effect during B alone.

Evidence: `evidence/supported-taste-replay-development/20261026-v1`. The ledger
checker verifies 954,539 decision/receipt pairs, 128 checkpoint links and 208
probe starts. The independent outcome checker verifies 59,771 A-probe receipts
and summary arithmetic. A separate factual-credit, buffer/RNG and two-policy
SGD reconstruction verifies 41,113 examples and exactly replays 64 acquisition
phases. Eleven focused tests pass. The audits do not independently simulate
physics or establish hardware-energy adequacy.

This single intervention does not justify replacing replay or lowering any
gate. Retain both failures, investigate mechanisms that preserve transfer and
produce genuine A/B pressure and retention, and keep all reserves closed until
the complete fresh-audit criteria can be met.
