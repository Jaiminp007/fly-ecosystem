# MATE-RECOMBINE Plan V1 — biparental crossover (FROZEN, design only)

Date frozen: 2026-11-02. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (new — licenses MLR1; the missing canonical benefit)

R86 + the read-only engine audit closed the loop: mating in this codebase
performs NO recombination (newborn = single-parent copy + noise) and imposes
NO inbreeding penalty. All four canonical benefits of mating are absent by
construction — the entire mating null arc (sensing through leaving) is the
predicted outcome of sex without recombination. MLR1 gives mating its first
canonical job: uniform-crossover offspring (per-element pick from two
parents). If recombinants compound where exact copies do not, transmission
— not encounters, energy, or spacing — was the missing piece, and the
ratchet-halt reading is licensed. If recombinants do worse (crossover
disruption of co-adapted weight sets), the failure is informative both ways:
mating without linkage structure cannot pay, and the named V-next is
block-preserving single-point crossover (NOT licensed here). Either outcome
retires the "why mate at all" question empirically. This is new rationale
per the line-closure rules: no prior arm recombined (maternal exact-copy and
mutant-jitter only).

## Knob (single, null-default, billed; TasteExperiment-only engine change)

`verticalTransmission='biparental'` (new enum value alongside
none/maternal/copybest): newborn weights = per-element uniform crossover of
parents[0] × parents[1] (taste+actor+critic arrays, same three as maternal),
p=0.5 per element, drawn from the per-newborn RNG under the existing seeding
scheme `(hseed ^ Math.imul(f.id,2654435761))` (deterministic, resume-safe).
Fallback chain (frozen): parents[1] learner absent → maternal (parents[0]);
neither present → as-created (current behavior, unchanged).
Billing: +1 op/element (draw+assign counted as 1, noise-loop precedent —
same class, explicitly NOT a billing-site change: no 12/15 touch).
Null-default: maternal/copybest paths bit-identical (untouched code);
'biparental' engages only when explicitly set. Validation extends the enum
(TasteExperiment only — World ignores the mode; verified read-only).
Checkpoint-safe: mode is a JSON-safe string; recomputed nothing (no derived
−Infinity fields; V4 lesson N/A by construction).
Uniform (not single-point) is the frozen choice: strongest mixing test,
simplest fixture (per-element independence). If disruption dominates,
single-point is the named — unlicensed — V-next.
transmissionNoise stays null in this line (variation comes from
recombination, not jitter — the confound ML... avoided by construction;
noise×recombination factorial is NOT licensed here).

## Arms, bank, caps

- Arms (3): hubRecombine (hub + biparental) vs hub control (hub + maternal)
  + spread anchor (spread + maternal, descriptive V1-direction + dead-bank
  check). ALL ELSE HELD: nutrientOverride 5.0 + bar 50 +
  matingActionRequired false (decoupled) + transmissionNoise null +
  mateSense 1× + matingRange 1× + mateAttractBias 0 + mateAttractEnergyGate
  null + mateLeaveBias 0 + mateLeaveGate null (all prior steering knobs
  present-but-off — transmission isolated) + BT_TICKS=1792, ZERO probes.
  6 histories × 3 arms = 18 mains.
- Bank `evidence/mate-recombine-dev/fresh-01/`: 6 histories **441001–441054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}).
  441xxx verified pristine 2026-11-02 (zero exact-seed/registry/test hits
  across docs/scripts/tests/learning/engine; own-bank range owned by this
  plan). Builder re-verifies; post-bank refusal; union-excluded from all
  future qual banks via evidence-protocol scan. Spent = ML2's list (priors
  through 440xxx) + own 441001–441054 appended (self-inclusive precedent).
- Caps (ML1 scale): 18 mains / 0 probes / 32256 worldTicks / 774144
  founderSlots / 30e9 aggregate ops.

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity (18/18 complete, exact ledger, `redone: []`).
- G2 config audit: mode/topology per-arm ({hubRecombine:hub, hub:hub,
  spread:spread}), sense/range 1× all arms, transmission per-arm
  {hubRecombine:'biparental', hub:'maternal', spread:'maternal'} (per-row
  'transmission' field — NEW vs V4/ML1 hardcode, because the knob varies;
  leave/lgate precedent), all steering knobs 0/null all arms, geography
  1/3 from live worlds, bar 50, nutrient 5.0, noise null, decoupled. Else
  INVALID.
- NO births gate (precedent, pre-registered). Engagement at fixture level
  (scripted: disjoint-marker parents → exact per-element mix; determinism;
  fallback ≡ maternal; billing n ops) + absolute billing (12/15 unchanged);
  NO per-tick telemetry (nothing tick-varying to emit). Live-bank behavior
  read descriptively from endpoint energies + curves.
- G-lift: **MATE-RECOMBINE-GO-V1** iff hubRecombine gen-2 ≥ 2 AND
  hubRecombine gen-2 > hub (recombinants compound where exact copies do
  not — transmission was the missing piece). Else
  **MATE-RECOMBINE-NOGO-V1** (disruption or indifference — mating without
  linkage structure cannot pay).
- Spread anchor DESCRIPTIVE. firstMatingTick + energies + curves DESCRIPTIVE.
- INCOMPLETE-NOBIRTHS if hubRecombine gen-1 == 0 (void). INVALID on any
  gate failure. Weight logging: STILL conditional — EXCEPT the row schema
  gains the 'transmission' field (frozen literal per arm, V1 lesson).

The line closes with its verdict either way. No MLR2 without new rationale
(named candidates, not licensed: single-point crossover (block-preserving);
noise×recombination factorial; parental-divergence gating — recombine only
dissimilar parents). Single authorized attempt, cumulative +18. No RSI claim.
