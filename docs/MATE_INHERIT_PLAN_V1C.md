# MATE-INHERIT Plan V1c — exact V1b replication + lineage resolution (DESIGN ONLY)

Status: FROZEN 2026-10-26. No code, no worlds, no bank build under this doc.
Next: implement under this plan, then single attempt.

## Question (confirmatory, not exploratory)

V1b: mutant gen-2 = 3 > exact gen-2 = 2 (weak GO, one-birth margin, 2/3
concentrated on one seed). Does the edge replicate on a fresh bank, or
regress to the mean (V1b luck)? This line changes NOTHING about the
intervention — identical arms, identical σ, identical bar — and adds
only lineage resolution (descriptive): which founder lines produce
gen-2+, so a second GO can be read for spread vs concentration.

Rationale for replication-before-extension (turn-gate V1c precedent):
building V1d mechanisms on an unreplicated weak signal risks compounding
noise. A second GO promotes the effect to replicated; a NOGO closes the
line as unconfirmed (RSI-SELF V1d precedent for clean kills). Either
outcome is decisive for the program — that is what makes this line worth
12 mains.

## Design

Identical to V1b in every arm, option, bar, and cap: 2 arms
(exact null-copy vs mutant N(0,0.05) + per-newborn seeded RNG + billed
ops) × 6 histories = **12 mains**, BT_TICKS=1792, both arms enriched
(nutrientOverride 5, forced constant), bar50, decoupled gate, maternal
transmission. The ONLY differences from V1b: fresh bank + added
lineage-founder reporting (descriptive, zero behavioral change).

- **Lineage resolution (new, descriptive):** per row, for each gen-2+
  birth, its maternal-line founder (follow parents[0] chains to
  generation 0; defensive against cycles/missing entries). Stored as
  compact founder-id lists per generation
  (`lineageFounders:{gen2:[...], gen3:[...]}`). Answers "who descends
  from whom" without new worlds. Fixture-tested on synthetic lineages
  incl. orphans/cycles.
- **Gates (FROZEN-identical to V1b — moving them would be tuning):**
  G1 integrity (12/12, ledger exact); G2 config/birth/generation audit
  (same checks incl. null-vs-0.05 transmissionNoise); GO iff mutant
  gen-2 ≥ 2 AND mutant > exact (MATE-INHERIT-GO-V1C);
  INCOMPLETE-NOMUTANTS iff mutant gen-1 == 0; else NOGO
  (MATE-INHERIT-NOGO-V1C); INVALID fail-closed (incl. totals-uncomputable).
- **Pre-registered reading (descriptive, separate from the verdict):**
  compare concentration: V1b mutant gen-2 were 2/3 on one seed. If V1c
  GO replicates WITH spread (≥2 seeds contributing), the effect
  graduates from suggestive to robust → V1d investigates mechanism/
  selection differentials. If GO replicates concentrated again (one
  seed dominates), the effect is real but lineage-luck is not ruled
  out → V1d must use within-run competition (mixed transmission) to
  break the seed-confound. If NOGO → line CLOSED as unconfirmed (no
  V1d without a new rationale; the stop rule from V1b carries over).

## Bank (fresh, build AFTER fixtures pass)

`evidence/mate-inherit-dev/fresh-03/`: 6 histories × 9 = 54 seeds
417001–417054 (verified clean 2026-10-26 by guard-equivalent scan: 0 hits
in prior evidence; re-verify at build against the grown exclusion set
incl. 416001–416054 + all fixture seeds). Caps: ≤300 exec (12 used),
≤20e9 ops, ≤3600s wall, ≤100MB (V1b ledgered 2.36e9 for the same shape).
Single authorized attempt; crash-resume with dual provenance only.
Fixtures: mirror V1b (bank-after-fixtures; generation summarizer +
censored lifespan + lineage-founder unit tests incl. orphans/cycles;
scorer branches incl. V1c verdict strings; options-contrast (single
knob, HELD values); null-default + determinism + billing tests).
No RSI claim (replication line; GO confirms V1b, it is not itself an
advance beyond it).
