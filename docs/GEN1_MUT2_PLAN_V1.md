# GEN1-MUT2 PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why (mutation dose 0.05: does the lineage-world noise preserve the edge?)
Mut V1: at noise 0.01 the mutated edge holds fully (+0.0089, cost
−0.0002). The earlier lineage worlds used transmission noise 0.05
(5×). This line re-runs the identical three-arm birth contrast at
0.05: exact copy vs mutated (maternal + 0.05 Gaussian) vs naive,
frozen newborns, frozen birth probes on original cues. Not a re-run
at 0.01 (different dose) and not a mate-lineage re-run (no lineage
tracking — scored endpoint is probe intake).
- Verdict (pooled n=2): A-digest unmoved → INVALID. Else skillT≤
  skillN → INCOMPLETE-NOSKILL (void). Else pooled colony births per
  arm <6 → INCOMPLETE-LOWBIRTHS (void). Else GO (`GEN1-MUT2-GO-V1`)
  iff mutProbe − naiveProbe > +0.002 AND mutProbe > 0 (0.05 noise
  preserves a usable edge). Else NOGO (`GEN1-MUT2-NOGO-V1`) — 0.05
  destroys it. Copy-vs-mut drop reported descriptively (dose cost).
- Bank: fresh-53, 474937–474954 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: train + three frozen
  colonies (mut digest ≠ exact digest at 0.05) + extract + probes on
  throwaway 490379–490387 proving digests move + births + probes
  complete BEFORE bank mint. Caps: BT. Single attempt (18 runs).
  Disk floor 1 GB (~1.4G per user — do NOT trust a 3G reading;
  output ~1-2M).
