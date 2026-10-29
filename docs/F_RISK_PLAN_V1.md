# F-RISK plan V1 (terminal-tick foraging-risk, descriptive)

Frozen 2026-10-29. Status: DESIGN ONLY until analysis. Zero new worlds, zero
seeds, zero bank contact — spent M-GATE + S-GATE control mains as MEASUREMENT.
Licensed by M-ORIGIN (sole licensed follow-up). This plan licenses PROPOSALS
or CLOSURE only — including "close foraging as a line".

## Data (verified present read-only 2026-10-29; nothing else may be touched)

- M-GATE tau-null + S-GATE tau-null rows (8 histories): arms
  candidate/unlearned/frozen/reset, endpoint `totals` {deaths, deathCauses
  {energy, age}, foodEaten, beneficialEaten, harmfulEaten, dissipated,
  toxinDamage}, survivors, foodInventory. All fields populated all arms.
- Death TIMING is NOT derivable (no phaseRows in these rows) → timing
  questions are OUT OF SCOPE (noted, not worked around).

## Questions (exact computations, pre-registered rules)

- Q1 death-cause shares: per history per arm, energy-fraction of deaths.
  Rule: any age-death share >0 → report as anomaly with its history/arm
  (no follow-up licensed by anomaly alone). Else (~100% energy expected) →
  starvation-only confirmed, proceed to Q2–Q4.
- Q2 harmful-vs-beneficial choice: per history per arm, harmful share =
  harmfulEaten/(harmfulEaten+beneficialEaten). Rule: unlearned share exceeds
  reset share by ≥0.15 absolute on ≥6/8 histories → LICENSE a
  cue-discrimination proposal (foraging CHOICE line; needs its own frozen
  plan + fresh goal, and per-decision data it must name). Shares within
  ±0.05 across arms → choice is NOT the differentiator → no choice-based
  follow-up, ever.
- Q3 thrash intensity: per history per arm, dissipated/death, foodEaten/death,
  toxinDamage/death. Rule: unlearned dissipated/death exceeds reset by ≥50%
  relative on ≥6/8 histories → thrash mechanism supported (no new proposal;
  corroborates M-ORIGIN). Else → report, no inference.
- Q4 end-state ecology: survivors + foodInventory per arm per history
  (descriptive; what world the foragers leave behind).

## Close rule (all options on the table)

If deaths ~100% energy AND harmful shares similar across arms (Q2 negative)
AND dissipated scales with deaths without per-death excess beyond activity
(Q3 negative) → CLOSE foraging as a line: M-ORIGIN's thrash-and-starve is the
complete story, no residual question, publish the closure. If Q2 licenses
cue-discrimination → that proposal (and only that) is the output. Mixed
results → license nothing, report exactly what held and what didn't.

## Analysis discipline (violations invalidate the run)

- Tool: `python3` + stdlib ONLY (`json, math, statistics`); no engine imports,
  no node, zero worlds; no writes to `evidence/` (no new files, no mtimes).
  Output: `docs/F_RISK_RESULTS_V1.md` (+ status updates), committed.
- No new banks/seeds/worlds; no qual contact; no RSI claims; no rescoring of
  prior verdicts (their numbers are inputs).
