# TASTE-BACKWARD PLAN V1 — FROZEN (behavioral backward retention A→B→C→A)

Date: 2026-11-03. Status: FROZEN (design only until implemented).
Single authorized bounded world run (disk floor 1 GB; ~5G at freeze).

## Rationale (new question, not a variation)
No line has scored BEHAVIORAL backward retention: the dev-probe measured
retained-vs-saved probe VALUES (0/6 FALSE); the V-series measured FORWARD
tax to B-body (MET within-task); DTR scoping blocker #3 states "no
backward scorer exists (all scorers are forward)". B (moving) and C
(scarce, nutrient .2) are genuine in-substrate task changes (direction-gap
work proves behavioral contingency shifts); return-A restores A conditions
with the SAME agents. This instrument scores return-A vs A per-tick
performance with learned/unlearned/frozen controls — and BUILDS the
missing backward scorer (DTR part iii) as a side effect. Within-substrate
only; claims nothing about distinct-substrate DTR.

## Design (frozen; no engine changes — phaseRows already emitted)
- Instrument: `scripts/taste-backward-dev.mjs` (new; driver + scorer).
  2 histories × 3 arms (candidate/frozen/unlearned) = 6 mains, ZERO probes,
  standard 1792-tick phases, legacy nutrient table (natural depletion —
  handled by design, below). No reproduction, body N, cruise 0, BT caps.
- Metric (frozen): per-segment per-tick food rate
  rate(arm,seg) = Δtotals.foodEaten(seg)/ticks(seg), differenced from
  consecutive phaseRows (A=512, return-A=256). Secondary: Δenergy rate,
  survivors (context only).
- Depletion control by design: food depletes over the run, so return-A
  rates fall regardless of retention. Difference-in-differences:
  drop(arm) = rate(arm,A) − rate(arm,return-A); retention signal =
  drop(unlearned) − drop(candidate) (positive = candidate retains more
  than depletion alone explains). Frozen arm (A-weights held fixed)
  isolates B/C-interference: candidate-vs-frozen compares lifetime
  learning against exact A-persistence.
- Bank: `evidence/taste-backward-dev/fresh-01/` 473028–473045 (2 × 9),
  verified clean pre-freeze (0 exact hits evidence + tracked), builder
  re-gates at mint. First use is the single run.
- Fixtures (new `tests/taste-backward-dev.test.mjs`, green required):
  bank tmp-mint shape/exclusion, scorer GO/NOGO/VOID branches on
  synthetic phaseRows, depletion-DiD arithmetic, arm validity +
  zero-tick wiring. Triage-analogue = zero-tick (no worlds pre-run).
- Caps: BT per-main + aggregate caps, per-row wall/CPU caps; expected
  output <5M. `df` pre/post, abort under 1 GB. Single attempt, no rescoring.

## Gates (frozen)
- G1: ledger exact (6 mains / 0 probes, 2 per arm) + phaseRows complete
  (A,B,C,return-A all 4 rows every main; else INVALID).
- G2: config audit (standard phases 512/512/512/256, legacy nutrients,
  births integer ≥ 0; unlearned sanity: feeds > 0 somewhere — a never
  feeding unlearned arm voids the depletion baseline).
- Verdict on the 2 histories pooled (per-history table descriptive):
  no feeding anywhere → INCOMPLETE-NOFEED (void);
  else drop(candidate) < drop(unlearned) AND rate(candidate,return-A) >
  rate(unlearned,return-A) AND drop(candidate) ≤ drop(frozen) + tol →
  GO (behavioral backward retention above depletion + naive; thin n=2,
  licenses replication ONLY);
  else NOGO with stop-rule analogue. tol = 10% of pooled A-rate,
  pre-registered (yields to descriptive magnitudes; no tuning).
- Scope: NO distinct-task/DTR/population/RSI claim. Descriptive only:
  energy-rate DiD, survivors, gen counts (all zero expected — no
  reproduction), per-history tables.
