# RSI C9 PLAN V1 (flip-eval sandbox: align evaluation with transfer) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code. License: C8's core
finding (``the sandbox optimizes TRAIN held-out error; transfer
value is a different objective''). C9 aligns the sandbox with
transfer WITHOUT seeing the transfer history: evaluate candidates
on FLIPPED-valence versions of retained experience (extinction-
readiness simulated in-sandbox). If surprise wins flipped-eval while
gain wins standard-eval, the sandbox can DISCRIMINATE transfer value
— the selection signal C8 lacked.

## Design (C8-verbatim EXCEPT the sandbox objective)

Per chain (H0/H1/H2), same-arm exact transplant + voted op carryover,
proposal tick {1024}, lifetime 1 fire event (3 evals)/run, temporal
sandbox split, 2 chains × 10 runs = 20 mains, 0 probes, flip-split
HB scorer, G0/G1/G2a/G2c/G2d, verdicts C9-*.
- Choice set (frozen): **{1: gain 1.0, 4: skip 0.1, 6: surprise}**.
- `looper-*` (flip-eval): at 1024 each agent sandbox-evaluates all
  three on FLIPPED held-out (test targets mapped 1−target;
  fit records unflipped, learned normally) and adopts the best-
  flipped iff it passes the 5% bar vs the incumbent's flipped
  error. (Fit on true labels, test on flipped = extinction-readiness.)
- `copier-*` (standard-eval, C8-verbatim): per-agent choice on
  STANDARD held-out, auto-applied blind @1024 (dose matched).
- `static-*` + `unlearned` as in C4–C8.
- **G2b-C9 (evaluation alignment)**: pooled looper-flip HB − pooled
  copier-standard HB > 0. Tests whether TRANSFER-ALIGNED evaluation
  beats TRAIN-ALIGNED evaluation at matched dose and choice set.
- G2a unchanged (successive +0.1 ×2 + non-decrease vs static).

## Loop change (null-default addition)

`rsi-operator-loop.mjs`: new `fireLooperFlipChoice(state, indices)`
— mirrors `fireLooperChoice` but test recs are flipped (pure target
map on the clone-eval path; retained experience untouched,
byte-identity verified as usual). Existing single/choice/flip paths
untouched. Experiment wire: `looperMenuIndices` + new
`looperFlipEval` flag (mirror of the choice path).

## Fixtures (19), bank, caps, attempt discipline

- C8's 18 adapted (choice set unchanged; fire-helper routing now
  covers three paths) + flip fixtures: flipped-eval adopts
  surprise-where-standard-adopts-gain (synthetic discrimination —
  THE gate fixture: constructs records where gain wins standard
  but surprise wins flipped, or documents why impossible);
  flip is pure (retained records untouched post-eval, byte-identity).
- Fresh-25 bank `evidence/rsi-c9-dev/fresh-25/`, 9-schema, 6×9,
  range **463001–463054**. VERIFIED clean 2026-11-02 (zero hits
  docs/scripts/tests/learning/engine pre-freeze). attempt-01 +
  fresh-25 verified free pre-freeze. Builder re-verifies, post-bank
  refusal, union-excluded (spent through 462xxx + own).
- Caps 20/0/35840/860160/4.0e9/10800s. ONE authorized attempt-01.

## What GO/NOGO mean

- GO: flip-eval selection beats standard-eval selection AND
  successive lifts hold → RSI CLAIM (first ever if met).
- NOGO (G2b flat/negative): flipped-retained does NOT predict
  flipped-transfer (simulation gap — sandbox can't see transfer
  even flipped; evaluation alignment fails).
- NOGO (G2a fails): choice doesn't lift on this bank.
- NOGO (flip≈standard choices): both evals pick the same ops
  (no discrimination — the flip adds nothing; sandbox signal
  identical).
