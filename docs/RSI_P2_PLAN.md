# RSI P2 plan (dev check authorised; test NOT yet authorised)

Date: 2026-11-14. This is the verdict agreed between Claude Opus and Fable 5.2
in the review thread, after the user asked them to converge. It is
[FABLE_REVIEW.md](fable-review/FABLE_REVIEW.md) step P2 with Fable's 10
required edits. P1 is in [P1_SKILL_MATTERS_RESULTS.md](P1_SKILL_MATTERS_RESULTS.md),
including its correction.

Runner for the dev check: `scripts/rsi-p2-dev.mjs`. It is committed with
this plan, before the run.

## Scope and shared setting

- **World:** long default phases (512/512/512/256), 24 flies, toxin 1,
  nutrient 1.
- **Decision:** `tasteDecisionMode: 'threshold'`. This changes the fly's
  decision policy. Every arm shares it.
  - It removes decision noise.
  - It removes exploration: a refused odor gives no taste example.
- **Objective (search and scoring):** energy per founder. Survivors and
  discrimination are reported only.
- **Rules:** only single Walsh terms (base rate 0.5) and three-quarter-good
  2-bit gates, AND− and OR+ (base rate 0.75). One-quarter-good rules
  (AND+, OR−) are excluded because they are extinction worlds.
- **Not claimed:** invention, and level 2. The 90-move grammar plus 4 hyper
  moves is hand-written, and the system learns weights over it. That is
  selection.

## Update rule (frozen)

- **Library:** per move, {n, sum, sumSq} of the **dev energy gain** of every
  proposal of that move. Every tried move is credited, not only accepted
  ones.
- **Training search:** before each proposal, every move gets a Thompson
  sample θ = sum/(n+1) + sqrt(σ²/(n+1))·z, with z ~ N(0,1).
  - This is a prior mean of 0 with N0 = 1 pseudo-observation.
  - σ² is the pooled variance of all gains in the library. It is 4
    (σ0 = 2) until 2 gains exist, and is floored at 0.25.
  - Untried moves have n = 0.
  - Moves are tried in descending θ order, and the first one that yields
    an untried, valid program is proposed.
  - Stats update online, after every proposal.
- **Test and eval:** the library is frozen, with the same Thompson ordering
  and no updates.
- **Level-0 acceptance** (unchanged, kept on purpose):
  - dev gain > 0 and ≥ 4/6 wins on 6 dev histories;
  - then confirmation on 6 fresh histories by the same rule (2 evaluations).
- **Start:** the identity code (16 terms, step 4, replays 1).

## Step 1: dev check (authorised)

**Training:**

- 6 libraries. Library L has its own training bank: 8 rules drawn by its
  own RNG (seed 994000 + 97L) from the allowed pool, excluding the dev
  rules, with bank seeds 994000 + 10L + i.
- Search seeds: (bankSeed·31 + L). Budget 16.
- The runner refuses to continue if two libraries hash the same.

**Evaluation:**

- **Dev rules** (bank 994901–994906): s3+, s9−, s6+, AND(0,2)−, OR(1,3)+,
  OR(0,3)+.
- **Arms:**
  - A1–A6: trained libraries, frozen;
  - B1–B6: the same grammar with uniform order. Each B_L runs with the
    same eval seed as A_L, (bankSeed·7 + L), so every library difference
    has its own B draw;
  - O (oracle): uniform over `keepOnly/evid/k` for all k, plus the hyper
    moves;
  - the no-search identity code.
- Budget 8, final energy on 8 held-out histories. O and identity use seed
  L = 1.
- Training banks are filtered against the dev rules by name only. They may
  contain sign-flipped or same-support versions of dev rules (for example,
  s3− when s3+ is a dev rule). This is accepted because a library holds no
  rule-specific state.
- The smoke run (1 library, 1 rule) used real dev-check seeds (training bank
  994010, dev rule 994901). This is disclosed. Determinism means the smoke
  run cannot change any full-run result.

**Dev gate.** All of these must hold:

1. O − B ≥ 1.5 energy per founder, where B is the mean of all 36 B rows.
2. A_L − B_L > 0 for at least 5 of the 6 libraries.
3. The mean of A_L − B_L is ≥ 1.0.
4. **Power:** the required number of libraries,
   ⌈10.03·(sd/mean)² + 2.7⌉ for a one-sided α = 0.01 test at 80% power,
   with a small-n correction, from the 6 library differences, is ≤ 12.

Whether `keepOnly/evid/k` ranks first is reported, not gated.

**If the dev gate fails, the taste-program RSI line ends.** Nothing more
is run on it.

## Step 2: test (only if the dev gate passes; frozen separately before it runs)

**Stage 1:**

- 12 new independent libraries (A) vs the uniform grammar (B).
- 12 unseen allowed rules with fresh banks, budget 8 (or as frozen).
- Final energy on 8 held-out histories.
- **Unit:** the library, as the mean over its rules. Exact one-sided
  sign-flip test on the 12 paired differences.
- **R1:** A beats B at p < 0.01, and the mean A − B is ≥ 1.0.
- **R3:** A beats no-search identity at the library level, and the mean
  A − B is ≥ 1.0. Report the fraction of the O − B gap captured. Survivors
  are reported, not gated.
- **A − B below 1.0 ends the line, even if p < 0.01.**

**Stage 2** (only if R1 passes):

- Arm C: generation 2, trained from A's weights on a second fresh training
  bank.
- Control C′: trained from scratch on both banks, so it has the same total
  data.
- **R2, "continued learning helps":** C beats A. C beating C′ is reported
  as the test of whether the order of learning matters. The word
  "compounds" is not used.

## Stopping rule for the taste-program RSI line

Any of these ends the line:

- the dev gate fails;
- R1 fails;
- mean A − B < 1.0.

If R2 fails, it is reported as "learning helps but continued learning does
not", and the line stops.

## Compute

- The dev check takes about 5.5 h on 4 workers (smoke: about 2 s per long
  world, wall time). It is checkpointed, and the checkpoint key hashes the
  config and the code of the runner, the evaluator and the engine.

Fable's pre-run review of `a8f3678` returned NO-GO with 5 fixes (separate B
draw per library, power correction, code hash in the checkpoint key, and two
disclosures). All 5 are applied in the next commit.
- Stage 1 of the test takes about 10–13 h.
