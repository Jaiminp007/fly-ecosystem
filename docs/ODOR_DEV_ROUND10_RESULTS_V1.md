# ODOR DEV ROUND 10 — RESULTS V1 (PARTIAL: transfer lifts, acquisition prices it)

Date: 2026-11-02. Single authorized attempt completed clean (no crash,
no resume) under frozen `docs/ODOR_DEV_ROUND10_PLAN_V1.md`.
`redone: []`.

## Verdict: R10-PARTIAL (transfer gate met, acquisition gate missed)

- Transfer-primary: split > R1 on **5/8** (need ≥5). Deltas: −3.68,
  −0.16, +1.01, +1.28, +3.42, −2.94, +2.77, +2.34. PASSES — barely,
  honestly.
- Mechanism-secondary: Go-mean > 0 on **7/8** (need ≥6): −0.022,
  +0.196, +0.497, +0.596, +0.585, +0.483, +0.044, +0.513. PASSES.
  The Go matrix learned positive on nearly every history — the
  positives were learned where the flood doesn't reach. The one miss
  (−0.022) is noise at zero.
- Acquisition-tertiary (difference-based): diff ≥ −0.5 on **5/8**
  (need 6): +0.64, −0.65, −0.63, −0.15, +2.36, −0.44, −1.59, +0.17.
  MISSES by one — recorded, not shopped.
- PARTIAL (frozen: transfer lifts but acquisition fails). NOT a GO;
  NOT a NO-GO.

## What this decides (and what it does not)

The mechanism WORKS and costs too much — the exact PARTIAL the
freeze defined. Split matrices are the first instrument in the
R8/R9/R10 arc whose primary bars both pass: transfer lifts on a
majority AND the Go side learns positive nearly everywhere. The
positives finally have a home the flood cannot enter. But
acquisition pays for it on 3/8 histories (−0.63 to −1.59): reading
behavior from the difference preserves the lesson and taxes its
carrier. Per the frozen plan there is NO (d) — R10's line closes
PARTIAL, and the program returns to the shelf and the diagnostic
under the C17-bar (genuinely new rationale only). The queue spent
in order: centering lost, distributional lost, split works-but-costs.

## Independent recount (2026-11-02, zero worlds, read-only)

Verdict recomputed from raw artifacts by independent code (different
computation path than the runner): transfer 5/8, acquire 5/8,
Go-positive 7/8 — all three match the published counts exactly;
recomputed verdict R10-PARTIAL == published R10-PARTIAL. No rescore
(the recount confirms, never revises).

## Spend and provenance (all ledgered, zero duplicates)

- ~2.655e10 ops total (8 mains + full probe sets), under the 40e9 cap;
  wall inside 3600s. 8/8 mains complete; all 8 D-anchors carry Go/No-Go
  matrices.
- Clean run: no crash, no resume, no repairs. Init: splitTaste=true
  (bank sha 9ae677b3…; r1plain copies verified byte-identical to
  R8/R9 triage). Comparator: spent R1 rows, read-only.
- R1–R9 verdicts untouched (R8/R9 NO-GOs stand). No rescoring: the
  acquisition near-miss (5/8, one short) is noise-at-bar per the
  C-series/R8/R9 pattern — the bars stand.
