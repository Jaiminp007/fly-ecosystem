# MEMORY-RESET PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Question
The joint world showed return-A candidate > unlearned (0.49 vs 0.13).
Is that benefit carried in memory (weights/store)? Reset memory at
return-A start: does the benefit disappear? Against unlearned.

## Why this design (not the closed dev reset-probe)
- Dev reset-probe asked whether CONTINUED-LEARNING benefit disappears
  under reset (criterion-1, dev-bank, horizon-capped) — voided/closed.
- This asks whether the RETURN-A benefit (joint-replicated, backward
  paradigm, full-horizon) disappears under reset at return-A start.
  Different question (return-A memory, not continued-learning benefit),
  different paradigm (backward A/B/C/return, not dev-bank), different
  reset (mid-run weights×store factorial at tick 1536, not the dev
  reset). No overlap with the closed line.
- Factorial (weights × store) + intact + unlearned = 5 arms: isolates
  WHERE the memory lives if the benefit disappears (weights-only vs
  store-only vs both), or rules memory out (survives full wipe →
  elsewhere: positions/world/depletion familiarity). The engine reset
  wipes both (read pre-freeze), so the singles are manual ops —
  disclosed, fixture-tested.

## Design (5 arms × 2 histories = 10 mains, 1792 ticks)
- Arms (all arm 'candidate' except unlearned; BT options; auto phases):
  intact (nothing — replicates backward candidate); wreset (zero taste/
  actor/critic weights at 1536, store kept); sreset (clear recent/older/
  olderSeen at 1536, weights kept); both (engine resetTasteEnergyBody at
  1536 — full wipe, precedented); unlearned (arm 'unlearned', naive).
- Run: advance(1536) [A/B/C], apply per-arm op to all learners,
  advance(256) [return-A]. Metric: segmentRates retA food rate (imported
  backward core — same measure that showed the benefit).
- Bank: fresh-12, 474181–474198 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. No triage runs (justified: intervention
  ops are zero-tick fixture-covered state ops; split-advance is
  readapt-precedented; no novel engine interaction). Caps: BT. Single
  attempt. Disk floor 1 GB.
- Verdict (pooled n=2, margin 1.1): guard intact retA > unlearned retA
  ×1.1 else INCOMPLETE-NOBENEFIT (void — benefit didn't replicate,
  nothing to erase). Else GO (`MEMORY-RESET-GO-V1`) iff both-reset retA
  ≤ unlearned ×1.1 (full erasure — benefit is memory-dependent);
  else NOGO (`MEMORY-RESET-NOGO-V1`) — benefit survives full wipe
  (memory-independent). Descriptive 2×2 (w-only, s-only effects)
  regardless. No transfer/RSI/population claim.
