# Supported steering protection physical development

The fixed matched-arm plan in `SUPPORTED_STEERING_PHYSICAL_PLAN.md` completed
all eight reused histories. Both arms computed and paid for own-action support
and candidate compensation; only `protect` applied the bank corrections.
The 100 MiB tape-start floor was respected; available disk is now critically
low. Compressed checkpoint paths may share immutable hard links.

| Descriptive metric | Control | Protect |
| --- | ---: | ---: |
| D survivors / 192 founders | 61 | 60 |
| Transfer vs matched reset, energy/founder | +0.881009 (5/8 positive) | +0.320184 (7/8) |
| Transfer vs cheap native, energy/founder | +0.694889 (5/8 positive) | +0.134661 (7/8) |
| Transfer survivor difference vs reset / cheap | 0 / 0 | 0 / 0 |
| A interference, energy/founder | +0.028876 | -0.018023 |
| B acquisition, energy/founder | +0.091330 | +0.034108 |
| A net-intake difference/founder | +0.036716 | -0.018825 |
| Descriptive A / B retention | 93.65% / 95.23% | 103.28% / 101.54% |

Protect **meets the fixed exploratory transfer consistency rule** against
reset and cheap native, without a survivor deficit, and has descriptive
retention above 95%. However, it **fails functional pressure**: the raw A
interference and A net-intake differences are negative. It therefore does not
pass the joint development gate and is not qualified. Raw comparisons use a
reused development bank; no family-wise inference or fresh reserve is claimed.
The two arms evolve different worlds, so their totals are not paired individual
counterfactuals. The guarded control also outperforms protect on average by
0.166312 energy/founder, although it is not the exploratory transfer gate.

Evidence: `evidence/supported-steering-development/20261026-v1`. The ledger
checker verifies 947,507 decision/receipt pairs, 128 checkpoint links and 208
probe starts. A separate own-pending-action checker reconstructs 563,619
support/compensation updates, including 263 terminal updates, and exactly
replays 64 acquisition phases. Ten focused mechanism and regression tests pass.
Neither audit independently simulates physics or proves complete low-level
hardware energy adequacy.

Next diagnose why this transfer-preserving arm fails A/B pressure, without
choosing a post-hoc checkpoint or weakening the criteria. Larger physical
studies require additional free disk space; preserve all prior evidence and do
not silently delete files. Fresh qualification and autonomous revisions remain
unproved and all closed reserves remain closed.
