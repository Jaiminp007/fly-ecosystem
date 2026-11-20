# MATE-WINDOW PLAN V1 (FROZEN — DESIGN ONLY, no code, no bank, no attempt)

Status: FROZEN as design. Implementation (instrument + fixtures +
triage + fresh bank + single authorized attempt) requires a
separate implementation freeze before code (freeze-before-code).
This doc spends nothing: zero worlds, zero seeds, zero bank draws.

## Motivation (licensed rationale)

- TIMING_AUDIT_V1: mating window opens tick ~200 everywhere
  (medians 224–294/1792, max 746); medians ≤300 in 31/33 timed
  distributions; initiation certain given the field.
- M-POP V2 refutation: bar 65→50 changes nothing (blocker
  upstream of energy); longevity buys dead ticks (14v4v1
  survival without conversion — extra survival is late,
  window is early).
- Track B requirement (M-POP V2 verdict: "V3 needs non-bar
  rationale"): this plan IS Track B — non-bar (timing),
  non-longevity (windowed) rationale, implemented as
  phase-windowed nutrient manipulation on a birthy hub base.
- Machinery exists (no new engine code): nutrientOverride is
  per-phase re-asserted (MATE-FOOD precedent: enriched forced
  5.0 constant vs legacy control table). Windows map to phases
  (512 ticks): early ≈ phase 0 (0–512); late ≈ phase 2
  (1024–1536). No engine changes; null-default paths untouched.

## Design (4 arms × N seeds, birthy hub base)

- Base: encounter-hub topology (birthy: 5–9/arm medians),
  bar HELD at 65 (V1 default — bar is NOT the knob),
  maternal transmission (null default), all other knobs HELD
  (gain deployed 1.0/3.0? — NO: gain HELD OFF (uniform) to
  isolate timing; surprise-gating stays deployed (substrate)).
- A0 hub-control: legacy nutrient table all phases
  (HELD negative reference; expects 5–9 births).
- A1 hub-early: enriched (5.0) phase 0 ONLY, legacy else
  (the candidate: boost inside the window).
- A2 hub-late: enriched (5.0) phase 2 ONLY, legacy else
  (the timing control: same boost, window closed —
  predicts ≈ A0 (window matters, not just more)).
- A3 hub-full: enriched (5.0) all phases (HELD positive
  reference; replicates MATE-FOOD GO direction).
- N seeds: 6 histories × 4 arms = 24 mains (matches MATE-FOOD
  scale (12 mains? — NO: FOOD was 12 (2 arms × 6); WINDOW is
  24 (4 arms × 6)). Fresh bank 54-unique (union-excluded incl.
  all spent banks + fixture seeds), first use = qualification.

## Gates (conjunctive; fail-closed)

- G0 integrity: residual <1e-7 all rows; common starts;
  sources unchanged (runner + scorer hash-pinned at freeze).
- G1 manipulation: A1 births > A0 births by ≥20% AND ≥2
  (margin: windowed boost must beat control materially;
  bank-volatile births need both relative + absolute).
- G2 timing: A1 births > A2 births (same boost, open vs
  closed window — the TAXONOMY gate: timing, not amount).
  Descriptive (no threshold — direction only); if A2 ≥ A1,
  the window thesis fails even if G1 passes (→ NOGO with
  timing-refuted note).
- G3 reference: A3 ≥ A0 (enriched-all replicates FOOD
  direction; if A3 < A0, bank pathology → INVALID).
- G4 null-hygiene: cross-arm contamination counters
  (phase-0-only enrichment must not leak to other phases:
  per-phase nutrient assertions logged per row); no
  unbilled ops (nutrientOverride path already billed —
  imposed by FOOD precedent, re-verified at implementation).
- Floors: ≥50% rows with ≥1 birth overall (else
  INCOMPLETE-NOBIRTHS — metric void, not NOGO); survivors
  ≥25% per arm (else censored arm noted, verdict stands on
  the rest).

## Budget (frozen caps)

- ≤24 mains + ≤48 probes (firstMatingTick-style probes? —
  NO new probes (firstMatingTick already recorded; reuse it));
  ≤150k ticks; ≤2M founder-slots; ≤3e9 ops; ≤200MB;
  ≤3600s wall. Single authorized attempt; crash-resume only
  with dual provenance (redone list + bank SHA re-verified).

## Verdict taxonomy

- GO-WINDOW: G0∧G1∧(A1>A2)∧G3∧G4 (timing matters; Track B
  rationale confirmed; line closes, deployment specified
  separately (early-boost as candidate intervention)).
- NOGO-WINDOW: G0∧¬G1 (early boost doesn't beat control —
  window open but unexploitable this way; line closes).
- TIMING-REFUTED: G0∧G1∧(A2≥A1) (boost works, window doesn't —
  amount matters, timing doesn't; line closes, rationale
  revised).
- INVALID-*, INCOMPLETE-*: fail-closed per G3/floors
  (bank pathology or void metric; line closes either way).

## Line discipline

- Closes either way (no V2 without fresh rationale).
- No rescoring, no second attempt, no bank regeneration.
- Implementation freeze (instrument + fixtures + triage
  results + bank SHA) required before any execution.
