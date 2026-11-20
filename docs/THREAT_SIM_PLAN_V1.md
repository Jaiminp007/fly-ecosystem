# THREAT-SIM PLAN V1 — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code (freeze-before-code rule).
License: "threat-simulation replay" (licensed frontier) + BH headroom
(0.82–0.86, miss rate 14–18%) + V1h precedent (surprise-general replay
works: +0.134 HB). New rationale: VALENCE-specific prioritization
(harmful records) for ACQUISITION (BH), vs V1f–V1i's surprise-general
gating for extinction (HB).

## Question

Does valence-prioritized replay (boosting harmful-intake records) lift BH
acquisition ≥+0.1 without impairing HB extinction?

## Direction analysis (pre-registered)

- BH (ben→harm, ACQUIRE avoidance): replaying harmful records reinforces
  the to-be-acquired avoidance → should HELP.
- HB (harm→ben, EXTINGUISH avoidance): replaying train-harmful records
  reinforces the to-be-extinguished avoidance → may HURT.
- The line measures the tradeoff explicitly: GO needs BH lift AND HB
  no-impairment. A BH-lift/HB-cost split is INTERMEDIATE-by-design
  (reported as NOGO with tradeoff quantified — informative, not void).

## Design (null-default gate, DAMAGE-GATE precedent)

- New `replayThreatGain` (default 0 = current path exactly, bit-identical,
  triage-verified) + gate in `replayGated`: when gain>0 and
  `record.outcomeSign===-1` (harmful intake, existing field), boost
  `1+threatGain`. Single-knob discipline (no arm sets surprise+dame+
  threat together). Billed like other boosts (+1 op, symmetric).
- Arms (matched histories, standard pairs): baseline-train (gain 0) + threat-train
  (gain 1.0, pre-registered, surprise-gain scale) + baseline-transferred (gain 0) +
  threat-transferred (gain 0, threat-trained weights) + unlearned.
  3 pairs × 5 runs = 15 mains, 0 probes. 1792-tick segs.
- CORRECTION (pre-code, 2026-11-02): the frozen 3-tag/9-main count cannot isolate
  the acquisition effect (a single 'threat' tag would carry gain 1.0 into transfer
  replay, violating the gating scope). Threat gain 1.0 ONLY in threat-train runs;
  threat-transferred runs gain 0 (difference from baseline-transferred is the
  transplanted weights alone). Caps/fixtures updated accordingly. No gate change.
- Gating scope: threat boost applies in TRAIN replay (acquisition);
  transfer replay runs the baseline rule on both arms (isolates the
  acquisition effect; transfer measures the consequence).

## Gates (conjunctive, fail-closed)

- G1 join ≥0.99 + integrity. G0 train BH ≥0.5 (expected pass).
- **G2a-PRIMARY**: threat BH − baseline BH ≥ +0.1 (pooled, contact-weighted).
- **G2b-NO-IMPAIRMENT**: threat HB ≥ baseline HB − 0.1 (tradeoff guardrail).
- G2c unlearned flat. G2d same-val floor ≥0.5.
- GO-V1 ⟺ G1 ∧ G0 ∧ G2a ∧ G2b ∧ G2c ∧ G2d. Else NOGO (with BH/HB split
  reported). INVALID/INCOMPLETE per G1/G0.

## Fixtures (12, gate before bank)

Module (5): gate validation; null-identity (gain 0 ≡ current path,
fixture-level); threat boost math (outcomeSign −1 only; +1/0/−1 and
missing-field cases); billing (+1 op); sources-closure guard.
Instrument (7): collector valence; scorer GO/NOGO(tradeoff)/INVALID/
INCOMPLETE branches; bank-build tmpdir; mains-caps check (3×5=15).

## Bank, caps, attempt discipline

- Fresh-16 bank `evidence/threat-sim-dev/fresh-16/`, V1k-family 9-schema
  histories, 6 histories (3 pairs [[0,1],[2,3],[4,5]] like V1m).
  6 histories × 9 = 54 seeds, range
  **454001–454054**. VERIFIED clean 2026-11-02. attempt-01 + fresh-16
  verified free pre-freeze. Builder re-verifies; fixture-seeds after
  build; post-bank refusal; union-excluded (spent through 453xxx + own).
- Caps: 15 mains / 0 probes / 26880 worldTicks / 645120 founderSlots /
  3.0e9 scalar ops (1.2× linear est 2.4e9) / 9000s wall. Fail-closed.
- ONE authorized attempt (attempt-01). `redone: []` expected; repair only
  result-independent one-line cap form with dual provenance.

## What GO/NOGO mean

- GO: valence-specific replay acquires avoidance where surprise-general
  extinguished it (complementary mechanisms; both deployed).
- NOGO (flat): threat replay adds nothing (acquisition is not
  replay-limited). NOGO (tradeoff): BH lifts but HB pays (quantified;
  deployment refused — do no harm to extinction).
