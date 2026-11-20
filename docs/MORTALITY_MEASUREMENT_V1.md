# Mortality + demography measurement (analytic-only, zero worlds)

Date: 2026-11-02. Sources: frozen rows from all 7 mating banks
(encounter 01–03, attract 04–05, leave 01–02; 126 mains) + read-only
engine audit (`engine.mjs`, no executions).

## 1. Death is 100% energetic, everywhere (126 mains)

`deathCauses` summed over all 21 arms: energy deaths in the dozens-to-
hundreds per arm; AGE DEATHS ZERO in every arm, every bank (A:0 × 21).
The lifespan trait never binds — nobody reaches it; all mortality is
starvation. The program's death knob is decorative; the ecology kills
only by energy. Any future lifespan/demography claim must first explain
why age deaths are zero (bar too high? ticks too few? trait inert?).

## 2. Hubs starve; spreads survive (despotic mechanism at the mortality level)

Energy deaths hub vs spread, same bank: 64v21, 42v36, 52v25, 58v28,
48v28, 51v26 (+hubLeave 62), 47v19. Hub kills 2–3× by starvation in 6/7
banks (attempt-02 closest at 42v36). Survivors: spread > hub every bank.
This is the despotic deficit (`docs/CROWDING_INTERFERENCE_MEASUREMENT_V1.md`)
measured at the endpoint that matters — not just poorer, deader.

## 3. Infant mortality is flat; the block is adult

gen-1 mean lifespan shows NO topology pattern (1089–1320 mixed across
arms/banks). The crowding tax does not kill babies differentially — it
kills (and sterilizes) adults. Two arms show the extreme form:
attempt-04 hubAttract (gen1life 1274, gen-2 0) and ML2 spread (1320,
gen-2 1) — live longest, compound least. Reproduction blocked while
survival holds: the constraint is conversion (mating→birth→survival),
never longevity.

## 4. Sex: 1:1 by construction (read-only engine audit)

Founders: `sex = i%2` (alternating, exactly 1:1 by construction).
Newborns: 50/50 RNG. Fisher's principle holds trivially for founders;
newborn ratios are binomial noise. No sex-ratio dynamics possible in one
generation — the R99 Fisher question is answered (closed for founders;
needs multi-generation logging for newborns, see §6).

## 5. No recombination, no inbreeding depression (read-only engine audit)

`grep` over `engine.mjs` + `learning/taste-experiment.mjs` for
recombination/crossover/meiosis/inbreeding/diploid: zero hits. Newborn
genome = single-parent copy + noise (maternal/copybest); mating performs
no recombination and imposes no kin penalty. The R99 sl-CSD hypothesis
(inbreeding → sterility as gen-2 mechanism) is answered NEGATIVELY at the
code level: kin mating cannot fail genetically here — gen-2 deficits are
necessarily ecological (energy), consistent with §§1–2. R86's
recombination-less critique is confirmed in code: mating lacks both
canonical benefits (no purging without recombination, no penalty without
inbreeding depression) — it is a neutral label on energy-gated proximity.

## 6. Logging gap: demography specified, not measurable (the spec)

`World.lineage` logs per individual live: id/sex/born/died/parents/
mutations/nodes/edges/traits. But attempt rows persist only summaries
(counts, means, founder IDs, firstMatingTick). Consequently UNTESTABLE on
frozen rows: per-sex gen-2 variance (Bateman), age-at-first-mating
distribution (terminal investment), RRV-form bar fits, newborn sex ratios,
per-founder lifespan. The R99 battery is specified but blocked on logging.
Spec for future instruments (no new worlds until built): persist a compact
lineage table per row (id, sex, born, died, parents, offspring count).
Cost: small storage bytes (billed); schema-frozen per line (V1 lesson).

## Licensed / not licensed

- LICENSED: nothing new (measurement + logging spec). The mortality facts
  strengthen the despotic program without opening arms.
- NOT LICENSED: any lifespan/demography intervention (age deaths are zero
  — no phenomenon to intervene on); per-sex analysis (blocked on §6).
- Zero worlds spent. Cumulative unchanged (7941).
