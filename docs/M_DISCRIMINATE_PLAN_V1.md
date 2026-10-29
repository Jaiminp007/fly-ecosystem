# M-DISCRIMINATE plan V1 (trained-vs-zeroed hunt, zero worlds)

Frozen 2026-10-29. Status: DESIGN ONLY until analysis. Zero new worlds, zero
seeds, zero bank contact — spent probe batteries are read as MEASUREMENT
(R1 precedent). Answers V1a's entry condition: show a trained≠zeroed
context, or keep the gate closed.

## Data (verified present read-only 2026-10-29; nothing else may be touched)

Paired `current` (trained) vs `reset` (zeroed) probe values, same family:
- V2 `evidence/body-transfer/v2/attempt-01/rows/*.json`: `direct` + `directP`
  dicts with `A:current/A:reset, B:current/B:reset,
  transfer:current/transfer:reset` (+accepts). Per-body N/Q/P probes nested
  separately (out of scope — direct pairs only).
- V3-dev: CONCLUDED+ARCHIVED (`evidence/_concluded-small-misc.tar.gz`).
  Single-file extract to scratch outside `evidence/`, read, delete —
  archive untouched (sha256 re-verified after). Disclosed, not hidden.
- M-ACTOR `motor-anchor-dev/attempt-01`, M-GATE `mgate-d/attempt-01`,
  S-GATE `symmetric-gated-dev/attempt-01`: standard 12-key rows
  (A/B/transfer × current/reset + accepts); M-GATE/S-GATE have 3–4 configs
  sharing history seeds (Q3 replication substrate; note: M-GATE tau-0 ≡
  tau-0.2 bit-identical — count as ONE config for replication).

## Questions (exact computations, pre-registered rules)

- Q1 EXISTENCE: for every (history × family × bank) pair with both versions,
  d = |value(current) − value(reset)|. Report: histogram over thresholds
  {0.1, 0.5, 1.0, 5.0} (fraction ≥ each), max, and per-bank fractions.
  GATE RULE: fraction ≥1.0 exceeding 10% → gate OPENS (name the top contexts
  as the licensed arena in RESULTS). Below 2% → gate stays CLOSED (RESULTS
  proposes the program pivot to new substrates). In between → marginal:
  report exactly, license nothing either way.
- Q2 LOCUS (descriptive): d broken down by family (A/B/transfer) × study.
  No gate — maps where discrimination lives if anywhere.
- Q3 RELIABILITY: for histories shared across configs, does the pair-level
  verdict (|d|≥1.0 or not) replicate? Rule: top contexts replicate across
  ≥2 DISTINCT configs (tau-0/0.2 count once) → arena proposal names them
  specifically. Else → note instability, name no arena (even if Q1 opened —
  then the output is "gate open, arena unstable", no intervention licensed).

## Analysis discipline (violations invalidate the run)

- Tool: `python3` + stdlib ONLY (`json, math, statistics, tarfile` for the
  single archived read); no engine imports, no node, zero worlds; no writes
  to `evidence/` (archive re-verified by sha256 after the read; scratch
  outside evidence/, deleted after). Output: `docs/M_DISCRIMINATE_RESULTS_V1.md`
  (+ status updates), committed.
- No new banks/seeds/worlds/probes; no qual contact; no RSI claims; no
  rescoring of prior verdicts (their numbers are inputs).
