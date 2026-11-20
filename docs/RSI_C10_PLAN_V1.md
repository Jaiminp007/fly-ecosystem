# RSI C10 PLAN V1 (flip-choice vs standard-choice: the true C9 question) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code. License: C9's INVALID
(``no standard-eval arm; both arms flip-derived''). C10 builds the
missing arm: a per-agent STANDARD-choice looper alongside the
per-agent FLIP-choice looper, same dose, same timing, same choice
set — differing ONLY in eval objective. Copier retired
(blind-majority answered in C7/C8: decorative-at-best).

## Design (C8/C9-verbatim machinery, new arm pair)

Per chain (H0/H1/H2), same-arm exact transplant, proposal tick
{1024}, lifetime 1 fire event (3 evals)/run, temporal sandbox split,
2 chains × 10 runs = 20 mains, 0 probes, flip-split HB scorer,
G0/G1/G2a/G2c/G2d, verdicts C10-*.
- Choice set (frozen): **{1: gain 1.0, 4: skip 0.1, 6: surprise}**.
- `looper-*` (flip-eval, C9-verbatim): per-agent flip-choice @1024
  (fit-true/test-flipped), adopts own-best iff 5% bar.
- `standard-*` (NEW arm, C8-looper-verbatim): per-agent
  STANDARD-choice @1024 (fit-true/test-true), adopts own-best iff
  5% bar. Same dose, same timing, same set — ONLY the eval
  objective differs. (Experiment: looper wire with looperFlipEval
  false/absent; needs its own arm tag for transplant identity —
  `standard`, null-default addition like `copier` was.)
- `static-*` + `unlearned` as in C4–C9.
- Votes: both evaluating arms record proposals (menuIndex+adopted);
  majority functions apply per arm. NO vote carryover between arms
  (each arm is self-contained; transplant carries weights only).
  There is no copier and no blind application in C10.
- **G2b-C10 (evaluation alignment)**: pooled looper-flip HB −
  pooled standard HB > 0. Tests whether transfer-aligned
  evaluation beats train-aligned evaluation, all else equal.
- G2a unchanged (successive +0.1 ×2 + non-decrease vs static;
  measured on the looper-flip arm (the candidate); standard and
  static reported descriptively).

## Experiment change (null-default, copier-pattern)

`taste-experiment.mjs`: arm `'standard'` + standard behaves exactly
like looper-single... precisely: like the looper with
`looperMenuIndices=[1,4,6]` and `looperFlipEval` unset (standard
choice). Implement as arm tag routing to the existing choice path
(no new fire function; the `standard` tag selects
`fireLooperChoice` where `looper`+flag selects flip). Transplant
identity: same-arm exact (looper←looper, standard←standard,
static←static).

## Fixtures (20), bank, caps, attempt discipline

- C9's 19 adapted (flip purity + flip routing + choice set) +
  standard-arm fixtures: `standard` tag routes to standard-choice
  (3 evals, flipped!==true marked absent), transplant same-arm
  identity covers three lines (looper/standard/static).
- Fresh-26 bank `evidence/rsi-c10-dev/fresh-26/`, 9-schema, 6×9,
  range **464001–464054**. VERIFIED clean 2026-11-02 (zero hits
  docs/scripts/tests/learning/engine pre-freeze). attempt-01 +
  fresh-26 verified free pre-freeze. Builder re-verifies, post-bank
  refusal, union-excluded (spent through 463xxx + own).
- Caps 20/0/35840/860160/4.0e9/10800s. ONE authorized attempt-01.
- Note: 10 runs/chain now = looper/standard/static × train/T1/T2 +
  unlearned (copier slot replaced by standard).

## What GO/NOGO mean

- GO: flip-choice beats standard-choice AND successive lifts hold
  → RSI CLAIM (first ever if met; bars unmoved).
- NOGO (G2b flat/negative, both adopt): eval objective doesn't
  matter (flip adds nothing over standard — simulation gap
  confirmed: retained-flipped doesn't predict transfer-flipped).
- NOGO (G2b flat, neither adopts): C9 repeats (no operator passes
  either bar on this bank — bank-level null, compare adoption
  counts descriptively).
- NOGO (G2a fails): choice doesn't lift on this bank.
