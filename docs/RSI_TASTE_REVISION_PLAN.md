# Bounded RSI plan for taste-ecology substrate (frozen 2026-10-27, v1)

Base: qualified ecology learner (`taste-energy.mjs:fbb4787a…`,
`TASTE_FRESH_QUALIFICATION_V2_RESULTS.md` PASS). No code change in this step.
This plan freezes the revision game; no revision has run, no RSI claimed.

## Algorithm space (discrete, embodied, persistent)

Gen0 (incumbent): `motorRepresentation=ecology, feeding=greedy,
taste=orthogonal, tasteRate=1, hold=1, motorRule=progress,
renewalRate=.1, greedyInference, cruiseSpeed=0`.

Menu for revisions (only these may change; all else frozen):
* `holdTicks ∈ {1,4,16}`
* `motorRule ∈ {td,renewal,progress}`
* `tasteRate ∈ {0.1,1.0}`
* `renewalRate ∈ {0.03,0.1,0.3}` (only matters when `motorRule=renewal`)
Total ≤ 3×3×2×3 = 54 configs, Gen0 included. Small enough for matched-budget
accounting; large enough that random search is not trivial.

Persistent state across generations (stored in `evidence/rsi-taste-v1/`):
* `state.json`: accepted chain `[gen0, gen1, …]`, each with config, sourceSha,
  eval bankSha, results, total worlds spent to accept it.
* `facts.jsonl`: every evaluated proposal (config, search bankSha, search
  score, worlds spent). Both branches share copies at each acceptance; only
  the improvement procedure differs afterwards.

## Improvement procedures (vary only this after a copy)

* A (candidate search): greedy hill-climb on facts — propose unvisited
  neighbors (Hamming-1 in menu) of the current best by search score; break
  ties by fixed order. Uses facts; deterministic given history.
* B (copied-improvement control): same start (copied learner + copied facts),
  then random search — uniform unvisited menu draw via bank-excluded RNG,
  ignoring facts. Same per-proposal worlds, same total proposal budget.
* C (static): no revision (Gen0). D (fixed-action): `acceptCruise` baseline
  for reference, not a revision.

Search cost: each proposal evaluated on the 4-history search bank, full 1792
ticks, `candidate` arm only vs `unlearned`+`reset` (3 arms → 12 worlds per
proposal). Search score = mean `candidate-unlearned` + mean
`candidate-reset` on search bank (descriptive; acceptance needs fresh eval).
Budget per generation: ≤ 8 proposals (≤ 96 search worlds), predeclared.
Matched budget: A and B get identical proposal/world allowances.

## Acceptance (fresh eval, total-budget accounting)

A proposed config is accepted as gen_{k+1} only on the 8-history eval bank
(fresh seeds, never used for search), full 1792 ticks, all 6 arms, same v2
gates as qualification:
1. vs unlearned superiority (mean>0, ≥6/8, surv≥0);
2. vs frozen superiority (mean>0, ≥6/8, surv≥0);
3. vs reset noninferiority (mean≥-0.50, ≥5/8 ≥-1.00, surv≥-4);
4. skills means>0; 5. retention means>0; 6. transferReset mean≥-0.25;
7. integrity asserts.
Plus total-budget guard: cumulative worlds (search + all evals for this
generation, both branches) reported; a revision that passes eval but exceeds
the per-generation world cap is rejected (no post-hoc extension).

Copy control: at each acceptance, copy accepted learner config + full facts to
both A and B branches before the next generation. Subsequent difference is
causally attributable to the improvement procedure, not the start.

## Bounded RSI claim (all required, predeclared)

* ≥2 successive accepted revisions (gen1 from gen0, gen2 from gen1), each
  passing fresh-eval gates on its own new eval bank (gen1-eval, gen2-eval
  seeds; no reuse across generations).
* Search-productivity advantage: candidate procedure A reaches acceptance in
  fewer cumulative search worlds than copied random B in both generations, or
  B fails to accept where A accepts under matched budget. Fixed/static do not
  count as search.
* Retained embodied improvement per total budget: gen2 beats gen0 on eval
  lifetime (candidate-unlearned mean) with survival held, net of all search +
  eval worlds. Passing forecast MSE or software tests cannot substitute.

One frozen attempt per generation. Any failure stands; retry needs a new plan
generation with new seeds. All prior failures, reserves, and spent seeds stay
immutable.

## Step 1 executed here (no revision)

* Freeze this plan.
* Create RSI eval bank v1: `evidence/rsi-taste-v1/eval-20261027-v1/protocol.json`
  (8 fresh histories via `bank()` exclusion).
* Baseline Gen0 on that eval bank (6 arms, 1792 ticks) to fix the start line
  and world counter. This baseline is not a revision and claims nothing.
* Search bank + first proposals are next turn, after baseline is recorded.

Execution (baseline only):
```
node scripts/taste-development.mjs \
  --bank evidence/rsi-taste-v1/eval-20261027-v1/protocol.json \
  --output evidence/rsi-taste-v1/eval-20261027-v1/gen0-baseline \
  --ticks 1792 --count 8 \
  --feeding greedy --taste orthogonal --taste-rate 1 \
  --motor ecology --hold 1 --motor-rule progress --greedy-inference \
  --arms candidate,unlearned,frozen,reset,acceptCruise,acceptStationary
```
Worlds: 8 histories × 6 arms = 48 eval worlds, 0 search worlds yet.
