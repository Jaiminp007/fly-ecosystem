# GEN1-MUT PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Why (does the engine's normal mutation preserve the benefit?)
Every positive transmission result used an experimenter exact paste
(null noise). This line tests the engine's own mutated offspring:
maternal transmission + transmissionNoise Gaussian (per-weight,
deterministic per-newborn RNG — the engine's normal mechanism;
genome mutation:false is a separate switch and stays off). Three arms
at birth with frozen newborns (no colony immersion — probes read
birth weights): exact copy (noise null) vs mutated (noise 0.01,
a-priori fixed, disclosed — not tuned; triage verifies the digest
moves, not the outcome) vs naive init. Frozen probes on original cues.
- Pipeline per history (9 runs): trainAB A512+B512 (learn on) →
  skillT/skillN frozen A-probes (256; gate) → colonies copy/mut/
  naivekid (1792, A1 mating, FROZEN newborns — birth weights preserved;
  mut arm transmissionNoise 0.01) → extract birth weights per arm →
  probeCopy/probeMut/probeNaive (256, frozen, matched-N per history
  first-k by id, energy 48).
- Verdict (pooled n=2): A-digest unmoved → INVALID. Else skillT≤
  skillN → INCOMPLETE-NOSKILL (void). Else pooled colony births per
  arm <6 → INCOMPLETE-LOWBIRTHS (void). Else GO (`GEN1-MUT-GO-V1`)
  iff mutProbe − naiveProbe > +0.002 AND mutProbe > 0 (natural
  mutation preserves a usable edge). Else NOGO (`GEN1-MUT-NOGO-V1`)
  — mutation destroys it. Copy-vs-mut drop reported descriptively
  (cost of a point-mutation load). No relabel/return; no transfer/
  RSI claim.
- Bank: fresh-52, 474919–474936 (2 histories × 9, 18 unique), minted
  post-fixtures, verified clean. Triage: train + three frozen
  colonies (mut digest ≠ exact digest) + extract + probes on
  throwaway 490370–490378 proving digests move + births + mutated
  weights differ from exact + probes complete BEFORE bank mint. Caps:
  BT. Single attempt (18 runs). Disk floor 1 GB (~1.5G per user — do
  NOT trust a 3G reading; output ~1-2M). Not an heir re-run (mutated
  arm is new) and not a cue re-run (no relabel).
