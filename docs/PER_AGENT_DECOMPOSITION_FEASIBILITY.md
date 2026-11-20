# PER-AGENT DECOMPOSITION FEASIBILITY — INFEASIBLE-AS-RECORDED (zero worlds)

Date: 2026-11-02. Analytic only (read frozen C8 rows; zero new
worlds, no rescoring). Question (from C8 RESULTS): do gain-voting
agents transfer worse individually?

## Finding: infeasible on stored rows (two independent blocks)

1. Votes lack agent identity: each looper row holds 72 vote records
   ({menuIndex, adopted} × 24 agents × 3 evals) with NO agentId.
   Positional reconstruction (insertion order × eval order) is
   deterministic but UNRECORDED as a contract — using it would be
   post-hoc attribution, fail-closed. Not used.
2. Outcomes are pooled: `summary.decisions` is a single int per run;
   per-agent transfer HB does not exist in the rows (would need
   per-agent cue+action joins with agentId in the collector).

Either block alone is fatal; both hold. No hypothesis is even
generable from these rows beyond the published pooled reading
(gain-minority dilutes pooled looper — already in C8 RESULTS).

## What a future line needs (C9 instrument requirements, if pursued)

- Votes carry agentId (recorded, not positional).
- Collector records per-agent decisions (agentId-keyed cue+action).
- Scorer computes per-agent HB then aggregates (documented join).
- Fresh plan + fresh bank (this analysis spends nothing and licenses
  nothing by itself).

## Standing

- C8's pooled verdicts stand unmodified. This note closes the
  "remaining" item from C8 RESULTS as INFEASIBLE-analytic (not
  postponed work — the data structure forbids it).
- Zero worlds. Cumulative unchanged (8291).
