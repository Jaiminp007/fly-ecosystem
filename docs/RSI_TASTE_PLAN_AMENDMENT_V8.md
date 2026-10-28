# RSI plan amendment v8: replay passes (mixture tracking)

## Why

Probe mechanics (`taste-experiment.mjs runTasteProbe`) freeze weights during
retention probes (`compact` → `acquisition=false`, weights asserted
unchanged): the end-of-run controller is stuck for both A- and B-probes. So
no routing scheme can serve two frozen probes from different vectors — the
single final weight vector must jointly satisfy A- and B-cues. This rules
out the archival-streams direction analytically (streams-v1's no-engagement
is structural, not a tuning gap).

The remaining lever on the final vector is what it tracks: live updates pull
toward recency (C, then return-A), replay pulls toward the reservoir mixture
(A/B/C in historical proportion). One replay draw per live step underweights
the mixture. `replayPasses` R multiplies replay draws per trigger (both live
and motor-update call sites), billed per draw, R=1 bit-exact (21 prior tests
unchanged + new validation test).

## Menu (Gen0 base, all else fixed)

* A (greedy, predeclared): R ∈ {2,4}.
* B (random, matched): R ∈ {3,5} drawn by mulberry32(20261102) from {3,5,6}.
* New search bank v9, ≤96 worlds/procedure (16/cell: 4 histories × 4 arms),
  fresh eval banks, v2 gates, copy control, ≥2 successive + productivity.
  No eval without a claimant beating Gen0. All prior failures stand.
