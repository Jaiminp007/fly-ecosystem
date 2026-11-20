# Development reset-probe V4 FROZEN PLAN (single authorized bounded run)

## Authorization
User-authorized single bounded world run ("score a world… one bounded world
run is allowed", disk floor 1 GB; disk ~5G at freeze).

## Rationale (bank completion, not rescoring)
V2 (histories 2–3): harm. V3 (histories 4–5): benefit. Zero-world analysis
of all four row archives found NO clean discriminator: phase-A entry energy
(−22.3/−22.3/−20.6/−23.2) and beneficial fractions (0.52/0.52/0.56/0.46) do
not separate the groups — the best-A and worst-A histories are BOTH benefit
histories. Candidate/frozen track identically through A by design; divergence
is late-phase and small (±0.4 on −64). With n=2 per group, further
discriminator-hunting is noise-mining — STOPPED. V4 runs the last two
unspent histories (6–7) under the identical frozen design, completing the
bank for this question (0–1 short-horizon, 2–7 full-horizon). After V4 the
reset question is EXHAUSTED at dev scale regardless of outcome; no V5.
No milestone can change (development-grade).

## Frozen design (identical to V2/V3 except histories)
- Instrument: `scripts/taste-development.mjs` (unchanged; fixtures
  `tests/taste-experiment.test.mjs` + `tests/taste-energy.test.mjs` must be
  green immediately pre-run).
- Bank: `evidence/taste-development/dev-bank-v1/protocol.json` (audited).
- Run: `--output evidence/taste-development/dev-reset-probe-04 --ticks 1792
  --start 6 --count 2 --arms candidate,unlearned,acceptCruise,frozen,reset`.
- Caps: built-in 600 s runtime cap; expected output single-digit MB; manual
  `df` pre/post with 1 GB floor — abort if free disk drops under 1 GB.
- Single attempt, no rescoring; result published as measured either way.

## Success criteria (frozen, same as V2/V3)
extendedDevelopmentSignal TRUE AND developmentSignal TRUE on histories 6–7.
Final synthesis reported over all six full-horizon histories (2–7) with no
further runs on this question.
