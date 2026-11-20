# JOINT-BACKWARD-READAPT V1 verdict (2026-11-04) — JOINT-DISAGREE

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 2G before and
after; output 1.1M). Frozen plan `docs/JOINT_BACKWARD_READAPT_PLAN_V1.md`.
Joint instrument (both measures, same seeds — neither line run alone).
Fixtures 6/6 green pre-run (zero worlds); triage on throwaway 490037–
490045 (both imports wire, finite rates); bank 474163–474180 minted
post-triage, verified clean. Single attempt, as measured. No rescoring.

## Results (pairs 474163, 474172 — identical histories, both measures)
Backward-lite return-A: candidate 0.488 vs unlearned 0.132 (3.7× —
backward-positive reproduces, both pairs same direction).
Readapt ladder: baseline 0.386 vs 0.720 (fail); post-B 0.480 vs 0.437
(+9.8% — misses ×1.1 by 0.001); mean-during-B 0.457 vs 0.521 (fail) —
readapt-negative reproduces.
Verdict: **JOINT-DISAGREE** (return says retained, ladder says not).
G1 pass (24 mains, integrity + accounting clean).

## Reading (disagreement is instrument, not seeds — and it localizes)
- Same histories, opposite answers: seed luck is excluded. The axes that
  differ between the measures are now the finding: backward's return is
  a NOVEL layout (resourceSeeds[3]) at DEEP depletion (ticks 1536–1792)
  in a CONTINUOUS run; readapt's measures are the FAMILIAR layout
  (resourceSeeds[0]) at ≤1024 depletion in REPLAYED runs. Retention is
  not a property of weights alone but of weights×regime: the same
  training looks retained (novel+deep, skill binds) and forgotten
  (familiar+shallow, naive feasts) simultaneously.
- This refines the skill-in-dynamics synthesis rather than breaking it:
  dynamics express skill where the regime demands it (deep depletion) and
  naive gobbling wins where it doesn't (fresh/shallow). No line is
  wrong; each measures a different regime. A future line that varies ONE
  axis (e.g., depleted familiar-layout probes, or novel-layout ladder)
  would separate novelty from depth — noted as the axis, not a license.
- Post-B near-tie (0.480 vs 0.437) is preserved exactly: the readapt
  ladder's closest approach is still below the bar, consistent with
  readapt-V1's convergence-without-crossing.
- Line CLOSED as scored (comparison delivered; nothing further licensed
  by this verdict). No RSI/transfer/population claim.

## Preservation
`evidence/joint-backward-readapt-dev/fresh-11/` (bank, now spent) +
`evidence/joint-backward-readapt-dev/attempt-01/` (untracked raw evidence, 1.1M).
