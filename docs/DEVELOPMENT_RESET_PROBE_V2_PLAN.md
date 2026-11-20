# Development reset-probe V2 — FROZEN PLAN (not authorized, not executed)

## Status: FROZEN, awaiting authorization. Do not execute without explicit user authorization.

## Objective
Exercise the reset-arm divergence that V1 could not (criterion 1: lifetime-learning
benefit disappearing under memory reset). V1 proved the 512-tick horizon vacuous
by source-verified construction (phase A ends tick 512; freeze/reset bite only
at B/C). V2 runs the horizon where the manipulation exists.

## Frozen design
- Instrument: `scripts/taste-development.mjs` (unchanged; fixtures
  `tests/taste-experiment.test.mjs` + `tests/taste-energy.test.mjs` must be
  green immediately pre-run).
- Bank: reuse `evidence/taste-development/dev-bank-v1/protocol.json`
  (audited virgin 72/72; development reuse explicitly allowed).
- Run: `--output evidence/taste-development/dev-reset-probe-02 --ticks 1792
  --start 2 --count 2 --arms candidate,unlearned,acceptCruise,frozen,reset`.
  (Unused histories 2–3; single attempt; no rescoring; no re-runs on failure —
  failure is published as-is.)
- Caps: built-in 600 s runtime cap; expected output single-digit MB
  (includes pressure battery + probes at 1792 ticks); manual `df` pre/post
  with 1 GB floor — abort the turn if free disk drops under 1 GB.

## Success criterion (frozen)
`extendedDevelopmentSignal` TRUE (candidate>frozen and candidate>reset with
mean>0, ≥75% histories positive each, nonnegative survivor differences) AND
`developmentSignal` TRUE. Anything else (including partial patterns) is
published as measured, no rescoring, no milestone change without a separately
authorized qualification campaign.

## Scope
Development-grade only (`qualified:false`). Never retention/pressure/transfer
qualification or RSI evidence regardless of outcome.
