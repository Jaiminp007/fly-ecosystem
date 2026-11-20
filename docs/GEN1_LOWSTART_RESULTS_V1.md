# GEN1_LOWSTART V1 verdict (2026-11-04) — VOID at triage (placement-10 colonies go extinct before birth; no bank minted, no attempt)

## Authorization
Program-level user authorization under standing discipline; frozen
plan `docs/GEN1_LOWSTART_PLAN_V1.md` with an explicit triage gate:
"if triage shows zero births, the line voids before any bank is
minted." Fixtures 7/7 green pre-run (zero worlds).

## Triage (throwaway 490496–490504, placement energy 10 for colonies)
- Digests move (A≠init, B≠A); placement verified e0=[10,10,10].
- Copy colony: extinct tick 643, 0 births. Mut colony: extinct tick
  643, 0 births. Naivekid colony: survives 900, 0 births (mating bar
  10 = founders' entire starting energy — nobody can afford to mate).
- The harsh regime kills the colony before birth on all three arms.

## Verdict
**VOID** (`GEN1-LOWSTART-VOID-V1`, logic INCOMPLETE-LOWBIRTHS at
triage): the manipulation that was supposed to remove cap waste
removed the colony instead — founders starting at 10 cannot fund
both foraging and the mating bar, so no offspring exist to score.
Per the frozen plan: void, no claim, no retune (lowering the mating
bar would be a second manipulation — mating economics, not placement
energy — and is not licensed here). No bank was minted (fresh-66
never created); no attempt was run; zero fresh seeds spent. The
triages seeds 490496–490504 are spent as triage.

## Reading
The mechanism question stands as answered by the addendum (cap waste
+ shared depletion, zero-world confirmed): placement energy cannot
be lowered into a viable regime without also changing mating
economics, so the "right regime" for the fate edge does not exist on
this substrate with these mating rules. A future line could test
low-placement WITH a lowered mating bar, but that is a different
experiment (two manipulations) needing its own frozen plan — not a
rescue of this one. Line closed as voided.

## Preservation
No evidence rows (nothing ran on a bank). Instrument
`scripts/gen1-lowstart-dev.mjs` + fixtures
`tests/gen1-lowstart-dev.test.mjs` committed as dev work products;
plan + this void note tracked.
