# RSI-TRANSFER PLAN V1B — FROZEN (loop-proposed change + births-transfer eval)

Date: 2026-11-03. Status: FROZEN (design only until implemented).
Single authorized bounded world run (disk floor 1 GB; ~5G at freeze).

## Rationale (new contrast, not a re-run)
V1 (energy-transfer) closed with a split: the loop's rate change beats
fixed (+2.2) but loses to unlearned (−1.1) — learning helps train and
hurts energy-transfer. MATE-SELECTION/COMPOUND show the OPPOSITE ranking
under births (learned 6>5, 17>10, 11>5): foraging skill converts to
reproductive surplus (energy-gated mating). This world combines them:
V1-verbatim loop (whatever it self-proposes this time — possibly a
different change than V1's 2.0/2.0) transplanted to held-out transfer
histories WITH mating on, scored on BIRTHS. Three-way independence holds
(proposal from live trajectory / no sandbox filter / verdict on held-out
histories under an eval never used for selection). If the reproductive
edge transfers, a self-proposed change beats unlearned under independent
eval; if not, the boundary is mapped (births edge does not relocate).
Not a re-run of V1's contrast (different eval metric, different bank,
different verdict question).

## Design (frozen; V1 train verbatim + mating probes)
- Instrument: `scripts/rsi-transfer-v1b.mjs` (new; V1 train phase copied
  verbatim — selfPropose rate dials, checkpoints, fees, finalRate median,
  weight snapshots — plus mating-probe phase). 2 pairs × (3 trains +
  3 mating probes) = 12 mains, ZERO non-mating probes, no engine changes.
- Train: selfmod/fixed/unlearned on pair-train histories, no reproduction
  (V1 conditions). Probe: transplant train-final weights to pair-transfer
  history at adopted/default rate (V1 rule), WITH reproduction:true,
  bar 50, nutrient 5.0, matingActionRequired:false, verticalTransmission
  'none' (zeroed newborns — V1 zeroed precedent; isolates transplanted-
  founder edge), full 1792 advance. Probe rows carry transfer digests,
  probeRate, births, generations, endpoint.
- Metric (frozen): probe total births per arm (founders + descendants).
  Descriptive: probe endpoint energy, gen-2+, per-pair tables.
- Bank: `evidence/rsi-transfer-dev/fresh-02/` 473118–473153 (4 × 9 =
  2 pairs), verified clean pre-freeze (0 exact hits evidence + tracked),
  builder re-gates at mint. First use is the single V1b run.
- Fixtures (extend `tests/rsi-transfer-dev.test.mjs`, green required):
  V1b bank tmp-mint shape/exclusion, scorer GO/NOGO/VOID branches on
  synthetic rows, mating-probe wiring (zero-tick construction with
  reproduction+bar50+nutrient5+maternal-off), finalRate/transplant
  re-covered by V1 tests (same code paths). Triage-analogue = zero-tick.
- Caps: V1 values; expected output <3M. `df` pre/post, abort under 1 GB.
- Single attempt, no rescoring (V1 stands; train gaps descriptive only).

## Gates (frozen)
- G1: ledger exact (12 mains / 0 probes) + train phaseRows complete
  + all 6 probe digests match + config audit (probeRate == logged
  final/default; mating bar 50, nutrient 5, transmission none).
- Verdict: adopts == 0 → INCOMPLETE-NOFIRE (void); all-zero probe
  births → INCOMPLETE-NOBIRTHS (void); else mean(selfmod births) >
  mean(fixed) AND > mean(unlearned) → GO (self-proposed change beats
  unlearned under births-transfer; thin n=2, licenses replication
  ONLY); else NOGO with stop-rule analogue.
- Scope: NO successive-revision/RSI/retention/population claim.
  Descriptive only: energy, gen counts, per-pair tables, adopted rates.
