# MATE-LEAVE Plan V2 — magnitude ladder + replication (FROZEN, design only)

Date frozen: 2026-11-02. Status: FROZEN — no code, no bank, no worlds
under this plan. Implementation is a separate turn under this plan;
the single authorized attempt runs only on the implemented instrument.

## Rationale (new — licenses ML2; replication + scaling, not retest)

ML1 scored GO-V1 (hubLeave 7 vs hub 4) with a disclosed weakness: 4/7 gen-2
on seed 439001 — V1b-class one-seed concentration, no replication claim
licensed. Two questions remain, both unanswerable on ML1's single-magnitude
data: (1) does k_L=2 replicate on a fresh bank (luck vs mechanism)?
(2) does compounding scale with cancellation (dose-response)? A magnitude
ladder answers both at once: k_L ∈ {1,2,4} spans weaken (tanh(1)≈0.76) →
cancel (0) → reverse (tanh(−2)≈−0.96) — the full sign ladder, pre-registered
and fixture-provable before any bank is spent. If gen-2 rises monotonically
with k_L AND k_L=2 replicates ≥2, spacing is a graded mechanism (V1c-dose
precedent: shape-stable dose-response as mechanism evidence). If flat,
non-monotone, or k_L=4 reverses into harm, the ML1 GO was luck/concentration
and the magnitude thesis is dead. This is new rationale per the line-closure
rule: ML1 tested existence at parity; ML2 tests replication + scaling.
No new engine work (k_L values are parameters of the frozen ML1 knob;
verbatim reuse, V3 precedent).

## Arms, bank, caps

- Arms (5): hubLeave1 (hub + k_L=1) vs hubLeave2 (hub + k_L=2, exact ML1
  replication) vs hubLeave4 (hub + k_L=4) vs hub control (hub + k_L=0) +
  spread anchor (spread + k_L=0, descriptive V1-direction + dead-bank check).
  ALL ELSE HELD identical to ML1: nutrientOverride 5.0 + bar 50 +
  matingActionRequired false (decoupled) + verticalTransmission 'maternal' +
  transmissionNoise null + mateSense 1× + matingRange 1× + mateAttractBias 0
  + mateAttractEnergyGate null + BT_TICKS=1792, ZERO probes.
  5 arms × 6 histories = 30 mains.
- Bank `evidence/mate-leave-dev/fresh-02/`: 6 histories **440001–440054**
  (mating 9-seed structure; drawn .seed {001,010,019,028,037,046}).
  440xxx verified pristine 2026-11-02 (zero exact-seed/registry/test hits
  across docs/scripts/tests/learning/engine; own-bank range owned by this
  plan). Builder re-verifies; post-bank refusal; union-excluded from all
  future qual banks via evidence-protocol scan. Spent = ML1's list (priors
  through 439xxx) + own 440001–440054 appended (self-inclusive precedent).
- Caps (dose scale): 30 mains / 0 probes / 53760 worldTicks / 1290240
  founderSlots / 30e9 aggregate ops (ML1 used 3.48e9 for 18; ~5.8e9
  expected — headroom ample).

## Gates (conjunctive, fail-closed) and verdicts

- G1 integrity (30/30 complete, exact ledger, `redone: []`).
- G2 config audit: mode/topology per-arm ({hub*,hub,spread}), sense/range
  1× all arms, leaveBias per-arm {hubLeave1:1, hubLeave2:2, hubLeave4:4,
  hub:0, spread:0}, leaveGate per-arm {50 for hubLeave*, null else},
  leaveRule frozen literal {lastFoodThr:0, energyRef:'bar'}, mateBias 0 all
  arms, geography 1/3 from live worlds, bar 50, nutrient 5.0, noise null,
  decoupled. Else INVALID.
- NO births gate (precedent, pre-registered). Gate engagement at fixture
  level (scripted sign ladder 0.76/0/−0.96 + AND-gate proof + k_L=0
  null-default bit-identity) + absolute billing (12/15, unchanged from ML1);
  NO per-tick gate telemetry (emit schema frozen). Live-bank gate behavior
  read descriptively from endpoint energies + curves.
- G-dose (rescue verdict): **MATE-LEAVE-GO-V2** iff (a) hubLeave2 gen-2 ≥ 2
  (k_L=2 replicates — answers the concentration disclosure) AND (b)
  weak-monotone non-decreasing gen-2 across hub(0) ≤ L1 ≤ L2 ≤ L4 with L4 >
  hub (spacing scales with cancellation — answers mechanism-vs-luck).
  Else **MATE-LEAVE-NOGO-V2** (luck, saturation, or reversal — magnitude
  thesis dead; deficit is not gradedly addressable by cancellation).
- Spread anchor DESCRIPTIVE. firstMatingTick + energies + curves DESCRIPTIVE.
- INCOMPLETE-NOBIRTHS if hubLeave2 gen-1 == 0 (void; replication arm is the
  reference). INVALID on any gate failure. Weight logging: still conditional
  on coupled designs (unchanged standing rule).

The line closes with its verdict either way. No ML3 without new rationale
(named candidates, not licensed: sex-conditioned leaving; detection-sharing
channel; differentiation-first/mating-second, R94). Single authorized
attempt, cumulative +30. No RSI claim.
