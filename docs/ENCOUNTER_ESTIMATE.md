# Encounter-rate estimate (read-only; supports MATE-ACT V1 NOGO)

Zero new worlds. Method: kinetic-theory diffusion + frozen-artifact
survivor/energy stats + engine constants. Purpose: quantify whether
"0 births" means "no encounters" (opportunity) vs "broken machinery".
Conclusion first: expected QUALIFIED encounters ≈ 0.05–0.15 per main
(≈ 0.4–1.2 per 8-main line) — observing 0 is unsurprising (P(0) ≈ 60%).
Opportunity lack CONFIRMED as the binding constraint.

## Engine constants (frozen code)

- World 1000×640 (A=640,000); encounter radius 26; DT=0.1s; 1792 ticks.
- Fly speed traits 22–34 u/s; effective foraging speed lower (pausing).
- Founders: 24, alternating sexes, spawn energy EXACTLY 65.0 (= the mating
  bar), age 0, cooldown 0.
- Maturity 18–28 ticks (negligible delay). Lifespan 200–320 ticks.

## The spawn anti-qualification (design finding)

Founders start AT the energy bar (65.0) but age 0 (immature). By maturity
(~25 ticks), metabolism+movement (~0.3–0.5/s × 2.5s) burns ~1–2 energy →
below bar BEFORE becoming eligible. The only guaranteed high-energy moment
coincides exactly with ineligibility. To qualify, a fly must survive,
mature, then EAT back above 65 — a sequential filter, not a single gate.

## Diffusion baseline (uniform mixing, generous parameters)

- Effective speed v ≈ 5–20 u/s (foraging with pauses); v_rel ≈ v√2.
- Pairwise rate λ ≈ 2·26·v_rel/640000 ≈ 0.0006–0.0023/s → 0.1–0.4
  co-locations per pair per run (179 s).
- ~144 mixed-sex pairs → ~15–55 raw co-locations/run (upper bound; ignores
  clustering AND anti-correlation below).
- Energy qualification P(E≥65): founders start AT bar and decline;
  feasibility maxE 71.5 proves exceedances happen but gives no frequency.
  Generous band 5–10% of fly-time (foraging mean far below bar).
- Joint: ~15 × 0.05² … 55 × 0.1² → 0.04–0.55 qualified encounters/run.
- Mature + cooldown≈always-true (no prior matings) + opposite-sex 0.5
  (already in pair count) → ≈ 0.05–0.15/run, ≈ 0.4–1.2 per 8-main line.

## Caveats (both directions, recorded)

- Clustering at 3 food patches RAISES co-location ~8× vs uniform — but
  hungry flies cluster while satiated (≥65) flies wander OFF: joint-energy
  given co-location is likely LOWER than marginal (anti-correlation).
- Net effect: the uniform estimate is probably OPTIMISTIC; true qualified
  rate likely below it. Either way: ≪1 per line ≪ abundant. Robust.
- This is order-of-magnitude, not precise: v and P(E≥65) are bands, not
  measurements (frozen rows lack per-fly trajectories).

## Implication (follows, no new worlds needed)

1. MATE-ACT V1's NOGO = opportunity lack, quantitatively consistent
   (≈60% chance of exactly 0). Actuation exonerated twice over.
2. Courtship (Phase 2) is POINTLESS until encounters exist: no protocol
   fixes zero meetings. The next line must be DENSITY/ECOLOGY first:
   need ~10× encounter rate (more founders? smaller world? longer-lived?
   attractant-mediated co-location?) AND energy overlap (spawn above bar?
   feed pulse? lower bar? — each changes baselines; freeze carefully).
3. Inheritance design (newborn weights) stays queued behind encounter
   feasibility — no lineage without meetings either.
4. Drift-barrier note: even at 5 births/run, N=24 with ±0.07-scale effects
   is drift-dominated; the density line should ALSO raise N (or effects),
   not just enable rare births.
