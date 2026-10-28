# RSI plan amendment v7: competitive skill streams with endogenous gating

## Rationale

Decomposition (`RSI_TASTE_DECOMPOSITION_SMOOTHING.md`) shows backward anchors
fail behaviorally: slow weights drag stale contingencies into current
foraging (+62–85 harmful eaten). Protection must not touch the active
learner. Hence compartmentalization: K=2 taste-predictor streams gated by
the learner's own streaming prediction error (mixture-of-experts,
winner-learns). No labels, no phases, no observer quantities — only own
taste prediction errors, which the body already computes for learning.

## Change (source `taste-energy.mjs` + `--streams` + `--stream-hysteresis`)

* `streams` K ∈ {1,2}, default 1 = exact current behavior (single weights,
  bit-identical; 20+ tests pass).
* K=2: each stream owns a full fast taste-weight vector; each tracks an EMA
  (α=0.05 fixed, own errors only) of its taste prediction error on live steps.
* Control: argmin EMA; ties → stream 0. Hysteresis h ∈ [0,1] (fixed menu
  values): switch only if challenger EMA < controller EMA − h.
* Only the controller learns live (tasteUpdate) and replays from the shared
  buffer; the idle stream's weights freeze. Feeding uses the controller's
  prediction. Motor stays shared (unchanged).
* Both streams' predictions + EMAs bill through `math(state)`; idle-stream
  storage billed per byte. No slow vectors involved.
* Menu (2 cells): K=2/h=0 (pure argmin), K=2/h=0.1 (sticky). Hypothesis
  (falsifiable): the A-stream freezes during B/C with weights intact while
  the B-stream learns undragged, passing both fresh margins without the
  lifetime surrender — because nothing learned is ever pulled toward
  anything old. If streams thrash (both learn everything) or the extra
  compute exceeds behavioral gain, the family closes.
* Rules unchanged: new search bank v8, ≤96/procedure, fresh eval banks, v2
  gates, copy control, ≥2 successive + productivity. All prior failures stand.
