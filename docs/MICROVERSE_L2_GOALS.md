# Microverse level 2: P11b and P13b (fixed 2026-11-17, before any tuning)

This line asks the questions of the failed tests [P11](RSI_P11_RESULTS.md) and [P13](RSI_P13_RESULTS.md) again, as **new, separately named tests** in the microverse. **The original P11 and P13 stay FAILED.**

The workflow is the one in [MICROVERSE_GOALS.md](MICROVERSE_GOALS.md):
- iterate on practice seeds;
- freeze the code;
- a goal closes only on fresh seeds;
- after 5 attempts without progress, step back;
- finals are never repeated to fish for a pass.

**Fable review was unavailable** for this line: the review thread returned "usage credits are required". The design follows the rules Fable set earlier:
- a level-2 gain must be found by the system's own search and tested on fresh worlds, as in P9;
- "selection tunes the reviser" is evolution of a setting, so it needs a free-evolution control;
- headroom checks come first.

**Level 1** is the reviser R, the fly's in-life self-revision of its taste program. Its knobs are:

| Gene | Meaning |
|---|---|
| `tasteZ` | Evidence threshold for adding a feature |
| `tasteEvery` | How often the fly considers a revision |
| `tasteCap` | Maximum number of features |
| `tasteMemory` | Evidence decay horizon |
| `tastePrune` | Pruning weight threshold |

R0 is the default (3, 8, 16, 200, 2).

**Measure:** paired solo runs (`microverse/solo.mjs`). Each strain lives alone in the same seeded world; the outcome is the mean population over ticks 10,000–20,000. The test is a one-sided sign-flip.

## Headroom checks (practice seeds only; they gate whether a goal is attempted)

- **H1 (for P11b).** Change one R knob at a time against R0, on practice seeds 101–116. The best single change must beat R0 by ≥ 1.5 flies. If none does, R0 is already near-optimal and P11b is **blocked (no headroom)**.
- **H2 (for P13b).** The best R must differ between rule families. A per-family oracle schedule (R switched to each family's best setting when the rule changes) must beat the best fixed R by ≥ 1.5 flies. If not, there is nothing for in-life tuning to track, and P13b is **blocked**.

## P11b: level 2 by the system's own search, scored in the embodied world

A fixed, hand-written hill climber over R (the level-2 operator) proposes R changes. It scores each one by paired solo fitness on practice seeds and accepts improvements. Its output is R*.

**Gate** (fresh seeds, 48): R* − R0 has mean ≥ 1.0 flies and p < .01.

**Label:** level 2 by external search with a hand-written climber. Unlike P9, there is no surrogate; scoring is in the embodied world.

## P13b: the lineage tunes its own reviser from its own experience

Each fly runs a fixed, hand-written meta-rule that adjusts its R genes from its own experience. Children inherit the adjusted R. Selection is present for every arm.

**Arms:**
- **META:** R0 plus the meta-rule.
- **EVO-R:** R genes mutate freely, with no meta-rule. This is the main control: plain evolution of R.
- **SHAM:** the meta-rule's step pattern, with directions randomized and matched in timing and size.
- **FIXED-R0:** no tuning at all.

**Gates** (fresh seeds, 48 each, paired solo):
- META − EVO-R ≥ 1.0 flies, p < .01;
- META − SHAM ≥ 1.0 flies, p < .01;
- META − FIXED-R0 > 0, p < .01.

**Label:** one level of in-lineage recursion with a hand-written meta-rule, plus selection.

## Headroom results (practice seeds 101–116)

**H1 FAILED its bar.** These are the single-knob changes vs R0 (bar ≥ 1.5 flies):

| Change | Δ flies |
|---|---|
| z 1.5 | +1.05 (best) |
| prune 3 | +.60 |
| every 16 | +.16 |
| cap 12 | +.03 |
| memory 400 | −.52 |
| memory 100 | −.62 |
| every 4 | −.84 |
| prune 1 | −1.05 |
| cap 24 | −2.37 |
| z 6 | −3.31 |

**H2 FAILED its bar.** The per-family best settings differ (z 1.5 helps pairs / staircase / triples by about +1 but hurts single by −4.5; z 6 costs triples −7.8). But R0 sits near every family's optimum: an oracle schedule gains < 1 fly, against a bar of 1.5.

**Diagnosis.** R0 is already hand-tuned. The designer did the level-2 step by hand in the G6 loop, adding forgetting and pruning. So, from R0, both P11b and P13b are **blocked (no headroom)**.

## Amendment A1 (2026-11-17, after H1/H2 and before any P11b/P13b tuning)

Both tests now start from **R_P12**: the reviser as it was before the designer's G-loop tuning. That means no forgetting (`tasteMemory` 1e12) and no pruning (`tastePrune` 0); the other knobs are at R0.

**Headroom H1'.** R0 − R_P12 = +6.4 flies, 16/16, p = .00002. The question becomes: **can the system's own level-2 process rediscover what the designer added by hand?** The R0 − R_P12 gap is the reference.

### P11b (A1)

- **Level-2 operator** (hand-written, fixed now): a random one-step climber over the grid:

| Gene | Values |
|---|---|
| `tasteMemory` | 1e12, 800, 400, 200, 100, 50 |
| `tastePrune` | 0, .5, 1, 2, 3, 4 |
| `tasteZ` | 1.5, 2, 3, 4, 6 |
| `tasteEvery` | 4, 8, 16 |
| `tasteCap` | 12, 16, 24 |

- **Search.** 24 proposals. Each one changes a single knob by one grid step. A proposal is accepted if its paired-solo mean against the current best is ≥ +0.5 flies on training seeds 101–116. The climber seed is 4242.
- **Gate** (fresh seeds 80001–80048): R* − R_P12 ≥ 1.0 flies with p < .01.
- **Reported, not gated:** R* − R0 (system vs designer).

### P13b (A1)

- **META.** Starts at R_P12 and runs a hand-written meta-rule, applied at each of a fly's revision checks (every `tasteEvery` tastings):
  - **Pruning.** If more than half of the fly's added features have |w| < 1, `tastePrune` goes one grid step up. If none do, it goes one step down.
  - **Forgetting.** If the confidence gate has distrusted the model (model loss ≥ base-rate loss) for 3 consecutive checks after once trusting it, `tasteMemory` goes one step shorter. If the gate has trusted the model for 10 consecutive checks, it goes one step longer.
  - Children inherit the adjusted genes.
- **EVO-R.** Starts at R_P12. At birth, `tasteMemory` and `tastePrune` each mutate one grid step in a random direction with probability .1. There is no meta-rule.
- **SHAM.** The same firing conditions and step sizes as META, with each step's direction drawn at random.
- **FIXED.** R_P12 with no tuning.
- **Gates** (fresh seeds 90001–90048, paired solo):
  - META − EVO-R ≥ 1.0, p < .01;
  - META − SHAM ≥ 1.0, p < .01;
  - META − FIXED > 0, p < .01.

## Amendment A2 (2026-11-17, after headroom H8 and before any A2 tuning)

The seven earlier designs left P13b bounded below its gate. A2 changes the flies, as the user allowed ("make anything you want to the flies").

**World and fly variant.** Each fly draws, at birth, an individual and **non-heritable** toxin-damage multiplier: 0.2 (tolerant) or 3 (sensitive), with equal chance. Genes cannot know it; the fly's own energy losses reveal it (`toxinNiche` [.2, 3]).

**Headroom H8** (practice seeds 101–116; base R* with eps .01, 65.91 flies):
- the best fixed `acceptAt` is .4 (.3: −.75; .5: −.09; .6: −4.85; .75: −62, extinct);
- a per-fly oracle (`acceptAt` .2 if tolerant, .75 if sensitive) gives **+8.36, 16/16**;
- H8 passes by a wide margin.

**Extended R.** The tuned gene is `acceptAt`, the taste system's decision-and-sampling threshold: it decides which foods a fly eats and so which labels it learns from. **It is not the feature-revision operator.** Every report must label this extension. Grid: [.1, .2, .3, .4, .5, .6, .75, .85].

**Base for all arms.** SELF with R* genes (memory 800, prune .5, every 4) and defaults otherwise (`tasteEps` .05, `acceptAt` .4).

**Arms:**
- **META.** An in-life, hand-written meta-rule: trial-and-revert on `acceptAt` from the fly's own feeding outcome. Its exact form is designed on practice seeds; the gate is frozen here. Children inherit the current value.
- **SHAM.** Identical trials; keep or revert is decided by a coin flip.
- **EVO-R.** No meta-rule. At birth, `acceptAt` mutates one grid step in a random direction with probability .1.
- **FIXED.** `acceptAt` .4.

**Gates** (fresh seeds 90001–90048, reserved earlier and unused; paired solo; mean population over ticks 10,000–20,000):
- META − EVO-R ≥ 1.0, p < .01;
- META − SHAM ≥ 1.0, p < .01;
- META − FIXED > 0, p < .01.

**Label.** In-life self-tuning of the taste system's decision threshold from own experience, with inheritance; not recursive revision of the revision operator.

## P13b split into parts (frozen 2026-11-17, before any final run)

The user asked to break P13b into smaller parts. Each part is a separately named, weaker claim. **Passing parts does not pass P13b.** P13b-4 *is* the original P13b gate and keeps its name and bar.

**Arms** (fixed now; no further tuning). All start from R_P12 (A1):
- **META:** attempt-3 in-life trial-and-revert (`metaR: 'trial'`). The fly tries one grid step on `tasteMemory` or `tastePrune` and keeps it only if its own running taste loss fell.
- **SHAM:** the same trials with a coin-flip keep (`'trialsham'`).
- **EVO-R:** as in A1.
- **FIXED:** R_P12.

Runner: `microverse/p13parts.mjs`. Practice seeds 101–116 reproduce the log: META − FIXED +6.36, − EVO-R +1.49, − SHAM +.26.

**One final.** Fresh seeds 90001–90048 (reserved for P13b and unused) are run once, for all arms. Every part is scored from that single run. The run is never repeated.

| Part | Claim | Gate (48 fresh seeds, one-sided sign-flip) |
|---|---|---|
| P13b-1 | The lineage's own tuning helps | META − FIXED > 0, p < .01 |
| P13b-2 | Own-experience trials beat blind mutation of the same genes | META − EVO-R > 0, p < .01 |
| P13b-3 | The fly's own keep/revert evidence beats a coin flip | META − SHAM > 0, p < .01 |
| P13b-4 (= P13b) | All of the above, with margin | META − EVO-R ≥ 1.0 and META − SHAM ≥ 1.0 (both p < .01), and P13b-1 |

**Labels:**
- P13b-1 and P13b-2 hold even if the gain comes from trying steps plus selection, not from the evidence.
- Only P13b-3 isolates the use of own evidence.
- The meta-rule is hand-written.

## P13b-2b (frozen 2026-11-17, after the P13b-2 failure and before any P13b-2b tuning)

P13b-2 **stays FAILED** (+.53, p .13). P13b-2b is a new, separately named test of the same claim with a redesigned meta-rule.

**Practice.**
- 48 practice seeds: 101–116 and 301–332. This is more than before, because 16 practice seeds overstated the edge (+1.49 on practice vs +.53 on the fresh seeds).
- At most 5 meta-rule attempts. EVO-R and its mutation rate are not changed.
- The attempt with the best practice META − EVO-R goes to the final. If no attempt reaches +1.0 on practice, no final is run.

**Final.** Fresh seeds 91001–91048, run once.

**Gate.** META′ − EVO-R > 0, p < .01.

**Reported, not gated.** META′ − its matched coin-flip sham, and META′ − FIXED.

## P13b-3 split into parts (frozen 2026-11-17, after the P13b-3 headroom check; 2-seed smoke test only)

P13b-3 (fitness: own evidence beats a coin flip) **stays BLOCKED**: a perfect-keep oracle ties the sham (−.42). Its parts are separately named and weaker. **Passing them does not pass P13b-3 or P13b.**

| Part | Claim | Gate (fresh seeds 92001–92048, run once; one-sided sign-flip) |
|---|---|---|
| P13b-3a | The fly's own evidence picks the right direction | META's balanced keep accuracy > .5 (chance), p < .01. Ground truth: a trial step is "right" if it moves toward R* (memory 800, prune .5); balanced = (keep rate on toward steps + revert rate on away steps) / 2 |
| P13b-3b | Its reviser genes end closer to R* than the sham's | SHAM's mean grid distance from R* at tick 20,000 minus META's > 0, p < .01 (seeds where both arms survive) |
| P13b-3c (= P13b-3) | More flies than the sham | blocked (no headroom) |

**Protocol.**
- Practice on the 48 seeds 101–116 and 301–332, with at most 5 META attempts.
- SHAM is always the same META with a coin-flip keep.
- The attempt with the best practice 3a goes to the final. A part is finalled only if its practice p is below .05.

**Labels.** R* is the best fixed setting found by P11b, not a per-fly optimum. The meta-rule is hand-written.

## Amendment A3 (frozen 2026-11-17, after headroom H10 and before any A3 tuning)

**World.** Opt-in `toxinNiche` [.2, 3] plus `toxinSwitch` .005: each fly's toxin sensitivity flips between tolerant (×.2) and sensitive (×3) at random during its life, with a mean dwell of 200 ticks against a lifespan of up to 1200. The flips are not heritable and are not visible to genes; the fly feels them only as damage per toxic bite.

**Headroom H10** (practice seeds 101–116, base R* genes, Δ flies vs fixed `acceptAt` .4):

| Arm | Δ flies |
|---|---|
| `acceptAt` .3 | −.57 |
| `acceptAt` .5 | −.59 |
| Oracle that tracks the current state (.2 tolerant / .75 sensitive) | **+10.71 (16/16)** |
| Same oracle fed an independent fake state | +.27 |

H10 passes.

**Extended R** is `acceptAt`, as in A2, and is labelled the same way: a decision-and-sampling threshold, not the feature-revision operator.

**Arms** (`MV_SET=A3`):
- **META** (`metaA: 'track'`): after each toxic bite, the fly sets `acceptAt` from the damage per unit it just felt. The rule's form is tuned on practice.
- **SHAM** (`'tracksham'`): the same rule at the same update times, fed an independent fake state with the same switching dynamics.
- **EVO-R:** `acceptAt` mutates at birth.
- **FIXED:** `acceptAt` .4.

**Protocol.**
- Practice on the 48 seeds 101–116 and 301–332, with at most 5 attempts.
- A final is run only if a practice attempt clears every gate margin.

**Final.** Fresh seeds 93001–93048, run once.

**Gates** (P13b's, unchanged):
- META − EVO-R ≥ 1.0, p < .01;
- META − SHAM ≥ 1.0, p < .01;
- META − FIXED > 0, p < .01.

**Label.** In-life self-tuning of the taste system's decision threshold from own bodily experience, with inheritance of the gene. It is not recursive revision of the revision operator. The world is constructed so that this tuning matters.
