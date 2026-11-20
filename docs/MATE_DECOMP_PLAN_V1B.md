# MATE-DECOMP PLAN V1B — FROZEN (replication of the V1 decomposition)

Date: 2026-11-03. Status: FROZEN (design only until implemented).
Licensed by MATE-DECOMP-GO-V1 (thin n=2 — "licenses replication ONLY").
Single authorized bounded world run (disk floor 1 GB; ~4G at freeze).

## Design (frozen; V1-identical except histories)
- Instrument: `scripts/mate-decomp-v1b.mjs` (new file; V1 verbatim copy
  with MS2 consts — same 3 arms candidate/noTaste/unlearned, transmission
  none, bar 50, nutrient 5.0, BT_TICKS, BT_FOUNDERS). 2 histories × 3 arms
  = 6 mains, ZERO probes.
- Bank: `evidence/mate-decomp-dev/fresh-02/` 473208–473225 (2 × 9),
  verified clean pre-freeze (0 exact hits evidence + tracked), builder
  re-gates at mint. First use is the single V1b run.
- Fixtures: extend `tests/mate-decomp-dev.test.mjs` (V1b bank tmp-mint +
  2-history scorer GO/NOGO; V1 bank test converts to post-spend refusal
  guard per standing order); all green required pre-run, zero worlds.
- Caps: V1 values; expected output <2M. `df` pre/post, abort under 1 GB.
- Single attempt, no rescoring (V1 stands as measured regardless).

## Gates (frozen; same bar on the NEW histories alone)
- G1: ledger exact (6 mains / 0 probes, 2 per arm).
- G2: config audit (identical to V1).
- Verdict: all-zero → INCOMPLETE-NOBIRTHS (void); else candidate-line
  total > unlearned-line total → GO (replication CONFIRMS the V1
  direction; attribution read descriptive only); else NOGO (V1 direction
  unconfirmed — line closes as unconfirmed, INHERIT-V1c precedent).
- Descriptive: taste/motor shares, gen counts, per-history tables.
- Scope: NO population/learning/RSI/retention claim. No cross-line
  pooling.
