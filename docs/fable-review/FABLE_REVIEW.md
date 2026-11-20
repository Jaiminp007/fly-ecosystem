# Independent review of the RSI program (V1–V7)

Reviewer: Claude Fable 5.2. Date: 2026-11-14. Scope: `docs/fable-review/00–07`,
`docs/VISION.md`, the V1–V7 plans, results and runners, the evaluator and
taste learner, the raw data in `evidence/rsi-*`, and `git log`.

Nothing in the repo was modified. This file is the only one created.

## Summary

1. **The bookkeeping is honest.** Every number in the V5–V7 results docs
   reproduces from the raw rows. Plans were committed before runs. The V7
   resume and checkpoint did not bias anything.
2. **V6's two passes were not real.** Tested at the level of the trained
   library or the test rule, they do not reach significance. The whole
   positive signal in V6 and V7 is one move, `keepOnly/evid/3`, which one of
   three libraries happened to pick up. That move is the grammar's spelling
   of V4's hand-written `guidedReduce`.
3. **The C2 and C3 comparisons cannot show what they claim.** The baseline
   library is restricted to one-term moves, so any library with larger moves
   can beat it. "Invention helps" was never separated from "a bigger move
   set helps".
4. **The substrate cannot reward better learning.** In these worlds a fly
   with zero taste discrimination gets the same energy and the same survival
   as a fly with the correct code, in short worlds and in long ones. No RSI
   design can show an embodied benefit here until that changes.
5. **Recommended order of work:** fix the claims, then make taste skill
   matter for survival, then run one properly powered RSI test with the
   library as the unit and a pre-agreed stopping rule.

## How I checked

- Read all sources listed above.
- Recomputed every paired comparison in V5, V6 and V7 from `rows`, split by
  replicate and by rule, and counted distinct final programs.
- Compared V6 and V7 libraries, the V7 checkpoint against the final JSON,
  and the three V7 logs against each other.
- Rebuilt each test history's codebook from its seed (pure functions, no
  simulation) to count how many odor families can be scored.
- Ran one small diagnostic of 72 short and 18 long worlds on scratch seeds
  starting at 991777 (V5's probe bank), comparing the identity code,
  the correct code and a bias-only code. It is **not** a pre-registered
  result. It crashed on the last rule (see finding M4), so the long-world
  part covers one rule and 6 histories. Treat it as a pointer, to be
  repeated properly in step P1 below.

## A. Audit findings

### High severity

**H1. The sign tests use the wrong unit, and V6's passes disappear at the
right one.**
Rows share 3 trained libraries and 8 rules. The same rule also shares its
dev, confirmation and final histories across all rows. V6, recomputed from
`evidence/rsi-v6/run-v6.json`:

| V6 comparison | Row-level (as reported) | Mean difference by replicate 101 / 102 / 103 | By rule (positive / negative / zero) |
|---|---|---|---|
| C3: U* vs L0 | 14–1, p = 0.0005 | +0.054 / +0.016 / +0.003 | 5 / 1 / 2 |
| C2: U* vs no-invention | 15–4, p = 0.0096 | +0.054 / +0.012 / +0.003 | 5 / 1 / 2 |
| C1: U* vs U0 | 14–7, p = 0.095 | +0.051 / −0.002 / +0.001 | 6 / 1 / 1 |

With three libraries the smallest possible one-sided p is 0.125. By rule,
5 of 6 non-zero is p = 0.11. Six of the 14 wins in C3 come from one rule,
OR(0,2)−. The briefing raises this as a question (flag 3). It is a
finding: the V6 "pass" verdicts should be withdrawn, not just qualified.

**H2. The effect is one move, and that move is V4's hand-written operator.**
Accepted test moves and their mean gain over the no-search score
(`rows[*].ops`, V7):

| Accepted move | Times accepted | Mean gain |
|---|---|---|
| `keepOnly/evid/3` | 9 | +0.155 |
| `stepUp` | 83 | +0.046 |
| `remove/random/1` | 26 | +0.022 |
| all other moves | 1–13 each | +0.01 to +0.12 |

`keepOnly/evid/3` is in the replicate-101 U* library only (weight 0.681).
It accounts for all 9 of those acceptances in V7 and all 5 in V6. Its
weight came from a single training acceptance (`train-maj186+`, confirmed
gain 0.09). The results docs name the top-weighted move
(`keepOnly/random/3`) and say the help "comes from inventing moves that
propose small codes, not from rediscovering V4's guided move"
(`RSI_V6_RESULTS.md`, Reading). The data say the opposite.

**H3. C2 and C3 compare against a baseline built to lose.**
`seedLibrary()` (`scripts/rsi-v7.mjs:24`) has three term moves, all with
k = 1. From the identity start `add` has nothing to add and
`keepOnly/random/1` almost never works, so L0 can only remove one random
term or change step and replays. The no-invention arm keeps exactly those
moves. So C2 and C3 test whether a library with multi-term moves beats one
without. They do not test whether learned selection of moves helps. The
missing controls are (a) the full 90-move grammar with uniform weights, and
(b) a library of the same size with randomly chosen moves.

The C2 side condition (top move invented in at least 2 of 3 replicates) is
met by counting alone: trained libraries hold 9–15 invented term moves
against 3 seed ones, with near-flat weights (0.45–0.73). This repeats the
flaw V5's results doc had already identified in its own invented-share
condition.

**H4. Taste skill does not affect energy or survival.**
From existing rows: energy differs by 25–29 units between rules (about −8
for mostly-good rules, about −36 for mostly-bad ones) and by at most 1.5
units between programs within a rule. The correlation between a program's
discrimination and its energy within a rule ranges from −0.73 to +0.99
across rules, with no consistent sign.

From the diagnostic (6 histories per cell):

| World | Code | Discrimination | Survivors of 24 | Energy |
|---|---|---|---|---|
| Short, AND(0,2)− | bias only | 0.000 | 24 | −15.09 |
| Short, AND(0,2)− | identity | 0.463 | 24 | −14.41 |
| Short, AND(0,2)− | correct | 0.683 | 24 | −14.12 |
| Short, OR(0,3)− | bias only | 0.000 | 24 | −31.33 |
| Short, OR(0,3)− | identity | 0.497 | 24 | −33.25 |
| Short, OR(0,3)− | correct | 0.645 | 24 | −31.92 |
| Long (default phases), AND(0,2)− | bias only | 0.000 | 18.83 | −38.31 |
| Long, AND(0,2)− | identity | 0.592 | 18.17 | −37.70 |
| Long, AND(0,2)− | correct | 0.706 | 18.17 | −38.46 |

A fly that cannot tell odors apart does as well as one with the correct
code. The score being optimised is a readout of the learner's predictions
(`predictTargetTaste` over the codebook), not behaviour. V4's energy result
is real but small: +0.34 on a deficit of about −22, and it rests on 12
distinct final programs over 12 rules, not 50 independent pairs.

### Medium severity

**M1. Half the test bank carries almost no signal.**
Each history uses 12 of the 16 odors, in 3 families of 4
(`learning/cue-foraging.mjs:22`). Discrimination is scored only within
families that contain both classes. A 3-bit AND or OR has 2 minority odors
in 16, so on average 1.1–1.5 families per history can be scored, and some
histories have none and score exactly 0 for every program. Counts for V7's
final histories: AND(1,2,3)+ 1 of 8, OR(0,1,2)+ 1 of 8. The result is
visible in the rows: AND(1,2,3)+ ties 9–0–0 in every comparison and
OR(0,1,3)− ties in all but two rows. In the diagnostic the correct code
gains +0.06 to +0.11 on 3-bit rules against +0.15 to +0.22 on 2-bit rules.
The stated headroom of 0.6–0.68 applies to 2-bit rules only.

**M2. Level 2 selects on noise.**
The acceptance rule is "mean higher and wins > losses" on 24 rows from 2
libraries, with no threshold and no confirmation. Under no true difference
that passes roughly 4 times in 10, so over 6 proposals an acceptance is
close to certain. V6's accepted α = 2 was 15–5 on validation. Power 2 won
11–0 on the dev bank and lost 10–14 on validation. C1 therefore tests a
near-random neighbour of U0 with one library per replicate, and has almost
no power whatever the truth is.

**M3. The update rule cannot concentrate weight.**
`weightOf` gives an untried move `floor + 0.5` = 0.7 and a move with one
confirmed acceptance about 0.5–0.95. Training yields 5–9 acceptances over
about 100 proposals. The most useful move in the data sits second in its
library and is absent from the other two. The rule is a smoothed hit rate
over too few events. No setting in `U_SPACE` fixes that.

**M4. Latent crash and silent NaN in the evaluator.**
`evaluateOne` returns `{score: 0, alive: 0, ...}` with no `discrimination`
field when phase C's anchor is missing
(`learning/taste-program-eval.mjs:38`). Every V5–V7 runner then averages
`x.discrimination`, giving NaN, and every comparison against NaN is false.
The diagnostic hit this on a long world. It did not occur in V5–V7 because
no population died out, but it will occur as soon as worlds get harsh.

**M5. "Transfer to an unseen family" is narrower than it sounds.**
Training rules (single Walsh term, majority of three terms) and test rules
(AND and OR of raw bits) are all sparse in the Walsh basis. The `evid`
ranking was written to find sparse Walsh support. What transfers is the
designer's prior, not something the system learned.

**M6. Forking paths across versions.**
V5, V6 and V7 changed the U space, budget, test size and C2's definition
after each result, and "all three criteria" was tested three times with no
correction. Each version used a fresh test bank and disclosed the changes,
so this is a weakness in the overall claim, not misconduct. The dev-bank
"sharpcheck" (11–0 for power 2) was one library on one bank and should not
have been read as evidence that a better rule exists.

### Low severity

- **L1. VISION.md is internally stale.** The header says "Milestone status
  (2026-11-08)" but the table runs to 11-13. The prose above it says
  "Continual retention across distinct tasks remains open", and the table
  says it is met. The RSI row still reports V6's 15–4 and 14–1 as passes
  before taking them back.
- **L2. `RSI_SEARCH_RESULTS_V1.md` says "Bounded RSI is partially
  demonstrated"** and `RSI_GUIDED_RESULTS_V1.md` is titled "gate PASSED".
  Both predate the user's objection and neither carries a note pointing to
  the later verdict.
- **L3. Briefing doc 05 says no bank was reused for a test.** True for test
  banks. Training and validation banks, training seeds and U* were all
  reused from V6 to V7, which is why the libraries are identical. Doc 04
  says this; doc 05's table header does not.
- **L4. Confirmation histories are not independent draws.** Each
  confirmation advances the seed by one step and regenerates
  (`rsi-v7.mjs:94`), so successive sets reuse the same underlying values in
  shifted roles. The worlds differ, so I do not think it biased anything.
- **L5. The V7 checkpoint key omits U and the config** (`${rep}|${n}`). A
  stale file from a run with a different U* would be reused silently. It
  was not in this case.

### Checked and found sound

- **Numbers.** All wins, losses, ties, p-values and means in the V5, V6 and
  V7 results docs match the raw rows. The sign test implementation is
  correct.
- **Pre-registration.** Plan commits precede the run files: V5 plan
  10:30:30 and smoke 10:27 (smoke bank 990500, not the test bank); V6 plan
  13:23:54; V7 plan 18:03:25, with its first level-2 line logged 1,581 s
  into a run whose log was last written at 19:00.
- **V7 resume.** The level-2 lines in `rebooted-run-v7.log` are identical
  to the crashed run's first two lines and to the final JSON's `meta`. No
  proposal was accepted, so the reused outcome leaves U* at V6's value. The
  code diff `fb1df23..13ce0b7` changes only pool size, the resume read and
  the checkpoint. Replicate 101's four means reproduce to 16 digits.
- **V7 checkpoint.** All 12 row blocks in `run-v7.json.ckpt.json` equal the
  final JSON, and its 9 training keys are the expected ones.
- **V6 and V7 libraries are identical**, all 9, as the results doc says.
- **V4's energy gain is not a billing artifact.** Sparse codes without the
  rule term gain nothing (−0.08); sparse codes with it gain +0.53.

## B. Judgment

**What has been shown.**

- A search loop with dev and confirmation gates can make confirmed changes
  to the fly's taste code (V1–V4).
- A hand-written move that reads the flies' own experience and keeps the
  best-supported Walsh terms solves sparse-rule worlds: V4 recovered the
  rule in 72 of 72 searches. Reweighting a 10-move menu toward that move
  works when the move is in the menu from the start.
- The correct small code raises the discrimination readout by 0.15–0.22 on
  2-bit rules.

**What has not been shown.**

- That a revised update rule beats the default one (C1: never).
- That learned move selection beats an unlearned move set of the same
  coverage (C2: not tested by the design).
- That anything learned in training carries to new rules beyond the
  hand-written prior (C3: same).
- Any benefit to survival, and any energy benefit outside V4's +0.34.

**Is C1/C2/C3 sound?** The three ideas are reasonable. The
operationalisation is not. C2 and C3 lack the controls in H3. C1 asks for a
second-order effect when the first-order one is +0.01 to +0.02. And none of
the three asks for the property that makes self-improvement recursive:
that round n+1 improves more, or faster, than round n. V4's "v1 beats v0,
v2 beats v1" was closer to that than anything in V5–V7.

**Is the program in a near-miss loop?** Yes. p = 0.095 (V6 C1) and
p = 0.087 (V7 C1) are the same three libraries tested twice, with the same
replicate carrying both. The loop continues because each version changes
budget and row count, which moves row-level p-values without changing the
number of independent libraries.

**Machinery or substrate?** Both, in sequence.

- For the discrimination score, the limit is the machinery. Headroom of
  +0.2 exists on 2-bit rules and one move captures it. The update rule
  cannot find that move reliably from about 8 acceptances per library (M3).
- For the stated goal, the limit is the substrate. Even a perfect improver
  would produce flies that eat and survive no better (H4). Fixing this
  comes first, because it decides what the score should be.

## C. Next steps

### P0. Fix or retract now (documentation only, about an hour)

1. `RSI_V6_RESULTS.md`: add a correction at the top. C2 and C3 do not hold
   at the library or rule level (table in H1); the gain is one move in one
   library (H2). Change the title verdict to "0 of 3 hold".
2. `RSI_V6_RESULTS.md` and `RSI_V7_RESULTS.md`: replace the sentence about
   not rediscovering V4's guided move with the H2 table.
3. `VISION.md`: update the status date, remove the stale "remains open"
   sentence, and shorten the RSI row to: V4 narrow demo passed; V5–V7 failed;
   V6's row-level passes withdrawn. Add to the M3 row that the accepted
   revisions improve a prediction readout, with no survival benefit.
4. `RSI_SEARCH_RESULTS_V1.md` and `RSI_GUIDED_RESULTS_V1.md`: add a one-line
   pointer to the later verdict.
5. `docs/fable-review/05`: correct the bank-reuse statement (L3).
6. Register seeds 991777, 991790, 991803, 991816, 996777 and 996790 as
   spent by this review's diagnostic.

### P1. Make taste skill matter (before any further RSI run)

The aim is a world where a fly that discriminates better eats more and
lives longer, measured directly.

1. **Fix M4** so a dead population returns `discrimination: 0` and the
   runners reject NaN.
2. **Find out why skill is free.** Three candidates to measure in one
   small factorial on a non-test bank, each with bias-only, identity and
   correct codes:
   - the acceptance floor: `predictTargetTaste` returns
     `0.05 + 0.9·p` and acceptance is sampled, so even a perfect learner
     eats 5% of bad food and refuses 5% of good;
   - the cost of bad food relative to the gain from good food;
   - food abundance (`regrowth`, `capacity` in `enterCuePhase`).
3. **Pick one world setting** where the correct code beats bias-only on
   survivors and energy with a clear margin, and the identity code sits in
   between. Use default-length phases, where flies already die (18 of 24
   survive in the diagnostic; 4 of 24 in V1's random-label world).
4. **Gate:** correct vs bias-only, 16 histories, paired by history,
   survivors and energy both better with p < 0.01. If no setting in the
   factorial passes, stop: the taste channel cannot carry an embodied
   benefit, and RSI on it should end.
5. **Change the score.** Use energy per founder (or survivor count) as the
   search and test objective. Keep discrimination as a reported diagnostic.
6. **Drop 3-bit rules or give every family both classes.** Simplest:
   assign valence so each family of 4 has at least one odor of each class,
   or restrict rules to those that are balanced (single terms, 2-bit XOR,
   majority) and 2-bit AND/OR.

Compute: the diagnostic took about 2 s per short world and 8 s per long
world, per worker, on 3 workers. The factorial is 3 codes × 8 settings ×
16 histories = 384 long worlds, about 10 minutes on 6 workers.

### P2. The next RSI experiment (only if P1's gate passes)

**Levels.**

| Level | What it is | Learned or hand-written |
|---|---|---|
| 0 | Taste program `{masks, step, replays}` | Learned by search |
| 1 | Weights over the full 90-move grammar plus 4 hyper moves, all present from the start | Weights learned; grammar hand-written and described as such |
| 2 | None | Dropped (see below) |

Drop "invention" as a claim. Sampling from a 90-item grammar the designer
wrote is selection, and the experiment should say so. Drop level 2 for
now: C1 cannot be tested until level 1 shows a first-order effect several
times larger than today's.

**Update rule (fixed, pre-registered).** Credit every tried move with its
dev gain, not only confirmed acceptances, and pick moves by Thompson
sampling over a per-move mean and variance. This uses about 100 data points
per library where the current rule uses about 8. Check on a dev bank that
it ranks `keepOnly/evid/k` first in at least 5 of 6 libraries before
freezing the plan. If it cannot, do not run the test.

**Training and test.**

- 12 independent libraries per arm. Each has its own training seed **and
  its own training bank** (8 rules drawn from the training family with
  fresh bank seeds), so libraries are independent.
- Test: 12 rules from families not used in training, each with fresh bank
  seeds, budget 12, 1 search seed. Every library runs every rule.
- Arms: (A) trained weights; (B) the same grammar with uniform weights;
  (C) trained weights after generation 2, where generation 2 trains
  starting from generation 1's weights on a second fresh training bank.
- Final score: energy per founder on 8 held-out long-world histories.

**Unit of analysis.** The library. For each library, average its 12 rule
scores. Compare arms with a one-sided exact permutation (sign-flip) test on
the 12 paired library differences, pairing by library index, which shares
test rules and search seeds.

**Pre-registered criteria.** All must hold, α = 0.01 each, no reruns.

- **R1, learning helps:** A beats B.
- **R2, it compounds:** C beats A. This is the recursive part.
- **R3, it is embodied:** the A − B difference in survivors is positive
  with the same test, and A's mean energy exceeds the no-search identity
  code's.
- **Reported, not gated:** discrimination, per-rule differences, which
  moves carry the weight.

**Required N.** With 12 libraries the test can reach p = 0.0002. As a rough
guide, it has good power at α = 0.01 only if the per-library effect is
above about 1.2 standard deviations; compute the exact figure from the
dev-bank libraries before freezing the plan. V6–V7 had roughly 0.02 mean
effect against 0.025 between-library spread, which is under 1 SD, so the
plan depends on the new update rule making the effect both larger and
consistent. The dev-bank check above is
there to confirm that before any test bank is spent.

**Compute on this machine.**

| Part | Worlds | Type | Hours at 6 workers |
|---|---|---|---|
| Training, 12 libraries × 2 generations × 8 rules × budget 16 × 6 histories | 18,400 | short | 2.8 |
| Test searches, 3 arms × 12 libraries × 12 rules × budget 12 × 6 histories | 31,100 | short | 4.8 |
| Final scoring, 3 × 12 × 12 × 8 histories | 3,500 | long | 1.3 |
| **Total** | | | **about 9** |

Timings assume 3.3 s per short world per worker (V7's observed rate) and
8 s per long world. That is two V7-sized sessions, so checkpointing is
required. Search uses short worlds to keep this affordable; if P1 shows
that short worlds cannot carry the energy signal, search must also use
long worlds and the total rises to roughly 20 hours. In that case cut to
8 test rules and budget 8 before cutting libraries.

### P3. What success and failure look like

**If it works**, the results doc shows: 12 library-level differences for
A − B with at least 10 positive; C − A positive in at least 10; survivors
and energy both higher for A than B; and the same one or two move families
(expected: `keepOnly/evid/k`) carrying the weight in most libraries. The
honest claim would then be "an improver that learns which hand-written
moves to use improves the flies' survival on unseen rules, and a second
round of learning improves it further". That is bounded meta-learning with
compounding. It is still not open-ended self-modification, and VISION
should say so.

**A clear negative that ends the line** is any one of:

- P1's gate fails: no world setting makes the correct code beat bias-only
  on survival;
- the dev-bank check fails: the new update rule does not rank the useful
  move first in at least 5 of 6 libraries;
- R1 fails at 12 libraries.

In each case the taste-program RSI line closes, with no V8. R2 failing
while R1 passes is a real result too: learning helps but does not compound.
Report it as that and stop.

### P4. Process and infrastructure

1. **State the unit of analysis and the exact test in every plan**, and
   have the runner compute the verdict from library-level means only.
2. **Make replicates independent by construction**: a new training seed
   must imply a new training bank. Have the runner refuse to start if any
   library hash matches one in an earlier run's JSON.
3. **One stopping rule for the line, written before the next run**: the
   three negatives in P3. This is what was missing through V5–V7.
4. **Checkpoint from the start**, keyed by a hash of the config, U and
   code version (fixes L5). Write per-history scores, not only means, so
   later audits do not need reruns.
5. **Save every search record** (`record` and `to`) for test searches, not
   only accepted moves.
6. **Run 4 workers, not 6**, with `--max-old-space-size` set per worker.
   Both V7 failures were memory or machine level, and world checkpoints
   are cloned in memory (`engine.mjs:216`).
7. **Separate result docs from interpretation.** The numbers in this
   program were always right; the "Reading" sections are where the errors
   were (H2).
