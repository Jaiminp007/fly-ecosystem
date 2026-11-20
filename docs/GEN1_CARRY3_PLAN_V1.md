# GEN1-CARRY3 PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why (retention ratio, not just residual gap)
Carry/carry2 scored the post-B residual (+0.0021, +0.0037) — not what
fraction of the inherited skill B leaves in place. This line adds a
frozen A-probe BEFORE B (same extracted offspring, frozen, original
cues, 256 ticks) alongside the post-B probe: retention fraction =
(postCopy−postNaive)/(preCopy−preNaive) — the share of the inherited
gap surviving the distinct task. Same colonies/extraction/matched-N/
B-train/A-probe machinery otherwise; pre-probes are extra frozen
256-tick runs on the same extracted groups.
- Pipeline per history (11 runs): trainAB → skillT/skillN (gate) →
  colonies copy/naive (1792, A1 mating, learning-on newborns) →
  extract + matched-N → preCopy/preNaive frozen A-probes (256,
  original cues) → bCopy/bNaive B-trains (512, learn on, engine
  B-entry) → probeCopy/probeNaive frozen A-probes (256).
- Verdict (pooled n=2): A-digest unmoved → INVALID. Else skillT≤
  skillN → INCOMPLETE-NOSKILL (void). Else pooled colony births per
  arm <6 → INCOMPLETE-LOWBIRTHS (void). Else pre-gap (preCopy−
  preNaive) ≤ 0 → INCOMPLETE-NOGAP (void — no inherited gap to
  measure retention of; not a failure of retention). Else GO
  (`GEN1-CARRY3-GO-V1`) iff retention fraction > 0.5 (B leaves most
  of the inherited gap in place) AND post-gap > +0.002 with copy > 0
  (residual meaningful). Else NOGO (`GEN1-CARRY3-NOGO-V1`) — B erases
  the majority of the transmitted edge.
- Bank: fresh-41, 474721–474738 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: train + colony + extract +
  pre-probe + B-train + post-probe on throwaway 490271–490279 proving
  digests move + births + both probes complete + fraction computable
  BEFORE bank mint. Caps: BT. Single attempt (22 runs). Disk floor
  1 GB (~1.9G per user — do NOT trust a 3G reading; output ~1-2M).
