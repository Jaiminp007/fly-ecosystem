# WHAT-RETAINS diagnostic plan V1 (decompose the development gain)

Frozen 2026-10-28. Status: DESIGN ONLY until analysis. Zero new worlds, zero
seeds, zero bank contact — spent banks are read as MEASUREMENT (R1 precedent).
This plan licenses PROPOSALS, never interventions: each question below names
the follow-up its answer triggers (or kills).

## Data (verified present read-only 2026-10-28; nothing else may be touched)

- `evidence/mgate-d/attempt-01/`: 16 rows (configs gen1/tau-null/tau-0/tau-0.2
  × 4 histories 382001–382036) + 32 anchors; gated rows carry 6 arm endpoints,
  12 probes, relevance recs (margin+hit only, NO ticks — no temporal analysis
  is possible), alignment {cos,n}. Gen1 rows carry mains only.
- `evidence/symmetric-gated-dev/attempt-01/`: 12 rows (null/0/0.3 × 4 histories
  383001–383036) + 24 anchors, same gated-row structure.
- Available anchors are CANDIDATE atA/atC only (no unlearned/frozen anchors on
  disk) — Q2 uses atC−atA learning distance, not candidate-vs-unlearned.

## Q1 — arm-decomposition of retention (what carries the gain?)

Exact: per study × history × gated config, tabulate arm endpoints
(candidate/unlearned/frozen/reset/acceptCruise/acceptStationary
`budgetAdjustedEnergyPerFounder`) + probe values (all 12 keys) + aggregates
Aret=`A:current−.95·A:A−.05·A:reset`, Bret likewise, level=
candidate−unlearned. Descriptive bars: mean±sd across histories per config;
cross-config deltas; A:current−A:A gap distribution.
Rule: if |A:current−A:A| ≤ 0.05·|Aret| on ≥6/8 control histories → same-body
re-exposure explains retention → LICENSE re-exposure-schedule proposal.
If level concentrates outside candidate−unlearned (frozen/reset arms move
with it) → LICENSE mechanism-of-origin proposal on that arm. Else: no
arm-targeted follow-up.

## Q2 — dose-response (does more learning = more retention?)

Exact: per CONTROL history (tau-null/null, N=8): d_learn = RMS over alive
learners of ||atC.weights.taste − atA.weights.taste||₂ vs that history's
Aret. Pearson r + Spearman ρ (N=8 noted as weak-power; report both).
Rule: r>0.5 (same sign ρ) → LICENSE rehearsal/consolidation proposal
(volume matters). |r|<0.3 → weight-volume irrelevant (consistent with the
V3 two-timescale failure) → NO volume-based follow-up, ever.

## Q3 — alignment-vs-retention scatter (does the V3 premise hold?)

Exact: points = histories × gated configs with both fields
(12 M-GATE + 12 S-GATE = 24): x=row.alignment.cos, y=Aret. Pearson r +
scatter. Rule: |r|<0.3 on N=24 → CLOSE direction-protection PERMANENTLY
(all variants: uniform, motor, asymmetric-gated, symmetric-gated — the
premise, not a parameter, is dead). r≥0.5 → REOPEN gated work under a new
plan (unexpected; state the surprise plainly).

## Q4 — margin-calibration stability (is G1 bank-independent?)

Exact: pool control relevance recs per study (≈38k each); decile-bin margins;
per-decile hit-rate; max|Δ| across studies per decile; compare verdict cuts.
Rule: max decile |Δ|≤0.05 → measurement stable and bank-independent (G1
stands as substrate). Else → report instability with the divergent deciles
(no follow-up either way; measurement question only).

## Analysis discipline (violations invalidate the run)

- Tool: `python3` + stdlib ONLY (`json, math, statistics`); importing any
  engine module (`learning/*`, `scripts/*dev*`, `TasteExperiment`) or
  spawning node FAILS the run on inspection. Analysis must be incapable of
  advancing worlds.
- Reads: the two attempt dirs only (rows/anchors/ledger). No writes to
  `evidence/` (no new files, no mtimes). Scratch in /tmp only. Output:
  `docs/WHAT_RETAINS_RESULTS_V1.md` (+ this plan's status updates), committed.
- No new banks/seeds/worlds; no qual contact; no RSI claims; no rescoring of
  prior verdicts (their numbers are inputs, never recomputed for judgment).
