# Development reset-probe V2 verdict (2026-11-03)

## Authorization
User-authorized follow-up ("free the disk and continue") to frozen plan
`docs/DEVELOPMENT_RESET_PROBE_V2_PLAN.md`. Fixtures 32/32 green pre-run. Disk
5G before and after (output 6.2M; floor respected throughout).

## Design (criterion 1: lifetime-learning benefit disappearing under memory reset)
- Same audited dev bank (`ad56119d…`), unused histories 2–3, ticks=1792 (B/C
  manipulations bite), arms=candidate,unlearned,acceptCruise,frozen,reset.
- Single attempt, no rescoring. Runtime ~28 s wall.

## Results (candidate − arm; positive = candidate wins)
- Sequence vs unlearned: [+0.580, −0.341], mean +0.119, positive 1/2,
  survivors +1. developmentSignal FALSE.
- Probe acquiredA (current−reset weights): [+1.265, +0.087], mean +0.676, 2/2.
- vs frozen: [−0.418, −0.406], mean −0.412, 0/2, survivors −5.
- vs reset: [+0.556, −1.057], mean −0.250, 1/2, survivors −2.
- extendedDevelopmentSignal FALSE.
- Retention A/B descriptive95Percent FALSE/FALSE; transfer mean −0.548, 0/2.

## Verdict: DOES NOT SATISFY criterion 1
The reset test was exercised this time (arms diverged, unlike V1) and the
benefit is absent: continued learning through B/C underperforms freezing
after A on sequence energy in both histories (−0.41 mean, −5 survivors), and
the reset comparison is mixed (1/2, mean −0.25). The probe-level memory
effect persists (acquiredA 2/2), but sequence-level lifetime benefit over
frozen/reset is not observed — continued learning hurts vs freezing, an
interference/overfitting signature consistent with the R8–R10 themes. No
milestone changes. No RSI claimed. Development-grade only (qualified:false).

## Preservation
`evidence/taste-development/dev-reset-probe-02/` (untracked raw evidence;
same audited bank; sources digests match V1 run).
