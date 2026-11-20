# MATE-INHERIT status (vertical transmission of learned weights)

Licensed by MATE-ENERGY GO + round-10 major-transition view (replication
must couple with division; verified: newborns currently get zeroed
weights, no vertical transmission anywhere).

- 2026-10-30: `docs/MATE_INHERIT_PLAN_V1.md` FROZEN (maternal exact-copy
  transmission, no mutation yet; 2 arms zeroed/maternal × 6 histories =
  12 mains on fresh bank 405001–405054 verified clean; GO = +6 births gap;
  both-zero → INCOMPLETE-NOBIRTHS (not NOGO); new TasteExperiment flag
  `verticalTransmission`, null-default).
- 2026-10-30: Phase-A EXECUTED → **NOGO (transmission verified working,
  changes nothing)**. Identical per-seed births (16/16, gap 0); mechanism
  confirmed live (unit-tested copy path + audited plumbing), effect absent
  — likely one-generation window (founders do most mating; transmitted
  weights have no gen-2 to compound in). Line closed for exact-copy;
  V1b needs mutation + lineage tracking (UNLICENSED by the NOGO — needs
  a new rationale; feasibility first). Full record:
  MATE_INHERIT_RESULTS_V1.md.
- 2026-10-26: Phase-B FROZEN as `docs/MATE_INHERIT_PLAN_V1B.md` (DESIGN ONLY).
  Mutated maternal transmission (additive N(0,0.05) post-copy, dedicated
  per-newborn RNG stream, 1 op/element billed; null-default exact-copy
  preserved) + lineage compounding: 12 mains (exact vs mutant, BOTH
  enriched nutrient 5.0 — uniform enrichment isolates mutation) on fresh
  bank 416001–416054 (verified clean pre-freeze, 0 hits; re-verify at
  build). Rationale now exists: V1f gen-2 existence + MLS/ratchet
  standing lit (variation is load-bearing). GO iff mutant gen-2 ≥ 2 AND
  mutant > exact (replication-within-line + direction; feasibility-
  grade, power ≈ 1-in-5 under 2x effect, stated); INCOMPLETE-NOMUTANTS
  iff mutant gen-1 == 0 (void, not NOGO); else NOGO with stop-rule
  analogue (no auto-escalation; deleterious direction reported).
  Descriptive maxGeneration/gen-3+/gen-1-lifespan (censored) for V1c
  design. No RSI claim (GO licenses V1c selection, not an advance).
- 2026-10-26: Phase-B IMPLEMENTED (`scripts/mate-inherit-v1b.mjs` +
  `tests/mate-inherit-v1b.test.mjs` 8/8 green; triage clean (engine
  null-default verified behavior-identical); bank
  `evidence/mate-inherit-dev/fresh-02/` built 416001–416054
  post-fixtures). Engine: transmissionNoise plumbing (null default +
  per-newborn seeded RNG + billed ops; V1's exact-copy path untouched).
  Fixtures: scorer GO/NOGO/INCOMPLETE-NOMUTANTS/INVALID incl. totals-
  null; generation summarizer + censored lifespan; V1-parity; options-
  contrast (single knob). Bank test → post-build refusal + read-only
  checks.
- 2026-10-26: Phase-B EXECUTED → **MATE-INHERIT-GO-V1B (thin margin)**.
  G1 12/12 exact ledger (12/0/21504/516096/2.36e9); G2 audit pass (null
  vs 0.05 transmission, enriched both arms, lineage-verified).
  Mutant gen-2 = 3 ≥ 2 AND > exact gen-2 = 2 → GO per pre-registered bar
  (exact: 416028x1 + 416046x1; mutant: 416037x1 + 416046x2). No
  INCOMPLETE (mutant gen-1 31 > 0). Reading: weak-positive, confirm
  don't celebrate — margin is one birth, 2/3 mutant gen-2 on one seed;
  effect directionally consistent (2x rate) but Poisson-dominated.
  No overdose (mutant ≥ exact), no vigor difference (~1300 ticks both),
  no gen-3 anywhere (max 2 both). Cumulative 7632 (+12 ledgered;
  per-line authoritative). Next: V1c replication + lineage resolution
  under its own frozen plan — not started, no RSI claim.
- 2026-10-26: Phase-C FROZEN as `docs/MATE_INHERIT_PLAN_V1C.md` (DESIGN
  ONLY; FINAL chartered mating line absent V1d license — closes either
  way). Exact V1b replication (same arms/σ/bar/caps) + lineage-founder
  resolution (maternal-line founders per gen-2+, defensive) on fresh bank
  417001–417054 (verified clean pre-freeze, 0 hits; re-verify at build).
  Pre-registered: GO bar UNCHANGED (replication fidelity, not tuning);
  descriptive spread-vs-concentration reading decides V1d's form (robust
  → mechanism/selection; concentrated → within-run competition to break
  seed-confound) or closes the line (NOGO = unconfirmed). No V1d.
- 2026-10-26: Phase-C IMPLEMENTED (`scripts/mate-inherit-v1c.mjs` +
  `tests/mate-inherit-v1c.test.mjs` 9/9 green; triage at 6-pristine
  baseline; bank `evidence/mate-inherit-dev/fresh-03/` built 417001–
  417054 post-fixtures). Exact V1b replication + lineage-founder
  tracking (founders per gen-2+/gen-3, orphans dropped, cycles break,
  per-arm founder spread in dev-results) + censored gen-1 lifespan
  retained; scorer V1C verdicts + founders-presence G2 check; fixture-
  guarded single knob + V1-parity + C-dip-style null-hygiene.
  Bank test → post-build refusal + read-only checks.
- 2026-10-26: Phase-C EXECUTED → **MATE-INHERIT-NOGO-V1C (edge does
  not replicate; LINE CLOSED as unconfirmed)**. G1 12/12 exact ledger
  (12/0/21504/516096/2.36e9); G2 audit pass (incl. founders-present
  check); exact gen-2 = 3 vs mutant gen-2 = 1 → NOGO (bar needs mutant
  ≥2 AND > exact). Per-seed: exact 428x1 + 046x2 (2 seeds spread +
  first gen-3 [founder 17], max gen 3); mutant 028x1 only. Pooled
  V1b+V1c: mutant 4 vs exact 5 on 24 mains — no effect; V1b excess
  was one seed (416046). No V1d licensed. Cumulative 7638 (+12
  ledgered; per-line authoritative). LINE CLOSED.
