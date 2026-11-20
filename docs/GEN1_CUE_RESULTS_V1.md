# GEN1-CUE V1 verdict (2026-11-04) — NOGO (edge is cue-bound; relabeling kills it pooled)

## Authorization
User-authorized single bounded run (disk floor 1 GB; ~2G before and
after per user-trusted reading; output ~1.4M). Frozen plan
`docs/GEN1_CUE_PLAN_V1.md` (birth probes + BCR + orig/relabel frozen
probes; GO iff copyR−naiveR > +0.002 with copyR > 0). Fixtures 7/7
green pre-run (zero worlds); triage full pipeline on throwaway
490352–490360 (digests move + 20 births + BC 1280 + Hamming 2.25 +
relabel probe completes at −0.0007) BEFORE bank mint. Bank
474883–474900 minted post-triage, verified clean. Single attempt (26
runs), as measured. No rescoring. Not a swap/swap2 re-run (post-
return transmitted weights, not transplant-vs-naive) and not a
rescore of the home fraction (new relabel contrast).

## Results (pairs 474883, 474892; pooled macro-average per frozen rule)
A-content PASSES both; skill genuine. Colonies birth 45+35 pooled
(frozen newborns); matched groups 17/18 per history. All 26 runs
complete; Hamming 2.17/2.25 (>0 — relabeling real both pairs).
- Orig-cue post gap: copy 0.0089 vs naive 0.0074 (+0.0015).
- Relabeled-cue gap: copyR 0.0042 vs naiveR 0.0053 → −0.001 →
  **NOGO** (`GEN1-CUE-NOGO-V1`) — the transmitted edge does not
  survive relabeling pooled.
- Drops: copy 0.0047 (0.0089→0.0042) vs naive 0.0022 (0.0074→
  0.0053). Relabeling hurts copies more than twice as much.
- Per-seed: 474883 copy 0.0105→0.0012 (destroyed, −0.0093) vs naive
  0.0079→0.0028; 474892 copy 0.0073→0.0073 (immune, −0.0) vs naive
  0.0069→0.0078 (up). One pair cue-bound destruction, one pair
  immunity — pooled NOGO with real heterogeneity.

## Reading
The transmitted edge is cue-bound on balance (swap2-style): shuffle
the cue identities with valences preserved and the copy advantage
not only vanishes but inverts pooled (−0.001), with copies losing
more than twice what naive lose. The heterogeneity matters: one pair
holds exactly through the shuffle (abstract skill exists there),
the other is destroyed (positional skill). Transmission copies
weights; whether those weights mean anything off their training cues
is bank- (and pair-) conditional — the VISION transfer item stays
open with a boundary: post-return inheritance is real on original
cues and fragile off them. Line closed as scored. No further claim.

## Preservation
`evidence/gen1-cue-dev/fresh-50/` (bank, now spent) +
`evidence/gen1-cue-dev/attempt-01/` (untracked raw evidence, ~1.4M,
26 rows with Hamming provenance per relabel row).
