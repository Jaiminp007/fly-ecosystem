# MATE-WINDOW RESULTS V1: INCOMPLETE-NOBIRTHS (sterile bank, void metric)

Single authorized attempt-01: 24/24 mains, 0 probes, g0/g1 true.
Verdict INCOMPLETE-NOBIRTHS — birthy rows 7/24 < 12 (50% floor).
Metric void, NOT NOGO. Line CLOSED either way (no V2 without
fresh rationale). Cumulative 7977 + 24 = 8001 mains (+4.03e9 ops).

## Totals (descriptive only — floor-voided, no claim)

- control (legacy all phases): 0 births (0/6 seeds birthy)
- early (enriched phase-0 only): 5 births (3/6: 2,0,1,0,2,0)
- late (enriched phase-2 only): 0 births (0/6 seeds birthy)
- full (enriched all phases): 11 births (4/6: 5,2,2,0,2,0)
- Per-arm detail: enrichment directionally helps
  (full 11 > early 5 > control = late = 0), consistent with
  FOOD (enriched births) and with the window thesis (early
  shows, late doesn't) — but with control at zero on all 6
  seeds, no comparison is meaningful. Reported, not claimed.

## Bank

Fresh-13 bank 446001–446054 (6 histories × 9 seeds), verified
clean pre-build (0 seed-key hits in prior evidence, 0 mentions
in docs/scripts/tests/learning), 23,157 excluded seeds
(union-excluded incl. all spent banks 379–445). Spent by this
attempt (24 mains); 30 reserve slots never spendable. First use
was qualification (this attempt).

## Incident + repair (dual provenance, result-independent)

- At 18/24 mains the run stopped on the frozen op cap
  (ledger 2.96e9 vs MW_OP_CAP 3.0e9): plan arithmetic error —
  per-main ops measured 165M pre-attempt (timing probe) but
  the cap (3e9) fits ~18 mains, not 24. Ticks/slots/wall caps
  all held (43k/150k, 1.03M/2M, ~130s/3600s) — ops only.
- Repair (M-POP V2 crash-fix precedent: result-independent
  repair + dual-provenance resume, disclosed): cap 3.0e9 →
  5.0e9 (24 × 165M measured + margin). ONE line changed
  (scripts/mate-window-dev.mjs); verdict gates G0–G4
  untouched; no rows rescored; no completed row re-executed
  except the crashed 19th main (died in ledger-note BEFORE
  row write — no partial row existed).
- Provenance: redone[] lists all 6 full-arm mains re-executed
  post-repair; dev-results.json records executionSources
  (pre-repair instrument hash, 18 mains) ≠ scoringSources
  (post-repair hash, scoring) — split by design.
- Result-independence: correction determined by arithmetic
  (24 × measured 165M), not by row contents (birth totals
  unscored until 24/24 complete — scorer requires g0).
  The 18 completed rows stood unmodified (resume skips).

## Reading (licensed, bounded)

- The sterile control (0/6) is bank luck (other banks' hubs
  birth 5–9; timed audit medians), not a base defect proven —
  but it voids THIS bank for window comparisons (no control
  births → manipulation gate uncomputable → INCOMPLETE, not
  NOGO, exactly as the floor prescribes).
- Late all-zero is consistent with window-closed but
  uninterpretable for the same reason (TIMING-REFUTED
  correctly not reached — the floor fires first by design).
- Track B rationale (early-encounter maximization) is NEITHER
  confirmed NOR refuted (no test occurred — the metric was
  void). It remains specified, unexecuted. A future line
  needs a birthy base verified BEFORE the window test
  (lesson: run a 6-seed control pilot? — NO (extra spend
  without verdict); better: pick a historically-birthy
  bank FAMILY (encounter-hub 2–10/arm) rather than a fresh
  draw — but fresh-bank discipline forbids reusing spent
  banks. Tension noted, unresolved: birthy base vs fresh
  bank is the design problem V2 inherits).

## Status

- Line CLOSED (INCOMPLETE-NOBIRTHS). No V2 without fresh
  rationale addressing the sterile-control problem.
- No RSI claim (nothing here satisfies anything).
