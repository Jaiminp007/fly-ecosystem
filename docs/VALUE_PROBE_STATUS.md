# VALUE-PROBE Status

- 2026-10-26: V1 FROZEN (`VALUE_PROBE_PLAN_V1.md`, design only).
- 2026-10-26: IMPLEMENTED. Engine `probeCueValues` (exact, context-free
  phi, math-wrapper billing only — no surcharge after fidelity check
  caught double-billing); instrument `scripts/value-probe-dev.mjs`
  (V1 triple x 3 pairs = 9 mains, end-of-seg probes all rows, per-cue
  per-third behavior, SDT d'/c, BH gap gate); 9/9 fixtures
  (`tests/value-probe-dev.test.mjs`: fidelity/purity/null-default/
  transplant/collector-thirds/dPrime/scorer-branches/bank-tmp+refusal);
  triage clean (6 known baseline only); bank
  `evidence/value-probe-dev/fresh-01/` built 421001–421054 (54 unique,
  2 self-excluded literals = V1i-identical harmless pattern).
  Single authorized attempt NEXT (not this turn).
- 2026-10-26: Phase-A EXECUTED → **VALUE-PROBE-ACTOR-SIDE** (go:true).
  G1/G0 (train gaps 0.815-0.819)/G-validity (train value 1.0x3, unlearned
  d'=0x3, nullClean) pass; BH value 1.0 vs late behavior 0.086 → gap
  +0.914 (bar +0.2), uniform x3 pairs. HB mirror: value 0.22 vs
  behavior 0.49 (learner-side lag + behavior lead). Threshold-plasticity
  freeze LICENSED (not executed); associability-reset freeze separately
  licensed by HB lag. Ledger 9/0/16128/387072/1.43e9, redone [].
  Cumulative 7647 (+9). 2026-10-26 λ-battery (LOSS_AVERSION_LAMBDA.md,
  0 worlds): λ=|BH|/|HB|=2.95 exact (ranges non-overlapping) → prospect
  theory confirmed; YD dose UNTESTABLE frozen (no dose series) → clean
  gain-sweep line specified. Pre-attempt instrument fix: BT_PROBE_OP_CAP
  import (crash, zero worlds, partial dir removed); fixture moved to
  post-bank form (guard verified working).
- 2026-10-26 CORRECTION (same day, zero new worlds): scorer inverted
  BH behavior (1-turn vs flip-split turn; gaps sum to 1.0). Fixed +
  rescored frozen rows → BH value 1.0 vs behavior 0.914, gap 0.086 →
  INDETERMINATE (go:false). Threshold license WITHDRAWN. Standing:
  validity gates, HB mirror, + bank-dependence (BH 0.83 here vs 0.20
  line; train/intake/engine ruled out → floor partly ecological).
  Next: what makes a bank easy/hard (specified). Fixtures 9/9 fixed.
