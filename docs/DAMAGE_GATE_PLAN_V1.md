# DAMAGE-GATE Plan V1 — gate consolidation on damage, not novelty (DESIGN ONLY)

Status: FROZEN 2026-11-02. No code, no worlds, no bank build under this doc.
Next: implement under this plan, then single attempt. Closes either way.

## Question

V1f–V1i: surprise-gating works (+0.066 to +0.260; V1i deployed gain
1.0/3.0). Danger theory (R125) prescribes gating on DAMAGE, not novelty;
threat-simulation (R128) prescribes replaying damage, not surprise. Does
damage-gated consolidation beat surprise-gated consolidation (and uniform)
in the harm→ben extinction window — the hard direction? Single knob,
binary-matched to tournament-1 so the ONLY difference is the trigger.

## Instrument (single knob: `replayDamageGain`)

- Per replay batch: gain 3.0× when the sampled batch contains damage
  (toxinDamage receipt > 0), else 1.0×. HELD values (mirror V1g/V1h
  1.0/3.0 — not tuned).
- Prerequisite (schema, null-default): persist per-transition damage into
  replay-buffer entries. Knob off → entries unchanged + gate never
  evaluated → V1i-bit-identical (fixture-guarded). Billed: +1 memory
  field per entry (via encodedStateBytes) + symmetric gate-comparison
  ops per replay step (mirror surprise-path billing; fixture-guarded
  delta, no asymmetric free compute).

## Design (seg1 only — seg2 compounding closed in V1h/V1i)

Per pair (3 pairs, positional train+9=trans convention on the fresh bank),
5 arms × 1792 ticks:

- **train** (base `BT_LEARNER_OPTIONS`) — transplant source.
- **uniform-seg1** (base) — plain-extinction reference.
- **gain-seg1** (base + `surpriseGain:1.0` + `replaySurpriseGain:3.0`,
  tournament 1 — V1g/V1h/V1i-IDENTICAL, HELD) — surprise comparator.
- **damage-seg1** (base + `replayDamageGain:3.0/1.0` binary-matched) —
  the claimant. No other knob differs.
- **unlearned** (base, frozen) — flat control.

15 mains, 0 probes. Train + uniform-seg1 + gain-seg1 + damage-seg1 rows
persist weights (chain sources for any future line — terminal here);
unlearned terminal.

## Gates (all seg1-gated; descriptive with the fixed ±0.1 yardstick, 5th use)

G1 integrity on ALL 15 rows (join ≥ 0.99; all triples REQUIRED present
fail-closed, never gating) + G0 train ≥ 0.5 all 3 else
INCOMPLETE-UNTRAINED + G2a uniform-seg1 mean ≥ 0.3 + G2b unlearned flat
≤ 0.1 all 3. Null-hygiene carried over AND extended: train/uniform/
unlearned surprise AND damage counters == 0 else INVALID.

Manipulation (fail-informative VOID, V1h precedent segregated per arm):
gain-seg1 needs Σ `replaySurpriseBoosts` > 0; damage-seg1 needs Σ
`replayDamageBoosts` > 0; PLUS damage-presence: seg1 mean damage > 0 per
pair (a damage gate untestable without damage — pre-registered VOID,
not NOGO).

- **D1 (GO gate):** HB(damage-seg1) − HB(uniform-seg1) > +0.1 with fired
  manipulation → PHASE-D1-GO, else NOGO.
- **D2 (descriptive, recommendation-shaping):** HB(damage-seg1) −
  HB(gain-seg1): >+0.1 damage beats surprise (deploy damage-gating);
  ±0.1 parity (alternative trigger, billing compared descriptively);
  <−0.1 underperforms (caution — surprise stays deployed).
- Same-val diffs ≈ 0 (guardrail); BH ceiling no-claim (unchanged).

## Bank (fresh, build AFTER fixtures pass)

`evidence/turn-gated-dev/fresh-11/`: 6 histories × 9 = 54 seeds
444001–444054 (verified clean 2026-11-02: 0 seed-key hits in
444000–444100 across all evidence JSON; 0 mentions in
docs/scripts/learning/tests — the 41 substring matches are non-seed
numerics in old anchors, guard-irrelevant; build-time guard re-verifies
against the grown exclusion set incl. 443001–443054 + fixture seeds).
Caps: ≤300 exec (15 used), ≤20e9 ops, ≤3600s wall, ≤100MB. Single
authorized attempt; crash-resume with dual provenance only. Fixtures must
guard the HELD surprise values, the damage trigger + billing + null
bit-identity, the damage-presence VOID rule, the 5-arm scorer with all
required triples, BH/HB splits, subsetGap, agentWork/sumManipulation,
and the extended null-hygiene INVALID override. No RSI claim.
