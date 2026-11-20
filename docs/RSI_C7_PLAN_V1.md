# RSI C7 PLAN V1 (dose-matched productivity: selection isolated) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code. License: C6's dose
confound (``copied full-run > looper half-run > static monotone''):
G2b as written punished mid-run adoption timing, not selection. C7
matches dose by moving the blind control's application to the same
tick (1024), isolating EVALUATION (sandbox-then-adopt vs blind-adopt).

## Design (C6-verbatim EXCEPT the blind arm)

Per chain (H0/H1/H2), same-arm exact transplant + voted op carryover,
proposal tick {1024}, lifetime 1/run, temporal sandbox split,
majority-vote carryover, 2 chains × 10 runs = 20 mains, 0 probes,
flip-split HB scorer, G0/G1/G2a/G2c/G2d, verdicts C7-*.
- `looper-*`: propose menu 6 @1024, sandbox-evaluate, adopt iff pass
  (unchanged).
- `copier-*` (NEW arm, replaces C6's construction-config `copied`):
  auto-adopts menu 6 @1024 BLIND (no sandbox, no eval fee; adoption
  init bills +2 as usual). Same tick, same op, no evaluation —
  dose matched by construction.
- Why replace, not add: C6 already measured full-dose blind (0.488);
  re-running it spends mains answering a settled question. The old
  `copied` arm stays in the experiment (other lines untouched).
- **G2b-C7 (productivity, dose-matched)**: pooled looper HB − pooled
  copier HB > 0. Tests SELECTION ONLY (evaluation's value over blind
  adoption at identical dose, timing, and transplant).
- G2a unchanged (successive +0.1 ×2 + non-decrease vs static).

## Experiment change (null-default, mirror of the looper wire)

`taste-experiment.mjs`: arm `'copier'` + `copierMenuIndex` field;
fire line extends the looper condition (same tick, same gate):
auto-adopt via `adoptOperatorLive` WITHOUT `sandboxEvaluate`
(no eval records, no eval fee). All other arms byte-identical.

## Fixtures (17), bank, caps, attempt discipline

- C6's 16 adapted (menu-6 assertions, surprise sandbox/adopt, exact
  transplant, scorer) + 1 copier fixture (auto-adopts @1024 with no
  sandbox records, bills init only, dose-timing asserted).
- Fresh-23 bank `evidence/rsi-c7-dev/fresh-23/`, 9-schema, 6×9,
  range **461001–461054**. VERIFIED clean 2026-11-02 (zero hits
  docs/scripts/tests/learning/engine pre-freeze). attempt-01 +
  fresh-23 verified free pre-freeze. Builder re-verifies, post-bank
  refusal, union-excluded (spent through 460xxx + own).
- Caps 20/0/35840/860160/4.0e9/10800s. ONE authorized attempt-01.

## What GO/NOGO mean

- GO: selection beats blind adoption at matched dose AND successive
  lifts hold → RSI CLAIM (first ever if met; bars unmoved).
- NOGO (G2b flat/negative): evaluation adds nothing over blind
  adoption at the same dose (loop's sandbox is decorative —
  selection is luck; the loop limitation localized precisely).
- NOGO (G2a fails): surprise doesn't replicate C6's lift on this
  bank (bank variance; compare descriptively).
