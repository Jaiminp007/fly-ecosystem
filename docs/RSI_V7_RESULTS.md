# RSI V7 results: FAILED all three criteria

Plan: [RSI_V7_PLAN.md](RSI_V7_PLAN.md), committed in `fb1df23` before the
run, with infrastructure restart notes (`312ae3d`, `13ce0b7`). Evidence:
`evidence/rsi-v7/run-v7.{json,log}` and `run-v7.json.ckpt.json` (local).
Test runtime 16,192 s after the resume. Fresh bank 989001–989008, 72 pairs
per comparison, budget 12.

## Outcome

U* = {gain, α 2, ρ 0.25, floor 0.2, power 1}, which is V6's rule. All 4 new
level-2 proposals were rejected on validation.

| Criterion | Result | Verdict |
|---|---|---|
| C1: U* vs U0 | 27–17 (28 ties), p = 0.087, mean 0.484 vs 0.468 | **Fail** |
| C2: U* vs U*-no-invention | 22–19, p = 0.38, mean 0.484 vs 0.470. Top move invented in 3/3 replicates | **Fail** |
| C3: U* vs L0 | 21–17, p = 0.31, mean 0.484 vs 0.471. No-search score is 0.451 | **Fail** |

Reported, not gated:

- U0 vs L0: 15–26.
- No energy benefit in any comparison.
- Survivors were 23.98 of 24 in every arm. One fly died in the whole test.

## By replicate: the whole effect is replicate 101

| Replicate | U* vs U0 | U* vs no-inv | U* vs L0 | U* mean | L0 mean |
|---|---|---|---|---|---|
| 101 | 13–5 | 10–4 | 10–4 | 0.517 | 0.471 |
| 102 | 8–7 | 7–9 | 6–8 | 0.467 | 0.472 |
| 103 | 6–5 | 5–6 | 5–5 | 0.469 | 0.470 |

## Audit finding: V6 and V7 used the same trained libraries

Training is deterministic. V7 used the same training problems, the same
training seeds (101–103) and the same U* as V6, so it rebuilt **identical**
trained libraries. U*'s top moves per replicate are the same as V6's:

- 101: `keepOnly/random/3`
- 102: `keepOnly/lowOrder/3`
- 103: `remove/random/2`

So V7's "fresh training replicates" were not fresh. Only the test rules and
search seeds were new.

This changes how V6 should be read. V6's C2/C3 passes and V7's failures both
come from the same 3 libraries, tested on different rules. With a larger
budget and a different test bank, the advantage holds only for the
replicate-101 library. The V6 passes therefore look like library-specific
luck plus a small budget, not a robust effect of invention or of the rule.
The real unit of evidence is the trained library (n = 3), not the row.

## Which move carries the effect (added 2026-11-14, from the review)

| Accepted move in test searches | Times accepted | Mean gain over no-search |
|---|---|---|
| `keepOnly/evid/3` (replicate-101 U* library only) | 9 | +0.155 |
| `stepUp` | 83 | +0.046 |
| `remove/random/1` | 26 | +0.022 |

- U* vs L0 rows that accepted `keepOnly/evid/3`: 9–0.
- All other rows: 12–17.

The gain is one evidence-guided move, essentially V4's hand-written
`guidedReduce`, which one library out of three picked up from a single
training acceptance. It is not evidence that invention helps in general.

## Reading

- The level-2 search found nothing better than α 2 on validation. Power 2,
  which won 11–0 in the dev-bank check, lost 10–14.
- With budget 12, both U0 and L0 searches close most of the gap. In every
  arm the score sits about 0.46–0.52 against a reachable 0.6–0.68.
- **RSI not met.** The pre-registered rule needs all three criteria.
