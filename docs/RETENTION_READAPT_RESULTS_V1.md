# RETENTION-READAPT V1 verdict (2026-11-04) — INCOMPLETE-NOLEARN (void)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 2G before,
1G after — exogenous tightening, output only 1.1M; no further runs this
turn without freed disk). Frozen plan `docs/RETENTION_READAPT_PLAN_V1.md`.
New line (live readaptation, learning on — completes the frozen/live ×
fresh/same-world 2×2 as the live/same-world cell). Fixtures 6/6 green
pre-run (zero worlds; one NOGO-fixture repair pre-run, zero mechanism
impact); triage on throwaway 490010–490018 (both novel paths proven:
no-freeze switch + unfreeze); bank 474091–474108 minted post-triage,
verified clean. Single attempt, as measured. No rescoring.

## Results (pairs 474091, 474100; T = B-exposure ticks; live A-measure)
Pooled candidate vs matched live naive:
T512 0.276 vs 0.685; T640 0.417 vs 0.521; T768 0.499 vs 0.619;
T896 0.578 vs 0.612; T1024 0.483 vs 0.490.
Baseline 0.276 ≤ naive 0.685 ×1.1 → **INCOMPLETE-NOLEARN** (void —
no above-naive live A-skill even pre-B). G1 pass (20 mains, integrity
+ accounting clean).

## Reading (void with a convergent curve, not an empty one)
- The guard fires, but the during-B points are uniformly negative too:
  candidate < naive at ALL 5 T-values × 2 pairs (10/10). Even had the
  baseline passed, the verdict would be NOGO — the void is substantive,
  not a technicality.
- Curve texture (both pairs): candidate RISES with B-exposure (0.28 →
  0.58 by T896 — B-training improves subsequent live A-recovery), while
  naive DECAYS (0.69 → 0.49 — gobbling depletes); they converge at full
  B (0.483 vs 0.490, gap 0.007 from 0.41) but the candidate never
  crosses naive. B-experience restores live coping toward naive, never
  beyond it. (Mechanism speculative, unmeasured: A-training may teach
  low-vigor selectivity that hurts, B-training restores vigor; activity
  data not in rows — marked speculation, no claim.)
- 2×2 complete: frozen-fresh void (ceiling), frozen-same void (trained
  < naive 30/30), live-same void-with-negative-curve (this line, 10/10
  below naive). Retention appearance requires live relearning AND never
  exceeds naive relearning from scratch. The "skill in dynamics"
  synthesis holds in all four cells: dynamics recover (M-RELEARN),
  content never leads.
- Line CLOSED as voided. Disk flagged: C: at 1G (floor); further bounded
  runs require user-freed disk (escalate-if-blocks stands).

## Preservation
`evidence/retention-readapt-dev/fresh-08/` (bank, now spent) +
`evidence/retention-readapt-dev/attempt-01/` (untracked raw evidence, 1.1M).
