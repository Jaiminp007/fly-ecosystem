# TRANSFER CLOCK V1: divergence does not predict the tax — transferability is a pair property

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Executes the R118-specified Horvath-analog on 27 frozen (train, exact-transfer)
pairs, attempts 02–10 (attempt-01 excluded: no transferred arm; seg2 excluded:
different instrument; pairing trans=train+9 verified per pair).
Script: `scripts/transfer-clock.py`.

## Question

Naive clock: bigger retained-weight divergence D → bigger transfer tax
T = trainGap − transGap. Exact transplants: D≈0 (integrity-verified);
lossy (×0.5): D = 0.5·‖w‖ ≈ 29 (deterministic, no transferred weights needed).

## Findings

1. **The train side is constant; all variance is transfer-side.**
   trainGap range 0.808–0.833 (width 0.025) vs transGap 0.374–0.796
   (width 0.42, 17× wider). corr(trainGap, transGap) = +0.10. Median tax
   0.247. The clock's input carries no information — pairs do not differ
   in trainability; they differ in TRANSFERABILITY (published pair floors
   0.79/0.87/0.81, cue-set-dependent — now the whole story).
2. **Divergence capacity barely whispers.** corr(‖w_train‖, tax) = +0.32
   (n=27, norm range narrow 52–59.8 — all trains converge alike). Weak,
   uncalibrated, not a clock.
3. **The clock runs backwards.** Lossy D≈29 (vs exact D≈0) → tax SMALLER
   by 0.08–0.17 on all 3 pairs (tax_exact 0.22–0.37 → tax_lossy
   0.14–0.20). More divergence, less tax — the V1j moral quantified.

## Verdict (measurement — naive clock NOT SUPPORTED)

- **NOT SUPPORTED:** the Horvath-analog in magnitude form (information
  loss predicts the tax). At D≈0 the tax varies 0.03–0.44; at D≈29 it
  shrinks. Magnitude is the wrong axis.
- **LICENSED (refined):** divergence DIRECTION over magnitude —
  structured compression (×0.5) beats exact preservation; and
  transferability-as-pair-property (cue-set-dependent floors) replaces
  trainability as the predictor. Both were published verdicts; this
  analytic unifies them quantitatively.
- No bank, instrument, or verdict rescored. Cumulative worlds unchanged.
