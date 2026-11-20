# RSI C8 PLAN V1 (multi-operator selection: choice vs majority) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code. License: C7's vacuous
G2b (``unanimous adoption, nothing to select''): a real selection
test needs MIXED-value candidates. C8 gives each agent a CHOICE of
three operators with known-mixed value (gain: null; skip: null;
surprise: positive) and tests whether personalized sandbox selection
beats majority-blind carryover.

## Design (C7-verbatim EXCEPT the proposal is a choice)

Per chain (H0/H1/H2), same-arm exact transplant + voted op carryover,
proposal tick {1024}, lifetime 1 fire event/run, temporal sandbox
split, 2 chains × 10 runs = 20 mains, 0 probes, flip-split HB scorer,
G0/G1/G2a/G2c/G2d, verdicts C8-*.
- Choice set (plan-specified, fixed): **{1: gain 1.0, 4: skip 0.1,
  6: surprise-gated gain}** — mixed by prior evidence (gain/skip
  null ×4 lines; surprise positive ×2 lines).
- `looper-*`: at 1024 each agent sandbox-evaluates ALL THREE on its
  own retained experience (3× flat fee each, lifetime 1 fire event
  with 3 evals — within OL_LIFETIME_MAX=4), adopts its own best iff
  it passes the 5% bar (else no adoption). Heterogeneous experience
  → agents may disagree (the selection pressure C7 lacked).
- `copier-*`: auto-applies the TRAIN-voted majority-best op @1024
  blind (C7-verbatim; the voted op is now SELECTED from 3, not
  fixed). Same tick, same dose, no evaluation.
- `static-*` + `unlearned` as in C4–C7.
- **G2b-C8 (personalized selection)**: pooled looper HB − pooled
  copier HB > 0. Tests whether PER-AGENT sandbox choice beats
  MAJORITY-blind carryover. Unanimous-choice (all pick surprise) →
  vacuous-again is itself informative (even offered choice,
  experience doesn't discriminate — selection space empty).
- G2a unchanged (successive +0.1 ×2 + non-decrease vs static;
  choice includes surprise so C6/C7-level lifts expected).

## Loop + experiment change (null-default additions)

`rsi-operator-loop.mjs`: new `fireLooperChoice(state, indices)` —
evaluates each index via the existing `sandboxEvaluate`, adopts the
best-passing (lowest candErr among adopted; none if none pass);
existing single-index `fireLooperProposal` untouched.
`taste-experiment.mjs`: looper wire accepts `looperMenuIndices`
(array; choice path) alongside `looperMenuIndex` (single; prior
lines). Copier unchanged (single voted index).

## Fixtures (18), bank, caps, attempt discipline

- C7's 17 adapted (menu assertions now cover {1,4,6} values) +
  choice fixtures: evaluates-all-three (3 fees billed), adopts-best
  (synthetic: surprise wins), adopts-none (synthetic: all fail bar),
  disagreement possible (heterogeneous experience → different
  winners — construct two agents with opposite histories).
- Fresh-24 bank `evidence/rsi-c8-dev/fresh-24/`, 9-schema, 6×9,
  range **462001–462054**. VERIFIED clean 2026-11-02 (zero hits
  docs/scripts/tests/learning/engine pre-freeze). attempt-01 +
  fresh-24 verified free pre-freeze. Builder re-verifies, post-bank
  refusal, union-excluded (spent through 461xxx + own).
- Caps 20/0/35840/860160/4.0e9/10800s (3× eval fees ≈ 2.4k ops/agent
  — negligible). ONE authorized attempt-01.

## What GO/NOGO mean

- GO: personalized choice beats majority-blind AND successive lifts
  hold → RSI CLAIM (first ever if met; bars unmoved).
- NOGO (G2b flat/negative, unanimous choice): even offered choice,
  agents agree (selection space empty — the substrate's verdict on
  selection, third instance: C2/C3 unanimous-gain/skip, C6/C7
  unanimous-surprise).
- NOGO (G2b flat/negative, SPLIT choice): agents disagree but the
  majority is as good as personalization (selection exists but adds
  no value — sandbox can't rank).
- NOGO (G2a fails): choice doesn't replicate surprise lifts
  (bank variance; compare descriptively).
