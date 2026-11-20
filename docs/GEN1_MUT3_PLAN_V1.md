# GEN1-MUT3 PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why (mutated inheritance through the two-task gauntlet)
Mut2: at noise 0.05 the birth edge holds (+0.0081, cost +0.0004).
Erode2/3: exact-copy birth gap survives B+C (fractions 1.0, 1.43).
This line puts the MUTATED arm through the same gauntlet: birth
probes (copy/mut/naive, frozen newborns, no immersion) → BC-train
1024 (learn on, engine B-entry, auto B→C) → frozen post probes.
Scored: the MUTATED arm's retention fraction (postMut−postNaive)/
(preMut−preNaive) + mut post-gap. Copy arms run identically
(descriptive replication of erode2/3, not separately gated).
- Pipeline per history (15 runs): trainAB A512+B512 (learn on) →
  skillT/skillN frozen A-probes (256; gate) → colonies copy/mut/
  naivekid (1792, A1 mating, FROZEN newborns; mut tn 0.05) →
  preCopy/preMut/preNaive birth probes (256, frozen) →
  bcCopy/bcMut/bcNaive (B-entry, learn 1024) → postCopy/postMut/
  postNaive frozen A-probes (256, original cues).
- Verdict (pooled n=2): A-digest unmoved → INVALID. Else skillT≤
  skillN → INCOMPLETE-NOSKILL (void). Else pooled colony births per
  arm <6 (all three) → INCOMPLETE-LOWBIRTHS (void). Else mut pre-gap
  (preMut−preNaive) ≤ 0 → INCOMPLETE-NOGAP (void). Else GO
  (`GEN1-MUT3-GO-V1`) iff mut fraction > 0.5 AND mut post-gap >
  +0.002 with mutPost > 0 (mutated inheritance survives two tasks).
  Else NOGO (`GEN1-MUT3-NOGO-V1`) — the gauntlet erases the mutated
  edge. Copy fraction/gap reported descriptively.
- Bank: fresh-54, 474955–474972 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: train + three frozen
  colonies + birth probes + BC + post probes on throwaway 490388–
  490396 proving digests move + births + B→C auto-continues + probes
  complete BEFORE bank mint. Caps: BT. Single attempt (30 runs).
  Disk floor 1 GB (~16G per user — do NOT trust a 1G reading; output
  ~1-2M). Not a mut re-run (gauntlet added), not an erode2/3 re-run
  (mut arm scored), no colony immersion.
