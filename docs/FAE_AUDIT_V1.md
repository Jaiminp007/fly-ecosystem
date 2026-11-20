# FAE AUDIT V1: do our NOGO mechanism claims outrun their evidence? (Mostly no.)

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Executes the R151-specified fundamental-attribution-error audit: re-attribute
every NOGO/INVALID mechanism claim across instrument / bank / agent-substrate
variance, and flag claims whose level lacks variance evidence.
Script: none (reads frozen published verdicts + jury-audit classes).

## Evidence codes (pre-registered)

- **W**: within-run mechanism directly observed (counts, ratios, digests,
  timing signatures, elimination audits).
- **B**: cross-bank replication of the direction/claim.
- **I**: cross-instrument consistency (same direction via different knob).
- **F**: floor (no mechanism information — jury-audit floors; correctly
  claims only establishment/absence).
- **S**: single-bank single-instrument mechanism inference (FAE RISK).

## Findings (claim → codes → rating)

- RSI-SELF V1b (eval-window overfitting): W (160:1 replay dominance
  read-only) + B (V1c fixed it, harm removed). NONE (gold: tested).
- RSI-SELF V1d (saturated substrate + drift): W (47/48 tick-1024 adopts,
  copied==fixed bit-identical). LOW (mechanism observed, not inferred).
- GAIN-DOSE INVALID (bank variance): B-failure + W (elevated baselines);
  attribution explicitly to bank. NONE (the audit IS the anti-FAE move).
- BRAKE V1 INVALID (live-only swamped 1:4): W → V2 built on it. NONE.
- BRAKE V2 NOGO (implicit release beats explicit): W (manip −0.155) + I
  (V1+V2 same lift-fail). LOW-MEDIUM (dose/strength variants untested).
- CUE NOGO (wrong readout, pause cue-blind): W (0.27–0.28 all histories)
  → turn-gate TESTED the alternative. NONE.
- R-GAP INVALID (behavioral pause-bias, not billing): W (exact 0.0
  symmetric ×3 studies + consistent-signed deviations) + I. LOW.
- M-POP INVALID-FEASIBLE (threshold unreachable): W (energies −56..−64,
  stopped after triple). LOW (minimal feasibility claim).
- Feasibility INFEASIBLE (structural block): code-verified. NONE.
- Dev-era (MARGIN/M-GATE/S-GATE/M-ACTOR/RELEARN): W each (measured deltas,
  ceilings, recomputation); dev verdicts provisional BY DESIGN. LOW.
- DAMAGE-GATE NOGO (trigger not bottleneck): W (2841 fired + D1 +0.015;
  comparator also flat with 297). LOW-MEDIUM (single bank; harder-window
  alternative flagged as direction, not finding).
- MATE-ACT (proximity, not actuation): W (elimination audit + Q1 waste).
  LOW.
- MATE-DENSE (density×qualification): W + I (ENERGY bar50 confirmed bar).
  LOW.
- MATE-INHERIT V1 (one-generation window): W (16/16 gap 0, transmission
  verified) + B/I (V1b/V1c tested window). NONE.
- MATE-INHERIT V1c (V1b edge = seed luck): B (replication killed it) +
  pooled. NONE (gold standard).
- MATE-SOCIAL V1/V2 (encounters / copy-rule exonerated): W + I (V1+V2+
  copyalways triple). LOW.
- MATE-ENCOUNTER V1b INVALID (births bank-volatile): W → V1c changed gate.
  NONE (measurement fix, not mechanism claim).
- MATE-ENCOUNTER V1c (food confound): **S** (diagnosed from design
  arithmetic 1<2<3, NEVER manipulated). **MEDIUM — the one S-only
  mechanism claim in the program.** Emlen-Oring split specified, unexecuted.
- ATTRACT arc (5 NOGOs): B (5 banks) + I (5 knobs, converging nulls). LOW
  (best-attributed arc: convergence, not any single run).
- LEAVE V2 (luck/saturation): W (ladder break within-run) + B-partial
  (k=2 replicated). LOW-MEDIUM.
- RECOMBINE (neutral; ratchet hypothesis): W + hypothesis explicitly
  future (load-then-recombine). LOW (observation/hypothesis separated).
- DISPERSE (philopatry load-bearing): W (identical births/gen-1, cliff
  exactly at gen-2) + topology counterfactual TESTED (scattering deepened
  sink). LOW-MEDIUM (single bank).
- PROXIMITY V1b (breadth-sufficient): W (hub-flat vs spread-lift
  interaction) + B (V1→V1b→V1c). LOW.
- INFORMED (establishment failure 0v0): F (floor read as floor). NONE.
- BALDWIN (metric void): F-equivalent (bar unreachable by construction;
  claims only void). NONE.

## Verdict (methodological — no GO/NOGO)

- **FAE risk LOW program-wide.** The discipline substitutes W (mechanism
  observed in-run) + I (cross-instrument convergence) + selective B
  (replication where cheap) for the unattainable full factorial — and the
  verdicts respect the conjunction (this knob on this bank failed).
- **Exactly ONE S-only mechanism claim: ENCOUNTER-V1c food-confound.**
  Flagged for the Emlen-Oring split (specified, unexecuted). Two
  hypothesis-flagged (ratchet, saturation-wording) were already marked
  future-work, not findings.
- **Structural point:** single-attempt ⇒ attributions are about
  conjunctions; decomposition (mechanism vs luck vs substrate) is
  hypothesis until W/B/I support arrives. The program's record shows
  this boundary held — including the Gettier annotation (labeled
  post-hoc) and the jury-compliant floor readings (no mechanisms from
  unanimous zeros).
- No bank, instrument, or verdict rescored. Cumulative worlds unchanged.
