# MATE-ENCOUNTER Plan V1b — replication + time-to-first-mating (FROZEN, design only)

Date frozen: 2026-10-31. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (why a replication, why now)

- V1 closed GO on a **thin +2 margin** (hub gen-2 5 vs spread 3, 6 histories) —
  V1b-class margin. The INHERIT precedent (V1b GO → V1c NOGO, edge not replicated)
  requires replication before any compounding claim is licensed.
- Mechanism sketch from V1 (hypothesis only): hub → encounters → births (35 vs 25)
  → gen-2 rolls (5 vs 3). The R58 literature (search-games dual, contact-process
  criticality) predicts **meeting-time variance dominates**: childlessness may be
  subcritical realizations, not bad luck. V1 did not record when matings happen.
- This plan therefore replicates V1 EXACTLY (same bar, same structure — replication
  fidelity, not tuning) plus ONE non-gating diagnostic: time-to-first-mating per
  history per arm (min gen-1 `born` tick from lineage; censored if none).

## Arms, bank, caps (V1-identical unless stated)

- Arms (2): spread control vs hub treatment, both nutrientOverride 5.0 + bar 50 +
  matingActionRequired false + verticalTransmission 'maternal' + transmissionNoise
  null. 6 histories × 2 arms = 12 mains, BT_TICKS=1792, ZERO probes.
- Bank `evidence/mate-encounter-dev/fresh-02/`: 6 histories **428001–428054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}). 428xxx verified
  pristine 2026-10-31 (zero exact-seed/registry/test hits; evidence hits are float
  substrings, same standard as 427xxx). Builder re-verifies at build; post-build
  refusal guard; union-excluded from all future qual banks.
- Caps (V1-family): 12 mains / 0 probes / 21504 worldTicks / 516096 founderSlots /
  2.5e9 scalarOperations.
- Instrument: copy of `scripts/mate-encounter-dev.mjs` → `scripts/mate-encounter-v1b.mjs`
  (renamed ME_→M2_, bank/fixture ranges, attempt kind/scope) + time-to-first-mating
  collector (min gen-1 born tick per row; null if no gen-1). Row schema EXPLICITLY
  frozen here (V1 process lesson): {history,arm,mode,topology,matingDecoupled,
  matingEnergyBar,nutrientOverride,transmissionNoise,curves,phaseRows,endpoint,
  births,generations,gen1Lifespan,founderOffspring,lineageFounders,firstMatingTick}.
  NO verticalTransmission row field (V1 correction stands: established by frozen
  runner literal + attempt.json). Schema-conformance fixture required (synthetic-row
  keys ⊆ runner-row keys; the exact failure V1's freeze fixtures missed).

## Gates (conjunctive, fail-closed) and verdicts (V1b bar, frozen-identical)

- G1 integrity (12/12 complete, exact ledger, `redone: []`).
- G2 config audit (V1-corrected form): decoupled, mode/topology===arm, bar 50,
  nutrient 5.0, noise null per-arm map, births valid, generations valid. Else INVALID.
- G-manipulation (fail → INVALID): hub total births > spread total births by ≥10%
  relative AND ≥5 absolute (same numbers as V1 — replication fidelity).
- G-lift: hub gen-2 ≥ 2 AND hub gen-2 > spread gen-2 → **MATE-ENCOUNTER-GO-V1B**.
  Else **MATE-ENCOUNTER-NOGO-V1B**.
- INCOMPLETE-NOBIRTHS if hub gen-1 == 0 (void). INVALID on any gate failure.
- firstMatingTick is DESCRIPTIVE ONLY (non-gating): per-arm median + range reported;
  R58 variance-dominance assessed qualitatively (no gate — gating on it would be tuning).
- Replication assessment (descriptive, no gate): pooled V1+V1b direction + margin;
  a NOGO here with V1 GO = non-replication (line closes as unconfirmed, V1c precedent).

The line closes with its verdict either way. No V1c without a new rationale
(e.g., Emlen-Oring food-vs-encounter split needs the unbuilt attraction knob;
λ-dose needs scaled-hub rationale). Single authorized attempt, cumulative +12.
No RSI claim.
