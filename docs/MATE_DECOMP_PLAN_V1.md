# MATE-DECOMP PLAN V1 — FROZEN (taste vs motor decomposition of the edge)

Date: 2026-11-03. Status: FROZEN (design only until implemented).
Single authorized bounded world run (disk floor 1 GB; ~5G at freeze).

## Rationale (new question, not a replication or variation)
MATE-SELECTION V1/V1b + MATE-COMPOUND V1 proved learned founders
out-reproduce never-learners (6>5, 17>10, 11>5) — but NEVER asked WHICH
learning drives the edge. Founders learn taste (food values) AND motor
(actor-critic steering; `motorUpdate`, taste-energy.mjs:304, gated on
acquisition only — not on tasteLearning). First-class arm 'noTaste'
fixes taste at init while motor keeps learning, giving an exact additive
decomposition with zero new code: motor contribution = noTaste −
unlearned; taste contribution = candidate − noTaste; total = candidate −
unlearned. If motor is vestigial, noTaste == unlearned empirically and
the test still answers (taste owns 100%). Either outcome is new.
Different arms, different bank, different verdict from every mate line.

## Design (frozen; proven mate-selection conditions verbatim)
- Instrument: `scripts/mate-decomp-dev.mjs` (new; mate-selection pattern).
  2 histories × 3 arms (candidate/noTaste/unlearned) = 6 mains, ZERO
  probes, bar 50 + nutrient 5.0 (births-occurring), matingActionRequired
  false, reproduction true, verticalTransmission 'none' (zeroed newborns
  — V1 precedent; isolates founder learning), BT_TICKS, BT_FOUNDERS,
  body N. Unlearned line frozen every generation (constructor + newborn
  paths); noTaste line taste-fixed, motor-learning (verified in code).
- Metric: total line births per arm per history. Descriptive: gen-2+,
  gen-1 lifespan, per-history tables, taste/motor shares.
- Bank: `evidence/mate-decomp-dev/fresh-01/` 473190–473207 (2 × 9),
  verified clean pre-freeze (0 exact hits evidence + tracked), builder
  re-gates at mint. First use is the single run.
- Fixtures (new `tests/mate-decomp-dev.test.mjs`, green required):
  bank tmp-mint shape/exclusion, scorer GO/NOGO/INCOMPLETE branches on
  synthetic rows, arm→learning options contrast at tick 0 (throwaway
  synthetic seed 7: candidate tasteLearning true, noTaste false with
  acquisition true, unlearned acquisition false) + maternal-off wiring,
  generation-summarizer parity.
- Caps: mate-selection values; expected output <2M. `df` pre/post, abort
  under 1 GB. Single attempt, no rescoring (all mate lines stand).

## Gates (frozen)
- G1: ledger exact (6 mains / 0 probes, 2 per arm).
- G2: config audit (transmission none all arms, bar 50, nutrient 5.0,
  births integers, generations valid, founder accounting intact).
- Verdict: all-zero births → INCOMPLETE-NOBIRTHS (void, V1 precedent);
  else candidate-line total > unlearned-line total → GO (edge present
  in this bank; attribution read descriptive: taste-share =
  (candidate−noTaste)/(candidate−unlearned), motor-share =
  (noTaste−unlearned)/(candidate−unlearned); thin n=2, licenses
  replication ONLY); else NOGO with stop-rule analogue.
- Scope: NO population/learning/RSI/retention claim beyond the licensed
  next step. No cross-line pooling.
