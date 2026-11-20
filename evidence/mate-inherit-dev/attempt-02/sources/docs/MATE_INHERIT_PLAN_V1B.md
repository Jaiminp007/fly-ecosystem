# MATE-INHERIT Plan V1b — mutated maternal transmission + lineage compounding (DESIGN ONLY)

Status: FROZEN 2026-10-26. No code, no worlds, no bank build under this doc.
Next: implement under this plan, then single attempt.

## Rationale (the new license V1 demanded)

V1 closed exact-copy transmission (gap 0, 16/16 identical) with ZERO gen-2
births — nothing for heritability to compound. MATE-FOOD V1 then
demonstrated gen-2 births exist under enrichment (1 gen-2, lineage-
verified; enriched 27 births vs control 12). The blocker was ecological,
not transmissional. What remains untested — now testable — is whether
HERITABLE VARIATION compounds across the generations that now demonstrably
exist. Standing theory demands it: MLS requires variation selection can
act on (Round 15: assortment/punishment formalisms); small asexual
populations accumulate load without it (Round 18: Muller's ratchet rate +
small-noise regime — our N=24 founders with maternal exact-copy are the
ratchet's initial condition).

## Question

Does mutating the maternally transmitted weights change lineage
productivity (gen-2+ compounding) relative to exact-copy transmission?

## Design

2 arms × 6 histories = **12 mains**, BT_TICKS=1792 (V1 shape).
ENRICHED both arms (nutrientOverride 5, forced constant — V1f's proven
unlock; without it gen-2 is unmeasurable, as V1 showed). Bar50,
decoupled gate, maternal transmission both arms (V1-identical plumbing):

- **exact** (transmissionNoise null): V1's maternal arm transplanted into
  the enriched ecology. Null control: any gen-2 here is ecology alone.
- **mutant** (transmissionNoise σ=0.05): each maternally copied weight
  (taste/actor/critic arrays present) gets additive N(0, 0.05) noise at
  copy time, then the row persists as usual.

Why σ=0.05 additive: the engine's own validated weight-mutation operator
uses additive `rng.normal()*0.18` (engine.mjs); 0.05 is the same family
one rung down — minimal-nonzero ladder, NOT tuned (no data to tune on).
Additive (not multiplicative like the engine's trait operator) because
learner weights span zero and sign. Dedicated RNG stream per newborn
seeded from (history.seed, newbornId) — isolated from all other streams;
deterministic per row (crash-resume safe).

Billing: 1 op billed per mutated element via the newborn's work counters
(flows into endpoint totals automatically). Copies remain unbilled (V1-
identical); the mutant arm's extra is dust (<0.001% of ledgers) and
pre-disclosed — no compute confound either way.

## Gates

Identical G1/G2 shape to V1 (12 mains = 6/arm; per-row arm/mode/nutrient/
births/generations audit; lineage-verified gen-2 counts: integer
generation ≥2 AND non-empty parents): 

- **G1 integrity** + **G2 config/birth/generation audit** (both arms
  carry nutrientOverride 5.0 — enrichment is constant, NOT the arm
  difference; the arm difference is transmissionNoise ONLY (null vs
  0.05), fixture-guarded as the single differing knob).
- **G3 outcome**: GO iff mutant gen-2 ≥ 2 AND mutant gen-2 > exact gen-2
  (replication-within-line + direction; feasibility-grade bar, stated
  as such — see power note below). INCOMPLETE-NOMUTANTS iff mutant
  gen-1 == 0 (nothing to compound — void, not NOGO — even if control
  has gen-1, since transmission happens AT birth and cannot affect
  founder-produced gen-1 counts... correction: gen-1 counts measure
  ecology, identical across arms by construction; a mutant-zero with
  control-positive is stochastic miss, hence void).
  Else NOGO.
- Verdict strings: MATE-INHERIT-GO-V1B / MATE-INHERIT-NOGO-V1B (+
  INCOMPLETE-NOMUTANTS / INVALID fail-closed). Distinct strings from V1
  (different bar, different question).

Power note (pre-registered, honest): at V1f's enriched base rate
(~0.08 gen-2/main), P(GO|true 2× effect, 6 mains/arm) ≈ 1-in-5. This is
a probe, not a trial — the bar requires within-line replication (≥2,
not V1f's singleton) plus direction, which is the most that 12 mains
can honestly claim. A NOGO with mutant==exact==0 gen-2 does NOT close
the line's question (power too low to distinguish "no effect" from
"too small to see"); it sends the line back for a bigger-N or stronger-
dose design with new rationale — no automatic escalation.
NOGO with exact >> mutant documents a deleterious direction (report
the gap; V1c would need a different form/magnitude + rationale).

Descriptive (non-gating, recorded): maxGeneration per arm; gen-3+ counts
(anyone reach gen-3?); mean gen-1 lifespan per arm with censoring note
(died==null → censored at 1792; distinguishes infant-mortality
deleteriousness from failed mating, informs V1c dose/form).

## Bank (fresh, build AFTER fixtures pass)

`evidence/mate-inherit-dev/fresh-02/`: 6 histories × 9 = 54 seeds
416001–416054 (verified clean 2026-10-26 by guard-equivalent scan: 0 hits
in prior evidence; re-verify at build against the grown exclusion set
incl. 415001–415054 + all fixture seeds). Caps: ≤300 exec (12 used),
≤20e9 ops, ≤3600s wall, ≤100MB (V1 ledgered 2.05e9 for the same shape;
mutation adds dust). Single authorized attempt; crash-resume with dual
provenance only. Fixtures: bank-after-fixtures + generation summarizer
(+ lifespan helper) units + scorer branches (GO/NOGO/INCOMPLETE-NOMUTANTS/
INVALID incl. totals-null) + transmissionNoise plumbing (null default =
V1-identical path; 0.05 perturbs deterministically) + options-contrast
(single-knob: exact vs mutant differ ONLY in sigma) + V1-parity (exact
arm config == V1 maternal arm except nutrient, which is the enrichment
both arms share). No RSI claim (feasibility-grade probe; GO licenses
V1c multi-generation selection, it is not itself an advance).
