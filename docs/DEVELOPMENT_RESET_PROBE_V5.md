# Development reset-probe V5 verdict (2026-11-03) — new bank, same pattern, criterion still unsatisfied

## Authorization
User-authorized single bounded world run on a virgin bank (disk floor
1 GB; 4G before and after; outputs ~6.2M each). Frozen plan
`docs/DEVELOPMENT_RESET_PROBE_V5_PLAN.md` (V2-identical design, fresh
bank dev-bank-v2). Fixtures 32/32 green pre-run. This verdict covers one
VOIDED launch plus the single valid attempt.

## Procedural void (freeze deviation, my CLI error — disclosed)
First launch omitted `--bank`, so the runner defaulted to dev-bank-v1
and ran V1's spent histories 0–1 (bank ad56119d…). That violates the
frozen plan (virgin bank) and the user's explicit order, and reuses
spent seeds: verdict INVALID-bank, published nowhere, scored nothing.
`evidence/taste-development/dev-reset-probe-05/` is preserved as-is
(like attempt-01b precedent) and NEVER counts as evidence. Single
re-launch with the explicit `--bank dev-bank-v2` flag into
`dev-reset-probe-06/` — no completed main exists twice (the void run's
histories differ from the valid run's).

## Results, virgin bank histories 4005788290/2452334044 (G1+G2 pass)
- Sequence vs unlearned: [+0.090, −0.427], mean −0.168, 1/2, survivors −2.
  developmentSignal FALSE.
- Probe acquiredA: [+1.221, +0.380], 2/2 (probe-memory now 8/8 across
  V2–V4+V6; V5-void excluded).
- vs frozen: [+0.405, −0.494], mean −0.045, 1/2, survivors −1.
- vs reset: [−0.783, −0.931], mean −0.857, 0/2, survivors −7 (candidate
  loses to reset both histories and by survivors — resetting mid-run
  preserves the colony better than continued learning here).
- extendedDevelopmentSignal FALSE. Retention A/B FALSE/FALSE.
  Transfer 2/2 positive ([+0.337, +0.163], mean +0.25 — largest yet,
  still small).

## Final synthesis, all eight full-horizon histories (V2–V4 dev-bank-v1 + V6 dev-bank-v2)
- vs frozen: 4/8, mean +0.018 (≈ noise). vs reset: 4/8.
- acquiredA: 8/8 — probe-level memory forms every time.
- developmentSignal per run: FALSE, TRUE, FALSE, FALSE.
- Transfer: 3/8 positive. Retention: all FALSE. No milestone changes.
- Verdict: criterion 1 UNSATISFIED as a general claim, on two banks.
  The virgin bank reproduces the closed bank's pattern (mixed effects,
  history-dependence, stable probe-memory, no durable benefit) — the
  V1–V4 finding generalizes rather than being bank luck. No V6-bank
  follow-up without a new rationale (same exhaustion rule as V4).

## Preservation
`evidence/taste-development/dev-bank-v2/` (bank, histories 0–1 now
spent for this question) + `dev-reset-probe-06/` (the scored world) +
`dev-reset-probe-05/` (VOID-bank run, preserved, never evidence).
