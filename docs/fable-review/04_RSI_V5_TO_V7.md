# 04. The stronger RSI test: V5, V6, V7 (2026-11-12 to 11-13)

## Common design

- **Level 0:** the fly taste program `{masks ⊆ Walsh terms 0..15, step, replays}`.
  - Every search starts from IDENTITY: all 16 terms, step 4, replays 1.
  - Worlds use short phases [160,160,160,64], with 24 flies.
  - **No fly ever dies in these worlds.**
- **Level 1:** a library of weighted moves.
  - A term move is (action ∈ {add, remove, keepOnly}) × (rank ∈ {evid,
    antiEvid, random, lowOrder, highOrder}) × (k ∈ {1,2,3,4,6,8}).
  - `evid` ranks terms by |evidence| from the flies' own recorded taste
    experience.
  - There are 4 hyper moves (stepUp/Down, replaysUp/Down).
  - The **seed library L0 holds only blind moves**: add/random/1,
    remove/random/1, keepOnly/random/1, plus the hyper moves.
  - During training, a move is **invented** with probability ρ by mutating
    one gene of a weighted-chosen library move.
  - After each training problem, weights are revised by the update rule U.
- **Update rule U** = {credit ∈ {count, gain, meanGain}, α, ρ, floor, β, power}.
  - Weight = (floor + (credit + 0.5α)/(tries + α))^power.
  - With meanGain: weight = (floor + exp(β·Σgain/(tries+α)))^power.
  - U0 = {gain, α 1, ρ 0.25, floor 0.2, β 20, power 1}.
- **Level 2:** search over U, scored on a validation bank of
  single-Walsh-term and majority rules.
- **Search acceptance at level 0:**
  - The candidate beats the incumbent on 6 dev histories: gain > 0 and ≥ 4/6
    wins.
  - Then a 2-evaluation confirmation on 6 fresh histories, by the same rule.
- **Test:** an unseen family of threshold rules (AND/OR of 2–3 raw odor
  bits; 3–7 unequal Walsh terms plus a bias).
  - Libraries are frozen.
  - Fresh training replicates use seeds 101–103.
  - Rows pair on (replicate, rule, search seed).
  - Score = balanced discrimination on 8 held-out histories.
- **"Passes"** = wins > losses, one-sided sign test p < 0.05, and a higher
  mean.

## Scoring amendment (made during V5, before its test)

The original `score` mixed in the base rate. Example: AND(1,2,3)− is mostly
"good", so accepting everything scored about 1.35. A balanced
`discrimination` was added and adopted:

> discrimination = P(accept|good) − P(accept|bad), within families that
> have both classes, then averaged.

This was disclosed as a pre-run amendment in `docs/RSI_V5_PLAN.md`, and
checked only on non-test seeds.

## V5 (plan `RSI_V5_PLAN.md` d8dfe3d → results `RSI_V5_RESULTS.md`; runner `scripts/rsi-v5.mjs`; 7,578 s)

**Training:**

- 4 training problems, each search chained from the previous winner.
- Level 2: a hill climb with 5 proposals, 1 training seed, and 12
  validation rows.

**Test:** bank 985001–985008, 48 pairs.

**C2 was defined differently here:**

- invented share > 50% of term-move weight;
- U0 vs L0 passes.

| Criterion | Result |
|---|---|
| C1 | U* = {count, ρ 0.5}. U* vs U0: 15–10, p = 0.21. **Fail** |
| C2 | Invented share 0.85 (met trivially: many moves sit near weight 0.45). U0 vs L0: 17–12, p = 0.23. **Fail** |
| C3 | Same comparison, p = 0.23. **Fail** |

- U* vs L0 was 18–7 (p = 0.022), but that comparison was not
  pre-registered.
- **Diagnosis:**
  - sparse credit (about 80 search steps; only accepted proposals earn
    credit);
  - flat weights;
  - the level-2 acceptances (4–2, 5–3) were weak.

## Design checks between V5 and V6 (dev bank 978001–978004; never the test family)

- Training on 8 problems, each from the identity start with budget 16, under
  U0, invented `keepOnly/evid/4` and ranked it top. It beat L0 8–2.
- meanGain credit did worse (6–2).
- Trained weights were flat (top 0.94, about 30 moves near 0.45).
  - Raising the same library to power 2 gave 11–0 (0.580 vs 0.477).
  - Power 4 gave 10–1.
- So `power` and `meanGain` were added to the U space. U0 stays at power 1,
  and level 2 has to find any improvement itself.

## V6 (plan `RSI_V6_PLAN.md` d6550ed → results `RSI_V6_RESULTS.md` b68c46c; `scripts/rsi-v6.mjs`; 16,344 s)

**Setup:**

- 8 training problems (970101–970108), searched from IDENTITY with budget 16.
- Validation bank 975101–975104 × 3 seeds, with 2 training seeds per U.
- Level 2 is a coordinate search with 6 proposals.
- Test bank 987001–987008: 3 replicates × 8 rules × 2 seeds = 48 pairs, at
  **evaluation budget 6**.
- **C2 was made harder:** U* vs U*-without-invention (ρ = 0) must pass, and
  the top-weighted term move must be invented in ≥ 2/3 replicates.

Level 2:

| Proposal | Validation result | Accepted |
|---|---|---|
| ρ → 0.1 | 6–17 | no |
| floor → 0.05 | 8–13 | no |
| **α 1 → 2** | **15–5** | **yes** |
| power 4 | 11–13 | no |
| credit → count | 2–7 | no |
| ρ → 0 | 3–17 | no |

Test:

| Criterion | Result | Verdict |
|---|---|---|
| C1: U* = {α 2} vs U0 | 14–7, 27 ties, p = 0.095; 0.484 vs 0.468 | **Fail** |
| C2: U* vs no-invention | 15–4, p = 0.0096; top move invented 3/3 | Pass |
| C3: U* vs L0 | 14–1, p = 0.0005; 0.484 vs 0.460; no-search 0.459 | Pass |

- No energy benefit. All 24 flies survive.
- The top invented moves differ between replicates: `keepOnly/random/3`,
  `keepOnly/lowOrder/3`, `remove/random/2`.
- Diagnosis for C1: many ties, because a budget of 6 often ends with no
  accepted proposal.

## V7 (plan `RSI_V7_PLAN.md` fb1df23; runner `scripts/rsi-v7.mjs`)

**Changes after V6 (disclosed as design iteration):**

- Evaluation budget 6 → 12.
- 72 test pairs (3 replicates × 8 rules × 3 seeds).
- Fresh test bank 989001–989008:
  - AND(0,2)−
  - OR(0,3)−
  - AND(1,2)+
  - OR(2,3)+
  - AND(1,2,3)+
  - OR(0,1,3)−
  - AND(0,2,3)−
  - OR(0,1,2)+
- Level 2 continues from V6's rule {α 2}, proposing untried single-gene
  neighbours (4 proposals). The criteria are unchanged.

**Infrastructure events (disclosed in the plan):**

1. **First launch.** Two pool workers died with `DataCloneError: out of
   memory` (machine memory pressure), and the run hung.
   - The Pool now respawns dead workers and requeues their jobs (`312ae3d`).
   - A test showed the retried result is identical.
   - The run restarted from scratch with 6 workers.
2. **Second launch.** It was killed by a machine reboot during test
   replicate 102.
   - A `resume` mode reuses the logged level-2 outcome. Level 2 is
     deterministic.
   - Test work is now checkpointed (`13ce0b7`).
   - The whole test was recomputed. Replicate 101's four library means
     reproduced to every digit, which confirms determinism.

**Level 2:** all 4 proposals were rejected.

| Proposal | Validation result |
|---|---|
| α 0.5 | 9–12 |
| floor 0.5 | 10–14 |
| power 2 | 10–14 |
| ρ 0.5 | 11–12 |

So U* = {gain, α 2, ρ 0.25, floor 0.2, power 1}, which is V6's rule.

Note: power 2 lost at level 2 even though it won 11–0 in the dev-bank check.

**Test results (full detail in `docs/RSI_V7_RESULTS.md`):**

| Replicate | L0 | U0 | U* | U*-no-inv | U* vs U0 | U* vs no-inv | U* vs L0 |
|---|---|---|---|---|---|---|---|
| 101 | 0.471 | 0.469 | 0.517 | 0.471 | 13–5 | 10–4 | 10–4 |
| 102 | 0.472 | 0.467 | 0.467 | 0.472 | 8–7 | 7–9 | 6–8 |
| 103 | 0.470 | 0.468 | 0.469 | 0.466 | 6–5 | 5–6 | 5–5 |

| Criterion | Result | Verdict |
|---|---|---|
| C1 | 27–17, p = 0.087 | **Fail** |
| C2 | 22–19, p = 0.38 | **Fail** |
| C3 | 21–17, p = 0.31; no-search 0.451 | **Fail** |

- No energy benefit.
- Survivors were 23.98 of 24 in every arm.

**Key audit finding.** Training is deterministic, and V7 reused V6's
training problems, training seeds (101–103) and U*. So V7's trained
libraries are identical to V6's: the top moves are `keepOnly/random/3`,
`keepOnly/lowOrder/3` and `remove/random/2`, exactly as in V6.

- V6's passes and V7's failures therefore rest on the same 3 libraries.
- Only the library from replicate 101 is good.
- The V6 passes look like library-specific luck plus a small budget.

**V7: RSI not met (0 of 3).**
