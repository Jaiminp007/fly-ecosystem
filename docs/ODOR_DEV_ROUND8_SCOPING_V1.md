# ODOR DEV ROUND 8 — SCOPING V1 (centering vs uniform pessimism)

Date: 2026-11-02. Status: SCOPING (not frozen; no code; no execution).

## Motivation

Diagnostic re-readings 9–11 (zero new worlds, spent R1 anchors+rows):

- R9: taste norms grow (2.6→7.5), never collapse; R1 steering ~zero
  (vestigial head); intake halves despite growing norms → misdirection.
- R10: bottom-4 transfer histories agree (cos 0.58), top-4 differ (0.38),
  norms equal → convergent misdirection, rule-level bias.
- R11: the attractor NAMED — all 24 flies taste-negative (means −0.40
  to −1.29, posfrac 0.27–0.46). Plain TD on 97%-negative deltas teaches
  "everything is bad" identically in every seed.

Fix (a) of three specified: **background-loss centering** — subtract the
ambient loss rate from per-tick reward before the TD update, so deltas
are no longer 97%-negative and the rule stops converging to universal
negativity. Smallest instrument change of the three (centering term,
null-default 0 = bit-identical R1); distributional and split-matrix
fixes stay queued behind it.

## Hypothesis H8

Centering breaks the uniform-pessimism attractor: centered runs show
(a) taste-weight means no longer uniformly negative (posfrac recovers
toward ~0.5 on at least 6/8 histories), and (b) transfer-current
endpoint beats R1-plain on ≥5/8 reused histories.

## Design (single-variable vs R1)

- Curriculum: R1-plain (same 4 phases, same 8 reused histories — dev
  precedent R2–R7; no fresh bank for scoping-stage dev).
- One arm: centered TD (`centerRate` frozen in plan; delta uses
  reward − c with c = measured background loss/tick from R1 traces,
  read-only constant, NOT learned online in R8).
- Comparator: spent R1 rows (read-only; no re-execution).
- Anchors: A + full probes per history (transfer-current decides).

## Falsifier (fail-closed)

If transfer-current ≤ R1-plain on ≥4/8 histories, OR taste means stay
uniformly negative (posfrac < 0.4 on ≥6/8), H8 is FALSE: centering
insufficient → close R8, promote fix (b) distributional next. No
re-tuning of c (c is read from R1, frozen in plan).

## Instrument shape (for the frozen plan, not this doc)

- `learning/taste-experiment.mjs`: centering term in the live delta,
  null-default 0 (Gen1 bit-identity when off), billed through `m`
  (constant-time subtract; no new scaling).
- Runner `scripts/odor-routed-r8.mjs`: R1-plain curriculum clone, one
  arm + spent-R1 comparator, frozen scorer (transfer-current +
  taste-sign audit: mean/posfrac per history at D).
- Fixtures: centering math (known-delta recovery), null-default
  bit-identity, billed-ops accounting.
- Caps: KEEP R1/R7 envelope (40e9 ops / 3600s wall) until measured.

## What this round is NOT

- Not qualification (dev only; no fresh bank; never cited for RSI).
- Not fix (b)/(c) (queued; licensed only if H8 falsified).
- Not a second attempt at anything closed (R1–R7 verdicts stand;
  R8 tests a new instrument on reused histories).
