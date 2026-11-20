# BRAKE-LIFT Status

- 2026-10-26: V1 FROZEN (`docs/BRAKE_LIFT_PLAN_V1.md`, design only).
- 2026-10-26: IMPLEMENTED. Engine `taste-energy.mjs`: `assocBrake`/
  `assocC0`/`assocDecay` config (null-default off/2000/0), conditional
  `brakes:{}` + `work.brakeUpdates` (present only when enabled, matching
  surpriseEma/slowTaste precedent — null arms byte-identical), live-update
  brake block with symmetric billing (uniform +=3 on all arms, behavior
  changes only when enabled; verified bit-identical + exact-ops).
  Instrument `scripts/brake-lift-dev.mjs` (train + uniform + nolift/
  slow/fast + unlearned = 18 mains; transplant from train weights +
  per-cue brake init from train contacts; per-cue thirds + firstTick;
  scorer with G1/G0/G2b + manipulation gate (nolift<uniform 0.05) +
  lift gate (fast>uniform +0.1 on >=2/3) + LI-gradient descriptive).
  9/9 fixtures (`tests/brake-lift-dev.test.mjs`: opts identity,
  transplant, collector thirds+firstTick, liPartial unit, all scorer
  branches, bit-identity+exact-billing on synthetic seed 900003,
  bank tmp+refusal → post-bank form). Triage at 6 pre-existing
  baseline failures only (2 archived-evidence ENOENTs + 4 audit/value
  failures identical with/without the engine change — verified via
  stash A/B). Bank `evidence/brake-lift-dev/fresh-01/` built
  423001–423054 (54 unique). Single authorized attempt NEXT.
- 2026-10-26: Phase-A EXECUTED → **INVALID (manipulation gate)**.
  G1/G0/G2b/null-hygiene pass; brake fired (3101 updates); nolift
  0.309 vs uniform 0.330 (gap 0.021 < 0.05) → INVALID, no license.
  Autopsy: brake verified working in isolation (synthetic decay +
  bit-identity) but live-only gating swamped by unbraked replay
  (uniform↔brake cosine 0.98 vs train↔uniform 0.61; live:replay =
  1:4). Hypothesis not refuted — wrong pathway. Specified next:
  replay-gated (or both-path) brake (new rationale required, not an
  automatic V2). LI descriptive flipped sign, uninterpretable here.
  Ledger corrected post-run (note() formula swap; analytic rescore).
  Cumulative 7665 (+18).

## V2 (replay-gated)
- 2026-10-26: V1 INVALID → V2 FROZEN (`docs/BRAKE_LIFT_PLAN_V2.md`;
  new rationale: replay dominance 1:4 measured + weight-identity proof).
- 2026-10-26: IMPLEMENTED. Engine: brake block moved out of the
  live-only gate (applies to live AND replay; same +=3 billing,
  null-default preserved). Instrument `scripts/brake-lift-v2.mjs`
  (full V1 copy + renames; same arms/caps/gates/scorer; bank
  424001–424054). 11/11 fixtures (`tests/brake-lift-v2.test.mjs`:
  V1 suite ported + sources-closure guard + state-robust bank guard +
  replay bit-identity + replay brake unit). Triage at 6 pre-existing
  baseline. Bank `evidence/brake-lift-dev/fresh-02/` built
  424001–424054 (54 unique). Single authorized attempt NEXT.
- 2026-10-27: Phase-A EXECUTED → **BRAKE-NOGO** (manipulation passes:
  nolift 0.179 < uniform 0.334 by 0.155; lift fails: fast 0.230 <
  uniform, repWins 0/3). Monotonic dose-response holds (uniform >
  fast > slow > nolift) but fast never reaches baseline — explicit
  machinery can't beat implicit release. LI replicates on fresh bank
  (uniform −0.271). Line CLOSED (no V3 without new rationale).
  Cumulative 7683 (+18).
