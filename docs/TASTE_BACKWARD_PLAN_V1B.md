# TASTE-BACKWARD PLAN V1B — FROZEN (replication of the V1 contrast)

Date: 2026-11-03. Status: FROZEN (design only until implemented).
Licensed by TASTE-BACKWARD-GO-V1 (thin n=2 — "licenses replication ONLY").
Single authorized bounded world run (disk floor 1 GB).

## Design (frozen; V1-identical except histories)
- Instrument: `scripts/taste-backward-v1b.mjs` (new file; V1 verbatim copy
  with TB2 consts — same 3 arms, standard phases, legacy nutrients,
  depletion-DiD scorer with frozen A-persistence control, tol = 10%
  pooled candidate A-rate). 2 histories × 3 arms = 6 mains, ZERO probes.
- Bank: `evidence/taste-backward-dev/fresh-02/` 473046–473063 (2 × 9),
  verified clean pre-freeze (0 exact hits evidence + tracked), builder
  re-gates at mint. First use is the single V1b run.
- Fixtures: extend `tests/taste-backward-dev.test.mjs` (V1b bank tmp-mint
  + 2-history scorer GO/NOGO; V1 bank test converts to post-spend refusal
  guard per standing order); all green required pre-run, zero worlds.
- Caps: v1 values; expected output <5M. `df` pre/post, abort under 1 GB.
- Single attempt, no rescoring (V1 stands as measured regardless).

## Gates (frozen; same bar on the NEW histories alone)
- G1: ledger exact (6 mains / 0 probes, 2 per arm) + phaseRows complete.
- G2: config audit (identical to V1; every arm fed > 0 somewhere).
- Verdict on V1b histories alone: all-zero → INCOMPLETE-NOFEED (void);
  else drop(candidate) < drop(unlearned) AND rate(candidate,return-A) >
  rate(unlearned,return-A) AND drop(candidate) ≤ drop(frozen) + tol →
  GO (replication CONFIRMS the V1 direction; still claims nothing
  beyond licensing V1c); else NOGO (V1 direction unconfirmed — line
  closes as unconfirmed, INHERIT-V1c precedent).
- Pooled V1+V1b reading descriptive only (no re-scoring V1, no bar).
- Scope: NO distinct-task/DTR/population/RSI claim. Descriptive only:
  energy-rate DiD, survivors, per-history tables.
