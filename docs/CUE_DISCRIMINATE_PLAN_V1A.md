# CUE-DISCRIMINATE plan amendment V1a (bank move: 386001 → 393001-393054)

Frozen 2026-10-29, BEFORE any bank build or execution. Amends V1 ONLY in
bank range + the SPENT record. Everything else (grid, bars, caps, fixtures,
discipline) stands untouched. No bank was ever drawn on 386xxx; nothing is
regenerated; no worlds are affected (none run yet).

## Why (verified read-only, disclosed in full)

V1 froze bank 386001–386054 as "fresh and union-excluded". It is not:
`evidence/m-pop-dev/attempt-01/protocol.json` lists the entire 386xxx range
in its `excludedSeeds`, so the union-exclusion scan hard-blocks any CUE bank
build on those seeds (`priorEvidenceSeeds` matches `excludedSeeds` keys).
The listing was over-broad (those seeds were reserved, never spent), but
committed ledgers are not rewritten — the exclusion stands as recorded, and
re-scanning my way around it would weaken the guarantee for everyone.
Cause: my own M-POP SPENT_RANGES included a range I had only earmarked for
CUE. Lesson recorded: reserve ranges in plans, never in other lines'
exclusion lists.

## Changes

1. Phase-A dev bank moves to deterministic fresh **393001–393054**
   (6 histories × 9). Verified clean in all three namespaces: zero literals
   in tests/scripts/docs, zero seed-key hits in evidence JSON, and no overlap
   with fixture seeds (390xxx test-only) or the R-GAP/S-GATE/M-GATE ranges.
2. `evidence/cue-discrimination-dev/fresh-01/` holds the bank +
   `fixture-seeds-01.json` (same post-build ordering, V1c precedent).
3. SPENT record gains `[386001, 386054]` explicitly marked RESERVED-UNBUILT
   (poisoned by M-POP record, never spent, never to be drawn without its own
   frozen plan explicitly overriding with cause).

## Explicitly not changed

Grid (4 arms × 6 histories = 24 mains, zero probes), collector, G1/G2/V1b
bars and thresholds, caps, fixtures, triage gate, single-attempt + V1d
crash-resume terms, no qual/rescoring. This amendment moves a street address,
not the study.
