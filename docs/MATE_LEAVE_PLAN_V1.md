# MATE-LEAVE Plan V1 — intake-gated food-taxis cancellation (FROZEN, design only)

Date frozen: 2026-11-02. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (new — licenses ML1; mechanism fix for the despotic deficit)

Five banks (encounter 01–03, attract 04–05) show the same structure:
hub agents eat 25–35% less and end 12–18 points poorer than spread, with
trajectories diverging by tick 256–512 (`docs/CROWDING_INTERFERENCE_
MEASUREMENT_V1.md`). IFD is rejected; the pattern is despotic overcrowding.
Coarse queuing is exonerated (first-mating timing identical; births far below
caps), monopolization is exonerated (top-founder share 0.12–0.24 diffuse),
synchrony is exonerated (ranges overlap). The licensed rescue is the leaving
rule (MVT/GUD/selfish-herd triple witness, R88): when an agent is losing on
its patch AND poor, it should stop climbing the food gradient that leads it
into the scrum. ML1 tests exactly this: the SAME food-taxis term, cancelled
(not reversed) while the loss+poverty state holds. If hubLeave compounds where
hub control does not, spacing-via-cancellation is the mechanism and the
dispersal/despotic program opens. If it fails, loss-gated cancellation is
insufficient and the deficit is structural (patch geometry, not behavior) —
which reframes all follow-ups toward ecology (patch number/spacing), not
policy. This is new rationale per the arc-closure rule: first test of the
leaving margin, not a retest of any closed knob (sensing, suppression,
steering, interaction, gating all closed).

## Knob (single, null-default, stateless, symmetric billing; engine change required)

`mateLeaveBias` (k_L ≥ 0): cancels the food-gradient turn while the agent is
losing and poor. Rule (frozen literal, no new constants):
leaveGate = (raw[13] < 0 AND raw[4] < leaveThr) ? 1 : 0,
kEff_L = k_L × leaveGate (computed UNCONDITIONALLY every tick — no branches —
identical code path and op counts for all arms, symmetric billing),
leavePull = −kEff_L × (raw[2] − raw[1]),
turn = tanh((action>0 ? attraction+leavePull+matePull
: −(attraction+leavePull+matePull)+.8*raw[0])+wall),
with attraction = 2*(raw[2]−raw[1]) unchanged and matePull = 0 in this line
(mateAttractBias frozen 0 all arms — leave isolated; V4 knob present but zeroed).
Raw-scale mapping (existing dims, no new sensing): raw[13] = lastFood
(cueForaging: clamp(netIntake,−1,1); <0 = net-negative tick); raw[4] =
f.energy/120; leaveThr = matingEnergyBar/120 (bar reuse, same number as V4's
gateThr; ecological meaning "cancel only when too poor to matter").
lastFood threshold frozen at 0 (not a knob; no V-next without rationale).
Null-default: k_L = 0 → kEff_L ≡ ±0 → leavePull ≡ ±0 → tanh argument
bit-identical (same −0 analysis as V2; JSON-normalized fixture). leaveThr
default −Infinity → gate never fires (double null-safety; either default
alone preserves behavior exactly). STATELESS: no EMA, no new checkpoint
fields, no restore path — the V4 −Infinity lesson applied by construction
(nothing to serialize, nothing to recompute).
k_L parity: 2 (same magnitude ladder as V2/V3/V4 k=2). Boundary note
(pre-registered, not a gate): k_L = 2 EXACTLY cancels food taxis while
leaving ((2−2)×diff = 0; agent cruises on wall-avoidance only). If ML1 nulls,
the magnitude ladder (k_L ∈ {1,2,4} with pre-registered monotone selection
rule) is the named V-next candidate — NOT licensed here.
Billing: +2 unconditional muls vs V4 (k_L×gate; ×diff — the diff sub is
shared with attraction; both comparisons unbilled per precedent: branch
conditions unpriced). Approach 10→12, avoidance 13→15, symmetric across arms.
All billing sites from V4's list + 5 Python audit mirrors + absolute-billing
fixtures synced in implementation triage (same billing-sync class, not tuning).

## Arms, bank, caps

- Arms (3): hubLeave (hub + k_L=2, gated) vs hub control (hub + k_L=0) +
  spread anchor (spread + k_L=0, descriptive V1-direction + dead-bank check).
  ALL ELSE HELD: nutrientOverride 5.0 + bar 50 + matingActionRequired false
  (decoupled) + verticalTransmission 'maternal' + transmissionNoise null +
  mateSense 1× + matingRange 1× + mateAttractBias 0 + mateAttractEnergyGate
  null (V4 knob present-but-off) + BT_TICKS=1792, ZERO probes.
  6 histories × 3 arms = 18 mains.
- Bank `evidence/mate-leave-dev/fresh-01/`: 6 histories **439001–439054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}).
  439xxx verified pristine 2026-11-02 (zero exact-seed/registry/test hits
  across docs/scripts/tests/learning/engine; own-bank range owned by this
  plan). Builder re-verifies; post-bank refusal; union-excluded from all
  future qual banks via evidence-protocol scan. Spent = V4's list verbatim
  (priors through 438xxx) + own 439001–439054 appended (V3/V4 self-inclusive
  precedent).
- Caps (V4 scale): 18 mains / 0 probes / 32256 worldTicks / 774144
  founderSlots / 30e9 aggregate ops (billing +2/tick negligible vs cap).

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity (18/18 complete, exact ledger, `redone: []`).
- G2 config audit: mode/topology per-arm ({hubLeave:hub, hub:hub,
  spread:spread}), sense/range 1× all arms, leaveBias per-arm {leave:2,
  hub:0, spread:0}, leaveRule frozen literal {lastFoodThr:0,
  energyRef:'bar'} (attempt record, V1 precedent), mateBias 0 all arms,
  geography 1/3 from live worlds, bar 50, nutrient 5.0, noise null,
  decoupled. Else INVALID.
- NO births gate (precedent, pre-registered). Gate engagement established
  at fixture level (scripted: fed agent follows food; losing+poor agent
  cancels to wall-cruise; losing-but-rich follows food; k_L=0 null-default
  bit-identical) + absolute billing (12/15); NO per-tick gate telemetry
  (emit schema frozen, same constraint as V1b/V2/V3/V4). Live-bank gate
  behavior read descriptively from endpoint energies + curves.
- G-lift (rescue verdict): **MATE-LEAVE-GO-V1** iff hubLeave gen-2 ≥ 2 AND
  hubLeave gen-2 > hub (loss-gated cancellation lifts compounding where
  all prior knobs failed — spacing is the mechanism, despotic program
  opens). Else **MATE-LEAVE-NOGO-V1** (cancellation insufficient —
  deficit is structural/patch-geometric; policy leaves the table, ecology
  becomes the program).
- Spread anchor DESCRIPTIVE. firstMatingTick + energies + curves DESCRIPTIVE.
- INCOMPLETE-NOBIRTHS if hubLeave gen-1 == 0 (void). INVALID on any gate
  failure. Weight logging: still conditional on coupled designs (unchanged
  standing rule — this line is decoupled).

The line closes with its verdict either way. No ML2 without new rationale
(named candidates, not licensed: magnitude ladder with pre-registered
monotone rule; sex-conditioned leaving; detection-sharing channel).
Single authorized attempt, cumulative +18. No RSI claim.
