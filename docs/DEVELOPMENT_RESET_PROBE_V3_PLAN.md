# Development reset-probe V3 FROZEN PLAN (single authorized bounded run)

## Authorization
User-authorized single bounded world run ("score a world… one bounded world
run is allowed", disk floor 1 GB; disk ~4.6G at freeze).

## Rationale (replication, not rescoring)
V2 (histories 2–3) found continued learning loses to freezing 2/2
(mean −0.41, survivors −5) and mixed vs reset — an interference signature,
but on n=2. Per the program's own replication precedent (V1c-thin → V1d
replicate), a thin 2-history observation must be replicated before it informs
any next step. V3 replicates the IDENTICAL comparison on the next two
unspent histories of the same audited bank. This is not a rescore: new
histories, same frozen design. No milestone can change (development-grade).

## Frozen design (identical to V2 except histories)
- Instrument: `scripts/taste-development.mjs` (unchanged; fixtures
  `tests/taste-experiment.test.mjs` + `tests/taste-energy.test.mjs` must be
  green immediately pre-run).
- Bank: `evidence/taste-development/dev-bank-v1/protocol.json` (audited).
- Run: `--output evidence/taste-development/dev-reset-probe-03 --ticks 1792
  --start 4 --count 2 --arms candidate,unlearned,acceptCruise,frozen,reset`.
- Caps: built-in 600 s runtime cap; expected output single-digit MB; manual
  `df` pre/post with 1 GB floor — abort if free disk drops under 1 GB.
- Single attempt, no rescoring; result published as measured either way.

## Success criteria (frozen, same as V2)
extendedDevelopmentSignal TRUE (candidate>frozen and candidate>reset with
mean>0, ≥75% positive each, nonnegative survivor differences) AND
developmentSignal TRUE. Replication CONFIRMS the V2 pattern iff
candidate<frozen in both histories (mean<0) and reset comparison stays mixed
or negative. Anything else is reported as measured.
