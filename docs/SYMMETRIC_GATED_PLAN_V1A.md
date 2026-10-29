# S-GATE plan amendment V1a (execution-time script-bug fix + resume)

Frozen 2026-10-28, BEFORE any fix or resume. The single authorized attempt
ran ALL worlds cleanly (72 mains + 156 probes, ledger exact, 12 rows + 24
anchors on disk) and crashed in scoring, before any verdict artifact:
`checkNonDegeneracy` builds `W` keyed by tag STRINGS (`tau-null`/`tau-0`/
`tau-0.3`) but reads it back by tau VALUES (`W[0.3]` → undefined →
`Object.keys(undefined)` throws). The weights-loading half (`weightsOf` on
all 12 anchors) already succeeded — only the comparison loop is unexercised.
No instrument, bank, grid, or bar changes: a script keying bug, nothing more.

## Fix (one hunk)

Read back by the same tag strings used at build:
`Object.keys(W['tau-0.3'])`, compare against `W['tau-null'][h]` /
`W['tau-0'][h]`. Verified pre-resume on synthetic keying shapes only (the
real-anchor comparison runs exactly once, inside the resumed attempt —
no standalone verdict computation beforehand).

## Resume rules (M-GATE V1d precedent)

Single `--resume`-equivalent (same bank SHA verified inside the run, same
output dir). All 12 rows complete → resume skips all worlds and re-enters
scoring only; `redone` stays empty; ledger must close at exactly 72/156.
Dual provenance in `dev-results.json` (executionSources=start,
scoringSources=fixed). End-of-run sources assert stays hard. No second
resume: another crash → attempt INVALID, publish partials.

## Explicitly not changed

No grid/bank/bar/cap changes (G3 stays exactly (i)(ii)(iii′) as frozen);
no new worlds (228 already ledgered); no qual contact.
