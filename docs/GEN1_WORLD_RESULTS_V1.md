# GEN1-WORLD V1 verdict (2026-11-04) — NOGO (floor-bound; code-plan mismatch disclosed)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 2G before and
after; output 1.1M). Frozen plan `docs/GEN1_WORLD_PLAN_V1.md`. New cell
(world-depth effect on naive Gen1s — no weight copy anywhere). Fixtures
6/6 green pre-run (zero worlds); triage on throwaway 490046–490054
(shallow births proven BUT rate ~0.000 — floor warning recorded
pre-run); diagnostic re-run on throwaway (per-Gen1: born 245–337,
net food −1.36 to +1.11 — toxins make sums sign-unstable, neonatal
confound disclosed); bank 474235–474252 minted post-triage, verified
clean. Single attempt, as measured. No rescoring.

## Results (pairs 474235, 474244; Gen1 mean food/tick alive)
Deep +0.0055 vs shallow −0.0125 (both pairs: deep 0.004/0.007, shallow
−0.014/−0.011). Code output GO (hi>lo×1.1 edge case); FROZEN PLAN rule
(max/min ratio > 1.1) gives −0.44 → **NOGO**. G1 pass (4 mains).
Correction disclosed below; line closed on the plan rule.

## Reading (the verdict is NOGO and the reason is the floor)
- CODE-PLAN MISMATCH (mine, disclosed): the gate implements hi>lo×1.1,
  which equals the planned max/min ratio ONLY for positive lo. With lo
  negative (toxin-net Gen1s), hi>lo×1.1 fires on any hi (here on floor
  noise). The frozen plan's ratio (−0.44) governs → NOGO. The code is
  left as-run (audit trail); the mismatch is the finding, not a patch.
- Floor-bound (the substance): both arms' Gen1s net ~zero food per tick
  (toxins cancel intake; triage shallow +0.0001 vs run shallow −0.0125 —
  SIGN UNSTABLE across banks at this scale, proving noise-floor).
  Absolute gap 0.018 is 30× below foraging scale (0.3–0.9). The NOGO
  means "no detectable world effect", not "proven null" — the measure
  cannot resolve depletion-depth effects because naive Gen1s barely eat
  net anything in EITHER world.
- Cross-line recalibration (preserved, not a rescore): gen1-taste's 3.9×
  (copybest 2.03 vs naive 7.92 LIFETIME) re-reads as rates ~0.002 vs
  ~0.008/tick — same floor. Its NOGO direction holds (copybest < naive
  both pairs), but the effect is floor-scale (absolute ~0.006/tick),
  not a feast-gap. Offspring foraging is founder-dominated; Gen1 net
  contribution ≈ 0 regardless of weights or world.
- Neonatal confound stands as disclosed (shallow Gen1s born 245+ of 512;
  deep mixed ages). Line CLOSED as scored (NOGO-floor). No
  transmission/transfer/RSI/population claim.

## Preservation
`evidence/gen1-world-dev/fresh-14/` (bank, now spent) +
`evidence/gen1-world-dev/attempt-01/` (untracked raw evidence, 1.1M).
