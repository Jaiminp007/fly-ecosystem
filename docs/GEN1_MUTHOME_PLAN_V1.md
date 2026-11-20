# GEN1-MUTHOME PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why (mutated inheritance through gauntlet + return)
Mut3/4: mutated birth gap survives B+C (fractions 0.62, 1.05). Home:
exact copies lose 75% on return-practice (0.25). This line puts the
MUTATED arm through gauntlet + return: birth probes
(copy/mut/naive, frozen newborns, 0.05 noise) → BCR-train 1280
(B+C+return-A, learn on) → frozen post probes. Scored: the mutated
gap after the return (mutPost − naivePost) + mut fraction vs birth.
- Pipeline per history (15 runs): trainAB A512+B512 (learn on) →
  skillT/skillN frozen A-probes (256; gate) → colonies copy/mut/
  naivekid (1792, A1 mating, FROZEN newborns, mut tn 0.05) →
  preCopy/preMut/preNaive birth probes (256, frozen, matched-N) →
  bcrCopy/bcrMut/bcrNaive (engine B-entry, learn 1280) →
  postCopy/postMut/postNaive frozen A-probes (256, original cues).
- Verdict (pooled n=2): A-digest unmoved → INVALID. Else skillT≤
  skillN → INCOMPLETE-NOSKILL (void). Else pooled colony births per
  arm (all three) <6 → INCOMPLETE-LOWBIRTHS (void). Else mut pre-gap
  ≤ 0 → INCOMPLETE-NOGAP (void). Else GO (`GEN1-MUTHOME-GO-V1`)
  iff mut post-gap > +0.002 AND mutPost > 0 AND mut fraction > 0.5
  (mutated edge survives gauntlet + return). Else NOGO
  (`GEN1-MUTHOME-NOGO-V1`) — return-practice closes it. Copy gap/
  fraction reported descriptively.
- Bank: fresh-56, 474991–475008 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: train + three frozen
  colonies + birth probes + BCR + post probes on throwaway 490406–
  490414 proving digests move + births + BCR auto-continues 1280 +
  probes complete BEFORE bank mint. Caps: BT. Single attempt (30
  runs). Disk floor 1 GB (~17G; output ~1-2M). Not a home re-run
  (mut arm scored) and not a third immediate post-task probe
  (return-practice first).
