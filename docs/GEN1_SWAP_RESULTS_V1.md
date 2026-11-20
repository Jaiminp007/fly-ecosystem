# GEN1-SWAP V1 verdict (2026-11-04) — NOGO (null; shuffled mapping neutralizes cue-following)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 4G before and
after; output ~1M). Frozen plan `docs/GEN1_SWAP_PLAN_V1.md`. New
instrument (swapCueIdentity: fresh random bits, valences preserved,
Hamming>0 asserted at runtime; placeTrained: A-weights + clear + freeze
+ energy48 + re-baseline; 512-tick A-train + 256-tick frozen B-probes).
Fixtures 7/7 green pre-run (zero worlds; two laziness repairs —
null-guard, pooled-count — zero mechanism impact); FULL-pipeline
triage on throwaway 490163–490171 (A-digest moves + Hamming 2.08 +
both probes complete + finite intake) BEFORE bank mint. Bank
474505–474522 minted post-triage, verified clean. Single attempt
(2 trains + 4 probes), as measured. No rescoring.

## Results (pairs 474505, 474514; frozen B-probes, 48 energy; repro off)
A-content check PASSES (A-digest moved both histories). Pooled
net-rate: transplant −0.0001/tick vs naive +0.0001/tick (both ~0 —
parity). Bar (transplant > naive×1.1): −0.0001 < → **NOGO**
(`GEN1-SWAP-NOGO-V1`). Toxin parity too (0.0154 vs 0.0164 —
NOT inversion). Survival 1.0 everywhere (256-tick probes too short
for deaths — rates carry the verdict, survival descriptive).

## Reading (cue-following into a shuffled mapping = random)
- Neither positional benefit (same positions do not help — no
  spatial content in frozen weights, as expected (no spatial memory))
  nor cue-bound inversion (no systematic wrong choices — the random-
  bit swap orthogonalizes the mapping rather than reversing it, so a
  cue-following policy eats randomly w.r.t. new valences: toxin
  parity, not excess). The A-content EXISTS (digest moved; policy
  follows old cues) but is USELESS under swap — neutralized, not
  reversed. Third frozen-content null (with return-novel (fresh) and
  the 2×2 voids), now with the positions channel closed too.
- Line closed as scored. No transmission/transfer/RSI/population claim.

## Preservation
`evidence/gen1-swap-dev/fresh-29/` (bank, now spent) +
`evidence/gen1-swap-dev/attempt-01/` (untracked raw evidence, ~1M;
A-snaps + B-probe sums/causes/ledgers).
