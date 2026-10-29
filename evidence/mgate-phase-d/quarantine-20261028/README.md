# QUARANTINE README — foreign run found in M-GATE paths (2026-10-28)

## What happened

At ~21:16–21:21 EDT 2026-10-28, during the M-GATE Phase-D session and BEFORE
any M-GATE world ran, the frozen M-GATE paths were found occupied:

- `evidence/margin-gated-dev/fresh-01/protocol.json` — a `body-transfer-v3-dev`
  bank (random 32-bit seeds, created 21:16:20, NOT the M-GATE deterministic
  382001–382036 bank). No M-GATE command writes V3 banks; origin unknown
  (no matching command in this session; possibly a concurrent worker).
- `evidence/margin-gated-dev/attempt-01/` — a COMPLETE V3 Phase-D re-run
  (72 mains + 156 probes, 12 rows, 24 anchors, `dev-results.json` with verdict,
  finished 21:21:03). M-GATE's runner refuses to share an output dir, and the
  bank assert (`margin-gated-dev` vs `body-transfer-v3-dev`) correctly
  blocked the M-GATE start: **zero M-GATE worlds were spent**.

## What was done (preserve, don't delete)

Both artifacts were MOVED here byte-identical (see `MANIFEST.json`: 81 files,
sha256 of every file) — nothing deleted, nothing overwritten. They remain
valid evidence of whoever's run this was; restore with:
`mv evidence/margin-gated-dev/quarantine-20261028/foreign-v3-bank-protocol.json evidence/margin-gated-dev/fresh-01/protocol.json`
`mv evidence/margin-gated-dev/quarantine-20261028/foreign-v3-rerun-attempt-01 evidence/margin-gated-dev/attempt-01`
(leaving M-GATE's own `fresh-01/protocol.json` + `attempt-01/` to be moved
aside first — coordinate, do not mix).

## M-GATE impact

- The premature `fresh-01/fixture-seeds-01.json` written by M-GATE's blocked
  startup (byte-identical to the run's own const) was removed and is
  rewritten by the run itself after bank build (ordering required: the
  exclusion scan seed-indexes evidence JSON, V1c amendment notes this).
- M-GATE's single attempt ran AFTER quarantine on the clean frozen paths.
  Session/world counts in RESULTS are M-GATE only.
