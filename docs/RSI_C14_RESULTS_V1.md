# RSI C14 RESULTS V1 (sparse update: input-conditioned target selection) — C14-NOGO

Date: 2026-11-02. Single authorized attempt-01, fresh-30 bank
(468001–468054, 6×9, verified clean pre-freeze). 20 mains / 0 probes /
35840 world-ticks / 860160 founder-slots / 3.265e9 scalar ops.
`redone: []`. Caps respected.

## Verdict: C14-NOGO (NOGO-flat branch; NOT destructive)

`{g1:true, g0:true, g2a:false, g2b:true, g2c:true, g2d:true,
mSP1:0.3121, mS1:0.3528, mSP2:0.3789, mS2:0.4016, mN:0.3058, mSP:0.3455,
sameSP:0.918, lift1:-0.041, lift2:-0.023, sparseMinusCopied:+0.040}`

- G0 PASSES (sparse trains, HB ≈ 0.9+ presumably — train gaps pass
  0.5): the pre-registered DESTRUCTIVE branch does NOT fire.
  Sparsity does not starve acquisition — the tradeoff fear is
  retired by data, not by argument.
- G2a fails (both lifts slightly NEGATIVE): selectivity is
  irrelevant-to-slightly-worse for transfer, not helpful.
- G2b passes (+0.040): evaluated sparse beats blind-carried sparse
  (selection value real, small) — but neither beats static. Same
  shape as C13 (+0.030): evaluation adds a little, transfer stays.
- Retention intact (0.92); unlearned flat; join 100%.

## Adoption (votes carry tick/errors per OPEN CELLS §3 — first line)

Sparse: 28/141 (20%) overall, DECLINING across legs (train 15/48
→ T1 9/48 → T2 4/45). The sandbox passes less on transferred
weights — the loop's own selectivity weakens exactly where transfer
is tested. Copied: 0 votes (blind by design). The tick-per-vote
plumbing worked (all votes stamped 1024); the decline is legible
only because of it — the OPEN CELLS debt is now paid forward.

## Reading (per frozen plan)

NOGO-flat: trains fine, transfers null. Target-selection joins
gain-modulation in the null set — the channel is closed, not just
its settings. The TFGN analogy breaks at the substrate (transformer
selectivity ≠ chemotaxis masking), as the plan's disanalogy warning
allowed. Rule (b) gradient-magnitude stays specified-but-unlicensed
(same-channel variation; C14-bar logic applies).

## Cumulative and closure

- C-series: 13 lines, 260 mains, 0 accepts, all `redone: []`.
- C14 line CLOSED. No second attempt.
- A C15 needs a genuinely new rationale (task/gap/channel) —
  selectivity variations (fraction, rule (b)) are NOT licensed by
  this result.
