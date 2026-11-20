# Development reset-probe V5 FROZEN PLAN (new-bank replication)

Date: 2026-11-03. Status: FROZEN (design only until implemented).
Single authorized bounded world run (disk floor 1 GB; ~4G at freeze).

## Authorization and scope note
V4 closed dev-bank-v1 (`no V5', bank complete, question exhausted AT THAT
BANK). This is not a V5 on the closed bank: it runs the IDENTICAL frozen
V2 design on a VIRGIN bank (dev-bank-v2, fresh random draws, builder-
enforced exclusion) under explicit user authorization ("on a new bank
that is not the closed development reset histories"). Standing rule
"new-bank-required for new measurement" is exactly this. After this run,
no further dev-bank reset probes without a new rationale.

## Design (identical to V2 except bank/histories)
- Instrument: `scripts/taste-development.mjs` (unchanged; fixtures
  `tests/taste-experiment.test.mjs` + `tests/taste-energy.test.mjs` must be
  green immediately pre-run — the frozen fixtures for this instrument).
- Bank: `evidence/taste-development/dev-bank-v2/protocol.json` (minted via
  built-in `bank()`: 8 fresh random histories, exclusion-scanned).
- Run: `--output evidence/taste-development/dev-reset-probe-05 --ticks 1792
  --start 0 --count 2 --arms candidate,unlearned,acceptCruise,frozen,reset`.
- Caps: built-in 600 s runtime cap; expected output single-digit MB; manual
  `df` pre/post with 1 GB floor — abort if free disk drops under 1 GB.
- Single attempt, no rescoring (V1–V4 stand as measured; their banks
  untouched and never re-read for this run).

## Success criteria (frozen, same as V2/V3/V4)
extendedDevelopmentSignal TRUE (candidate>frozen and candidate>reset with
mean>0, ≥75% positive each, nonnegative survivor differences) AND
developmentSignal TRUE. Result published as measured either way, then
pooled descriptively with V2–V4 (6 + 2 histories).
