# GEN1-CARRY4 PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why (birth probe: read transmitted weights before colony life)
Carry3 voided (NOGAP): pre-probes read POST-COLONY weights and colony
life had equalized the arms. This line probes at birth: colonies run
with FROZEN newborns (freezeNew=true both arms — births continue as
in heir2, 23+32 pooled; freezing preserves birth-exact weights to
extraction, proven 18/18–19/19 exact end-of-run). Extraction then
yields true birth weights; pre-probe reads the transmitted gap before
any offspring learning; B-train (learning on) + post-probe follow
identically. Not hoping a gap appears — mechanically guaranteed to
read birth weights.
- Pipeline per history (11 runs): trainAB → skillT/skillN (gate) →
  colonies copy/naive (1792, A1 mating, frozen newborns) → extract +
  matched-N → preCopy/preNaive frozen A-probes (256, birth weights) →
  bCopy/bNaive B-trains (512, learn on, engine B-entry) →
  probeCopy/probeNaive frozen A-probes (256). Retention fraction =
  (postCopy−postNaive)/(preCopy−preNaive).
- Verdict (pooled n=2): A-digest unmoved → INVALID. Else skillT≤
  skillN → INCOMPLETE-NOSKILL (void). Else pooled colony births per
  arm <6 → INCOMPLETE-LOWBIRTHS (void). Else pre-gap ≤ 0 →
  INCOMPLETE-NOGAP (void — unexpected here; birth weights carry the
  true gap). Else GO (`GEN1-CARRY4-GO-V1`) iff fraction > 0.5 AND
  post-gap > +0.002 with copy > 0. Else NOGO
  (`GEN1-CARRY4-NOGO-V1`) — the distinct task erases the majority of
  the birth-transmitted edge.
- Bank: fresh-42, 474739–474756 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: train + frozen colony +
  extract (exact-copy check) + pre-probe + B-train + post-probe on
  throwaway 490280–490288 proving digests move + births + birth-exact
  extraction + fraction computable BEFORE bank mint. Caps: BT.
  Single attempt (22 runs). Disk floor 1 GB (~1.9G per user — do NOT
  trust a 3G reading; output ~1-2M).
