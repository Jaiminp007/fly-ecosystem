# RETURN-NOVEL V1 verdict (2026-11-04) — NOGO (benefit is old-world familiarity)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 2G before and
after; output 1.1M). Frozen plan `docs/RETURN_NOVEL_PLAN_V1.md`. New
combination (backward-train → fresh-live-A-probe — not retention-during
frozen, not V1-transfer, not backward continuous). Fixtures 6/6 green
pre-run (zero worlds); no triage (frozen rationale: all ops verbatim
precedents); bank 474199–474234 minted post-fixtures, verified clean.
Single attempt, as measured. No rescoring.

## Results (pairs 474199→474208, 474217→474226; 256-tick live measures)
Guard passes: in-world return-A intact 0.330 vs naive 0.150 (2.2×, both
pairs — benefit replicates on fresh-13).
Fresh world: intact-transplanted 0.254 vs fresh naive 0.485 (intact loses
by ~half, both pairs same direction: 0.23 vs 0.49, 0.28 vs 0.48).
Verdict: **RETURN-NOVEL-NOGO-V1** — the benefit vanishes (reverses) on a
novel layout. G1 pass (4 mains + 4 probes, integrity + accounting clean).

## Reading (V1b confirmed by its own prediction)
- Same weights, same live learning, different worlds: +2.2× in the old
  world, ×0.5 in a fresh one. The only difference is world familiarity
  (positions/depletion/trajectory history). V1b's decomposition predicts
  exactly this: fresh world removes familiarity, weight-harm remains →
  intact < naive. It is now measured, both pairs, pre-registered.
- This closes the return-A arc: backward-GO (novel-mapping on a
  CONTINUOUS depleted world — positions/depletion carry over through
  enterCuePhase) vs return-novel-NOGO (fully fresh world — nothing
  carries over). The boundary is world-continuity, not mapping-novelty:
  re-laid cues on kept positions/depletion preserve the benefit; a new
  world erases it. Familiarity is positional/depletive, not cue-mapped.
- The master pattern holds at every scale tested: carried weights never
  beat naive on unfamiliar ground (transfer, retention-frozen, Gen1,
  and now return-novel). Learning's only demonstrated edge lives in
  continuous-world dynamics (backward, readapt-live curves).
- Line CLOSED as scored. No transfer/RSI/population claim.

## Preservation
`evidence/return-novel-dev/fresh-13/` (bank, now spent) +
`evidence/return-novel-dev/attempt-01/` (untracked raw evidence, 1.1M).
