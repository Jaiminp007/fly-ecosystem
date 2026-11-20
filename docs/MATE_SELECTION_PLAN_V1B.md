# MATE-SELECTION PLAN V1B — FROZEN (replication of the V1 contrast)

Date: 2026-11-03. Status: FROZEN (design only until implemented).
Licensed by MATE-SELECTION-GO-V1 (thin n=1, 6>5/5 — "licenses replication
only"). Single authorized bounded world run (disk floor 1 GB).

## Design (frozen; V1-identical except histories)
- Instrument: `scripts/mate-selection-v1b.mjs` (new file; V1 verbatim copy
  with MS2 consts — same 3 learning-variant arms, transmission 'none',
  bar 50, nutrient 5.0, BT_TICKS, BT_FOUNDERS). 2 histories × 3 arms =
  6 mains, ZERO probes.
- Bank: `evidence/mate-selection-dev/fresh-02/` 473010–473027 (2 × 9),
  verified clean pre-freeze (0 exact hits evidence + tracked), builder
  re-gates at mint. First use is the single V1b run.
- Fixtures: extend `tests/mate-selection-dev.test.mjs` (V1b bank tmp-mint +
  2-history scorer GO/NOGO); all green required pre-run, zero worlds.
- Caps: v1 values; expected output <3M. `df` pre/post, abort under 1 GB.
- Single attempt, no rescoring (V1 stands as measured regardless).

## Gates (frozen; same bar on the NEW histories alone)
- G1: ledger exact (6 mains / 0 probes, 2 per arm).
- G2: config audit (identical to V1).
- Verdict on V1b histories alone: all-zero → INCOMPLETE-NOBIRTHS (void);
  else candidate total > unlearned total AND candidate ≥ frozen total → GO
  (replication CONFIRMS the V1 direction; still claims nothing beyond
  licensing V1c); else NOGO (V1 direction unconfirmed — line closes as
  unconfirmed, INHERIT-V1c precedent).
- Pooled V1+V1b reading published as DESCRIPTIVE only (no re-scoring V1,
  no bar on the pool).
- Scope: NO population/learning/RSI/retention claim. Descriptive: gen-2,
  gen-1 lifespan per arm.
