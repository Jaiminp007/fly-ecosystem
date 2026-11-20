# THREAT-SIM RESULTS V1 — TS-NOGO (flat)

Date: 2026-11-02. Attempt-01 (single authorized): 15/0/26880/645120/2.441e9,
`redone: []`, caps respected (3.0e9/9000s). Bank fresh-16 (454001–454054) SPENT.

## Verdict: TS-NOGO (flat, not tradeoff)

| Gate | Result |
|---|---|
| G1 join+integrity | TRUE |
| G0 train ≥0.5 | TRUE (0.8115 — 9th replication) |
| G2a-PRIMARY BH lift ≥+0.1 | FALSE (+0.0037: 0.7961 vs 0.7924) |
| G2b HB no-impairment | TRUE (Δ −0.014, guardrail −0.1) |
| G2c unlearned flat | TRUE |
| G2d same floor ≥0.5 | TRUE (0.95 both) |

## Licensed interpretation

- Threat replay is ENGAGED-BUT-INERT: harmful intake is plentiful
  (harmShare ~0.31–0.36, buffers full of harmful records — the gate
  fires routinely), threat-train intake composition is identical to
  baseline (0.3149 vs 0.3154), and BH moves +0.004. Firing changes
  nothing.
- Differential replay-sensitivity (mechanistic, connects three lines):
  EXTINCTION is replay-sensitive (surprise +0.134 HB, lossy works);
  ACQUISITION is live-dominated (threat +0.004, damage +0.015,
  surprise-comparator flat). Live updates already capture harmful
  events (large prediction errors → big live steps); replay adds
  nothing where live errors are large, everything where live errors
  are small (preserved avoidance). Third replay-gate inertness for
  acquisition (damage, surprise-comparator, threat).
- Exact-transfer HB 0.31–0.32 replicates the wound (V1m exact 0.288);
  G2b confirms threat replay does no harm to extinction either.
- No rescoring, no second attempt. Line CLOSED.

## Cumulative: 8118 worlds (8103 + 15 threat-sim mains).
