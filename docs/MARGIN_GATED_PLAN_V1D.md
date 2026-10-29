# M-GATE plan amendment V1d (mid-execution instrument bugfix + resume)

Frozen 2026-10-28, BEFORE any fix or resume. The single authorized attempt
STARTED (bank `mgate-d/fresh-01`, 30 mains ledgered) and CRASHED on its first
battery with a REAL instrument bug (not a bar/script defect). This amendment
authorizes exactly one fix + one resume; everything else (grid, bank, bars,
caps, G1/G2/G3′/G4/G5) stands.

## Bug (diagnosed read-only from the crash + code)

`restoreTasteEnergyBody`'s sample rebuild (line ~383) spreads
`marginGateTau:value.config.marginGateTau??0`. `??` collapses explicit
`null` (the frozen off/control encoding) to `0`, so restoring any
null-config anchor fails `assert.deepEqual(value.config,sample.config)`
(actual null vs sample 0). Hit on the first tau-null battery (30 mains done:
gen1 24 + tau-null history-1 6). Fix: pass-through
(`marginGateTau:value.config.marginGateTau`; old-checkpoint compat
`undefined→0` already applied above, so undefined never reaches it).

## Why completed work stands (comparability argument)

The changed line executes ONLY inside `restoreTasteEnergyBody`. Main-learner
construction uses `createTasteEnergyBody` (never the restore path), anchors
are written by `structuredClone`/JSON (no validation), and G3′ reads raw
JSON. The 30 completed mains are therefore bit-identical to what fixed code
produces — no re-run of completed rows; resume skips them by the on-disk
row-complete check. Crash accounting: the 6 tau-null history-1 mains ran but
were never checkpointed (row write + ledger checkpoint come after the
battery) — resume re-runs them as crash-recovery (precedent: M-ACTOR `redone`;
D1's 4 crashed pre-invocations). They are disclosed phantom overhead, NOT
ledgered twice: disk ledger holds gen1's 24; resume rebuilds to exactly 96.

## Resume rules (enforced)

1. Fix + null-restore regression fixture test FIRST (restore(null-config
   JSON round-trip) preserves null and validates; undefined→0 preserved).
2. Single `--resume` on the SAME bank (SHA verified against attempt.json) +
   SAME output dir. No other flags change.
3. End-of-run source check records dual provenance
   (`executionSources` = start, `scoringSources` = fixed, per V3 rescore
   precedent) instead of failing on the disclosed fix; any OTHER source
   delta still fails.
4. Ledger must close at exactly mains==96/probes==156 (proves no double
   count); `redone` lists the recomputed row; wall/op caps still enforced.
5. No second resume: another crash → attempt INVALID, publish partials.

## Explicitly not changed

No grid/bank/bar/cap changes; no new worlds beyond the attempt ledger (+6
disclosed phantom mains); no qual contact; G3′/G1/G2 formulas untouched.
