# GEN1-CLEAN PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why a codebook swap (toxin isolated, nothing else moves)
- Gen1-cause left boom-bust starvation vs threshold-toxin open (both fit
  fresh deaths ~1000 + intake parity). Removing toxin intake
  discriminates: toxin-necessary → fresh-clean lives (rescue to deep
  level); toxin-irrelevant → fresh-clean dies like fresh-toxic
  (boom-bust/starvation dynamics, which do not need poison).
- Clean = makeCueCodebook(history.cueSeed) with every valence forced to
  +1 (same bits/ids/order — deterministic same-seed construction; only
  the sign changes). Applied by direct enterCuePhase re-lay + overriding
  run.codebook (so auto B/C transitions stay clean — readapt-precedented
  direct call). Same resourceSeeds → same centers/positions/amounts/
  regrowth: the ONLY difference vs toxic is damage-on-eating (toxin
  patches are eaten at 0.8/tick with direct energy drain — engine line
  165-167 — clean patches give the same food with no drain). No per-tick
  surgery, no engine change.
- Historical fresh-toxic control (0.0 survival, 4/4 runs across placed
  V1 + drain V1 — NOT re-run, per exclusion; cited): the verdict
  compares concurrent fresh-clean vs concurrent deep-toxic, read against
  that rock-solid historical zero. Concurrent deep arm also controls
  bank-viability (if deep dies too, the bank is generally lethal).

## Design (2 arms × 2 histories = 4 mains; rescue test)
- Deep-toxic: placed V1 verbatim (deplete 1024 toxic, place naive+freeze+
  energy48+re-baseline, meter 1792 per-tick toxin/food/energy). Fresh-clean:
  fresh run + codebook swap (re-lay + run.codebook=clean) at tick 0 +
  same placement + same metering. Same K, same minds, same histories —
  depletion and codebook are the only differences (disentangled below).
- Metric: survival fraction at K (primary — does clean rescue fresh?).
  Toxin sums (manipulation check: clean must load ~0; if clean loads
  like toxic, the swap failed → INVALID). DeathCauses descriptive.
- Bank: fresh-20, 474343–474360 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: ONE throwaway fresh-clean run
  (swap + place + 256 metered ticks) on 490082–490090 (added to spent,
  disclosed) proving zero toxin load + completion BEFORE bank mint.
  Caps: BT. Single attempt. Disk floor 1 GB (free ~2–4G; output ~1M).
- Verdict (pooled n=2): clean toxin NOT ~0 → INVALID (swap failed —
  mechanism untested). Else GO (`GEN1-CLEAN-GO-V1`) iff fresh-clean
  survival ≥ deep-toxic survival ×0.9 (rescue to deep level — toxins
  were necessary for fresh death). Else NOGO (`GEN1-CLEAN-NOGO-V1`) —
  clean still dies (boom-bust/starvation, not poison). No
  transmission/transfer/RSI/population claim. (Equivalence-as-GO is
  pre-registered: the hypothesis IS rescue-to-deep-level.)
