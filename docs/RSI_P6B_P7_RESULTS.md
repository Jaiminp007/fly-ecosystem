# RSI P6b and P7 results: both FAILED

Plans: [RSI_P6B_PLAN.md](RSI_P6B_PLAN.md) and [RSI_P7_PLAN.md](RSI_P7_PLAN.md), frozen in `3de971e`. Data: `evidence/rsi-p6b/run.json` and `evidence/rsi-p7/run.json` (gitignored).

## P6b: replication of the level-2 revision (U* = N0 2 vs U0), 32 libraries, fresh banks

- Mean U* − U0 was **+0.60** (sd 3.09). 12 libraries came out positive, 10 negative and 10 tied. Monte Carlo sign-flip **p = 0.144**.
- **R1 fails.** P6's +3.29 did not replicate. **Level 2 is not shown**: the hill climber's revision of the update rule does not reliably help.
- Per the plan, there will be no further replications of this U*.

## P7: do surrogate-found programs help the embodied fly? 12 embodied rules, 16 histories each

| rule | A (self-improving search) | B (blind search) | S0 | staircase terms in A / B |
|---|---|---|---|---|
| e1− | −48.98 | −47.54 | −47.75 | 2 / 1 |
| e2− | −62.14 | −62.53 | −63.29 | 3 / 2 |
| e3− | −62.44 | −62.42 | −62.93 | 3 / 1 |
| e4− | −64.64 | −64.15 | −64.16 | 3 / 2 |
| e5− | −56.74 | −56.77 | −56.67 | 3 / 1 |
| e6− | −58.14 | −55.95 | −54.83 | 2 / 1 |
| e7− | −62.44 | −61.27 | −62.27 | 3 / 2 |
| e8− | −50.10 | −52.14 | −50.50 | 3 / 1 |
| e9− | −58.58 | −60.79 | −60.26 | 4 / 1 |
| e10+ | −46.99 | −46.67 | −47.84 | 3 / 1 |
| e11− | −56.16 | −57.17 | −57.17 | 3 / 1 |
| e12+ | −46.57 | −46.12 | −44.35 | 3 / 1 |

| Criterion | Needed | Got | |
|---|---|---|---|
| E1: embodied A − B | ≥ 1.0, p < .05 | **−0.03**, p = 0.53 (5/12 positive) | FAIL |
| E2: embodied A − S0 | ≥ 1.0, p < .05 | **−0.16**, p = 0.64 (6/12 positive) | FAIL |

What this shows:

- The self-improving search does find structurally better taste programs. A contained 2–4 of the 4 true staircase terms on every rule, while B contained 1–2.
- Those better programs do not change embodied energy.
- This matches the standing review finding H4 ([FABLE_REVIEW.md](fable-review/FABLE_REVIEW.md)): in these worlds, taste skill barely moves energy or survival.
- So the embodied benefit is blocked by the world, not by the search. Better taste does not buy energy here.

## Where the RSI line stands after P5–P7

| Part of the RSI goal | Status | Evidence |
|---|---|---|
| Learned search beats blind search on unseen problems | **Shown** (surrogate) | P5 test: 12/12, p = 0.00024 |
| Invents its own moves | **Shown** (surrogate) | P6 C2: 10/12 invented top move, +9.2, p = 0.0012 |
| Transfers to an unseen rule family | **Shown** (surrogate) | P6 C3: +14.9, p = 0.00024 |
| Revises its own update rule (level 2) | **Not shown** | P6 C1 p = 0.082; P6b replication p = 0.144 |
| Benefits the embodied fly | **Not shown** | P7: A − B −0.03, A − S0 −0.16 |

Every positive result above comes from the surrogate evaluator, on constructed tasks, using hand-written primitive genes.

## Follow-up probe: does harsher toxin pressure make taste quality pay? (exploration, non-bank seeds 90001–90003)

Embodied energy per founder, 8 histories, four programs:

- S0: the start program;
- S0+T: S0 plus the true staircase terms;
- T: the true staircase terms alone;
- bias: a constant-only program that cannot discriminate.

| toxinScale | S0 | S0+T | T | bias |
|---|---|---|---|---|
| 1 | −52.1 / −39.4 / −47.6 | −50.0 / −38.9 / −45.9 | −50.4 / −37.9 / −45.8 | −61.2 / −53.4 / −54.6 |
| 3 | −60.4 / −46.0 / −55.9 | −59.6 / −44.3 / −55.7 | −60.3 / −44.0 / −55.8 | −63.0 / −57.3 / −58.2 |
| 6 | −63.3 / −53.5 / −60.5 | −63.0 / −52.6 / −59.9 | −64.0 / −49.3 / −59.0 | −63.8 / −61.1 / −59.7 |

- Having *some* taste learning matters a lot: bias-only loses 8–14 energy at toxinScale 1.
- Better taste *structure* barely matters: S0 → the true terms gains +0.5 to +2.1 at toxinScale 1.
- More toxin does not widen that gap. The worlds just get more lethal.

So the embodied benefit is capped by the world. With only 12 odors per run, the generic start program already discriminates them nearly as well as the correct structure does. A world where taste structure pays would need many more odors per lifetime, so that generalisation across unseen odors matters.

That is an engine and world change (the 16-pattern cue codebook), not an RSI search change.
