# Development reset-probe V4 verdict (2026-11-03) — bank complete

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 5G before and
after; output ~6M). Frozen plan `docs/DEVELOPMENT_RESET_PROBE_V4_PLAN.md`:
last two unspent histories (6–7), identical design. Fixtures 32/32 green
pre-run. Single attempt, as measured.

## Results, histories 6–7 (candidate − arm; positive = candidate wins)
- Sequence vs unlearned: [−0.048, +0.678], mean +0.315, 1/2, survivors +2.
  developmentSignal FALSE.
- Probe acquiredA: [+0.014, +0.442], 2/2.
- vs frozen: [−0.217, +0.879], mean +0.331, 1/2, survivors 0.
- vs reset: [−0.622, +1.578], mean +0.478, 1/2, survivors +3.
- extendedDevelopmentSignal FALSE.
- Retention A/B FALSE/FALSE; transfer 1/2 ([+0.481, −0.309]).

## Final synthesis, all six full-horizon histories (2–7)
- vs unlearned (sequence): V2 1/2, V3 2/2, V4 1/2 → 4/6.
- vs frozen: 0/2, 2/2, 1/2 → 3/6, mean +0.039 (≈ noise).
- vs reset: 1/2, 2/2, 1/2 → 4/6, mean +0.194 (driven by one +1.578).
- acquiredA (probe-memory): 6/6 — the stable effect; present in every history
  including those where the sequence benefit is negative.
- Retention A/B: FALSE in all six; transfer: 1/6.
- Verdict: criterion 1 UNSATISFIED as a general claim. The memory effect is
  real at probe level but does not reliably translate to sequence-level
  lifetime benefit; the sign flips by history with no observable
  discriminator (zero-world analysis pre-run). No milestone changes.
  No RSI claimed. Development-grade only (qualified:false).

## Exhaustion
Per the frozen V4 plan, the reset question is now EXHAUSTED at dev scale:
bank fully spent for this question (0–1 short-horizon, 2–7 full-horizon).
No V5. Any further claim on criterion 1 requires the qualification
machinery (fresh qual bank + qual runner), not another dev probe.

## Preservation
`evidence/taste-development/dev-reset-probe-04/` (untracked raw evidence;
same audited bank).
