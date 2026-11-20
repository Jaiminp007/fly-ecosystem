# MATE-PROXIMITY V1c — RESULTS (single authorized attempt)

**Verdict: MATE-PROXIMITY-GO-V1C** — dose replicates: narrow gen-2 3 ≤ normal 8 ≤ wide 11,
wide ≥ 2 and > narrow. First replicated mating structure in program history.
Line CLOSES (mating arc now complete with one replicated positive). Cumulative program spend: 7839 (+18).

## Attempt (ONE, authorized, 2026-11-02)

- Bank: `evidence/mate-proximity-dev/fresh-03/` (435001–435054, 6 histories × 9 seeds), built post-freeze, force-added.
- Runner: `runMateProximityV1c` — exact V1 replication (3 arms × 6 histories = **18 mains**),
  ZERO probes, BT_TICKS=1792, V1 bar frozen-identical.
- Ledger (`attempt-04/ledger.json`): 18 mains / 0 probes / 32256 worldTicks / 3.42e9 ops. No crash, no resume, `redone: []`.
- Integrity: G1 true (18/18, 6/arm, finite endpoints). G2 true (V1 form + geography). Residuals < 1e-7.

## Per-arm outcomes

| arm | range | births | gen-1 | gen-2 | gen-2/seed |
|---|---|---|---|---|---|
| hub/narrow | 13u | 27 | 24 | 3 | [1,1,1,0,0,0] |
| hub/normal | 26u | 37 | 29 | 8 | [0,2,2,2,0,2] |
| hub/wide | 52u | 49 | 38 | 11 | [1,1,3,3,0,3] |

- Dose shape: MONOTONE on both panels (births 27<37<49; gen-2 3≤8≤11). Wide wins or ties
  on 5/6 histories (seed 435028: wide childless, normal wins — the lone reversal).
- V1 vs V1c (two fresh banks): gen-2 5/9/17 vs 3/8/11; births 32/46/57 vs 27/37/49.
  Direction + monotonicity replicate EXACTLY; levels shift (intercept bank-variance,
  shape-stable). This is the signature of a real-but-noisy effect — as opposed to the
  INHERIT-V1b pattern (margin vanished) or ENCOUNTER pattern (direction flipped).
- Gen-2 per birth: 0.11 / 0.22 / 0.22 — rate rises then saturates (normal≈wide rate,
  wide wins on rolls). Refines V1's "rate rises throughout" reading.

## Interpretation (honestly held)

- The arc's sole clean positive SURVIVES its pre-registered replication: proximity
  breadth orders compounding across two fresh banks, 12 histories, 36 mains. Claim
  licensed by the frozen bar (this IS the separately-satisfying evidence the bar
  demands — but note its bounds: hub-only, enriched, decoupled, maternal, 1792-tick
  window; no transfer/population/RSI claim follows).
- R71 lens (pre-registered round, now earned): this is a NON-EXACT replication in the
  2604.26268v2 sense (fresh bank = different data-generating process draw, shared
  latent rate). The shared-latent-rate reading (shape stable, intercept varies) fits
  better than exact-replication would — bank variance is intercept noise on a stable
  dose shape, not effect absence.
- V1-direction tally closes at 6/7 banks (hub ≥ spread wherever both ran); the lone
  reversal (ATTRACT-V1b spread 6 > hub 5) stands as bank luck against six.

## What did NOT happen

- No second attempt, no rescoring, no pooled gating, no tuning (bar frozen-identical by design).
- No RSI/population/transfer claim. The claim is bounded: dose replicates on hub.

## Status

MATE-PROXIMITY V1c CLOSED AS GO-V1C (replicated dose). The mating arc is now COMPLETE
with one replicated positive: proximity breadth orders compounding (2 banks); food is
a gate not a gradient (V1b split); sensing acts only via locomotion and is bypassed
in decoupled mating (ATTRACT); transmission is faithful-but-inert (INHERIT/SOCIAL);
knowledge does not establish (INFORMED). Any new mating line needs program-level
decisions (coupled action, quality-signal, detection-sharing) — the experimental
design space at this scale is exhausted.
