# MATE-DISPERSE Plan V1 — natal dispersal rescues sinks (FROZEN, design only)

Date frozen: 2026-11-02. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (new — licenses MD1; geometry, not choice)

The source-sink measurement (`docs/SOURCE_SINK_REACTION_NORM_V1.md`)
found every hub arm a sink (B−D < 0, 8/8) and spread neutral/source —
with mating choice INERT throughout (all knobs act post-encounter or not
at all). Hamilton & May 1977 say the response to kin-crowded patches is
DISPERSAL DESPITE COST; rescue-effect theory (Brown & Kodric-Brown) says
declining patches are recolonized from outside. Both point the same way:
move newborns, not choosers. MD1 tests whether geometry alone rescues —
newborns scattered (d=0.5 coin flip to uniform-random placement in the
founder box) vs natal-philopatric controls (parents' midpoint). If
dispersed hubs compound where philopatric hubs do not, the sink is a
placement problem (fixable by movement) and the dispersal program opens
(cost-bearing, sex-biased, duo-topology variants). If dispersal changes
nothing (or harms: scattered newborns starve alone instead of together),
placement is not the lever and the deficit is patch-intrinsic (food
geography, not crowding) — which reframes all follow-ups toward ecology
(patch number/spacing), consistent with ML2's structural reading. This is
new rationale per the line-closure rules: no prior arm moved newborns
(topology moved centers; taxis moved adults; nothing moved births).

## Knob (single, null-default, unbilled-by-precedent; small engine change)

`natalDispersal` d ∈ [0,1]: per-birth probability the newborn is placed
uniform-random in the founder spawn box (50–950 × 50–590, founder-spawn
code reused verbatim — no new constants) instead of at the parents'
midpoint. Frozen d=0.5 (coin flip — maximal test, no tuning).
Null-default: config absent → 0 → placement identical, main RNG stream
untouched. Isolation precaution (learned from V4 billing-sync discipline):
dispersal draws come from a DEDICATED per-mating seeded RNG
`(historySeed ^ Math.imul(f.id,2654435761) ^ mate.id)` — never the world
stream — so d>0 cannot shift downstream randomness except through
positions. Billing: NONE new (mating-block precedent: mate search, sex
draw, cooldown, and the 24-energy mating price structure are engine-side
and unbilled; dispersal draws are the same class). Stated plainly: this
tests GEOMETRY alone — teleport placement, no movement cost. Hamilton & May
price dispersal explicitly (mortality), so a cost-bearing variant is the
named — unlicensed — V-next if GO (energy tax per dispersed newborn).
Validation mirrors mateAttractBias (engine `validateConfig`).

## Arms, bank, caps

- Arms (3): hubDisperse (hub + d=0.5) vs hub control (hub + d=0) +
  spread anchor (spread + d=0, descriptive V1-direction + dead-bank check).
  ALL ELSE HELD: nutrientOverride 5.0 + bar 50 + matingActionRequired false
  (decoupled) + verticalTransmission 'maternal' + transmissionNoise null +
  mateSense 1× + matingRange 1× + ALL steering knobs off (mateAttractBias 0,
  attractGate null, leaveBias 0, leaveGate null) + BT_TICKS=1792, ZERO probes.
  6 histories × 3 arms = 18 mains.
- Bank `evidence/mate-disperse-dev/fresh-01/`: 6 histories **442001–442054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}).
  442xxx verified pristine 2026-11-02 (zero exact-seed/registry/test hits
  across docs/scripts/tests/learning/engine; own-bank range owned by this
  plan). Builder re-verifies; post-bank refusal; union-excluded from all
  future qual banks via evidence-protocol scan. Spent = MLR1's list (priors
  through 441xxx) + own 442001–442054 appended (self-inclusive precedent).
- Caps (ML1/MLR1 scale): 18 mains / 0 probes / 32256 worldTicks /
  774144 founderSlots / 30e9 aggregate ops (no new billing; headroom intact).

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity (18/18 complete, exact ledger, `redone: []`).
- G2 config audit: mode/topology per-arm ({hubDisperse:hub, hub:hub,
  spread:spread}), sense/range 1× all arms, dispersal per-arm
  {hubDisperse:0.5, hub:0, spread:0} (per-row 'dispersal' field, MLR
  precedent — knob varies), steering knobs 0/null all arms, geography
  1/3 from live worlds, bar 50, nutrient 5.0, noise null, decoupled.
  Else INVALID. Engagement = fixture-level placement proof (d=0 always
  midpoint; d=1 always in-box uniform; d=0.5 mixed on frozen seeds) +
  dedicated-RNG isolation proof (main-stream untouched); NO per-tick
  telemetry (birth events logged in world history as usual).
- NO births gate (precedent, pre-registered).
- G-lift: **MATE-DISPERSE-GO-V1** iff hubDisperse gen-2 ≥ 2 AND hubDisperse
  gen-2 > hub (scattered newborns compound where philopatric ones do not —
  placement rescues the sink). Else **MATE-DISPERSE-NOGO-V1** (geometry
  insufficient — deficit is patch-intrinsic; dispersal scatters to starve).
- Spread anchor DESCRIPTIVE. firstMatingTick + energies + curves +
  B−D per-capita DESCRIPTIVE (source-sink re-measured on the new bank).
- INCOMPLETE-NOBIRTHS if hubDisperse gen-1 == 0 (void). INVALID on any
  gate failure. Weight logging: conditional on coupled designs (unchanged).

The line closes with its verdict either way. No MD2 without new rationale
(named candidates, not licensed: cost-bearing dispersal (energy tax);
sex-biased dispersal (Greenwood); duo-topology dispersal; d-ladder with
pre-registered monotone rule). Single authorized attempt, cumulative +18.
No RSI claim.
