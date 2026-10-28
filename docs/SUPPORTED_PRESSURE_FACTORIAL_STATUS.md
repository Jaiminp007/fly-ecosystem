# Supported pressure factorial preparation

The full study subsequently ran after space became available. Its results and
successful independent audit are in `SUPPORTED_PRESSURE_FACTORIAL_RESULTS.md`;
the notes below describe the earlier, preserved preparation state.

`scripts/supported-pressure-factorial.mjs` and its independent checker prepare
the fixed design in `SUPPORTED_PRESSURE_FACTORIAL_PLAN.md`. They preserve full
compressed checkpoint and bounded-stream compressed trace data, copy model
components with matched declared charges, and verify frozen support and ledger
state. The supported-model assignment test and five related focused tests pass.

Both scripts pass syntax checks. A preflight attempt at less than 1 GiB free
correctly exits before creating any output directory; the collector has not run
and no factorial outcome exists. The full collector, checker and on-disk
encoding have not yet been end-to-end tested on real experiment output.
Preserve all existing evidence; do not bypass the space guard or infer results.

`tests/supported-pressure-factorial-smoke.test.mjs` also passes a five-tick,
four-arm in-memory smoke test using one existing D world: independently copied
assignments and charges, matching initial worlds, concatenated gzip members,
and exact event/endpoint replay. This small test writes no experiment tapes,
does not execute the full collector/checker, and is not scientific evidence.

After freeing at least 1 GiB on the workspace volume, run
`node --max-old-space-size=512 scripts/supported-pressure-factorial.mjs`, then
`node --max-old-space-size=512 scripts/check-supported-pressure-factorial.mjs`.
A floor-triggered interruption is incomplete and must be preserved; it requires
a verified recovery approach, not a duplicate launch or overwritten artifacts.
The full goal, qualification gates and reserve boundaries remain unchanged.
