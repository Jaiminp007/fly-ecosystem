# Matched-RNG resource attribution

The predeclared `GATE_REPLAY_RESOURCE_ATTRIBUTION_PLAN.md` replays the three
already identified reservoir cases whose recorded physical RNG and living
roster match for all 256 transfer ticks, instrumenting patch-amount writes
outside the learner. Exact original traces and final checkpoints reproduce;
every feeding write is attributed to its body's existing physical receipt and
pre-decision regrowth is separated from consumption. No patch identities,
other-body consumption, observer labels or fork outcomes were exposed to any
learner.

| Seed / body | First matched-position intake-difference tick | Current intake | Native intake | Difference |
| --- | ---: | ---: | ---: | ---: |
| 1172370180 / 18 | 1797 | 0.8045299907 | 0.8000000000 | +0.0045299907 |
| 3285880790 / 9 | 1840 | 0.5843120869 | 0.5856448833 | -0.0013327964 |
| 748966988 / 9 | none | — | — | — |

First-gap patch detail, at identical pre- and post-movement focal positions
and identical physical RNG states:

- 1172370180 / 18, tick 1797: the focal eats patches 23 and 94 in both
  worlds. Patch 94 is identical (1.1934337038 before, 0.3934337038 eaten).
  Patch 23 holds 0.0045299907 in current and 0 in native, so the whole
  +0.00453 intake gap is that patch's remaining amount. Prior same-patch
  nonfocal consumption is 0.3473833937 in current versus 0.3519133845 in
  native; the native world had about 0.00453 more prior nonfocal consumption
  on the same patch.
- 3285880790 / 9, tick 1840: the focal eats patches 362, 211 and 511 in both
  worlds. Patches 362 and 511 are identical; patch 211 holds 0 in current and
  0.0013327964 in native, so the whole -0.00133 intake gap is that patch's
  remaining amount. Prior same-patch nonfocal consumption on patch 211 is
  0.0013327964 in current versus 0 in native; the current world had exactly
  that much more prior nonfocal consumption on the same patch. Seven further
  matched-position intake-difference ticks follow (1843–1857, all of
  magnitude <= 0.00134) with the same sign pattern before positions diverge
  at tick 1884.
- 748966988 / 9: no tick in the 256-tick window has differing focal intake
  at matched positions and matched RNG. Zero same-position intake-differing
  ticks exist; all 162 intake-differing ticks occur after the positions first
  diverge (tick 1864), the first at tick 1871.

Scale context within the same 256-tick replay window: cumulative focal intake
(current minus native) is -25.285609 (1172370180), -15.797786 (3285880790)
and -22.400603 (748966988). The first matched-position gaps above are three
to four orders of magnitude smaller than those window totals, and the window
totals themselves are a replay-slice diagnostic, not the whole-probe energy
gap. Positions first diverge at ticks 1806, 1884 and 1864 respectively, so
almost all of each window's intake difference accrues after the trajectories
separate.

Evidence: `evidence/gate-replay-resource-attribution/20261026-v1`. An
independent checker reconstructs 1,536 paired ticks, 16,318 physical receipts,
18,057 feeding writes and 952,320 regrowth writes, verifying per-write patch
bookkeeping against factual receipts, the captured path/RNG states and exact
final food states. It uses captured engine code, not an independent physical
simulation. These are three outcome-selected cases, so the counts and the
prior-consumption associations are not population estimates, causal proof of
competition, evidence that a social feature would predict or close the gap, or
any qualification. All prior pressure, retention, transfer, survival and
fresh-audit gates remain unmet and no reserve is opened.
