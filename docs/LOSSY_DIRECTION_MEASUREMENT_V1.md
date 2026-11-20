# Lossy-direction measurement V1 (V1j frozen rows, analytic, zero new worlds)

Script: `scripts/lossy-direction-measurement.py` (read-only on
`evidence/turn-gated-dev/attempt-10/rows/*.json`; writes nothing
to evidence). V1j verdict untouched (no rescore).

## Question

V1j proved lossy (x0.5) beats exact (+0.1324) on AGGREGATE flipped
correctness. The M2 wound is direction-specific (harm→ben stalls;
ben→harm converges). Does lossy specifically unlock the HB
(harm→ben, must extinguish avoidance) direction, or lift both?

## Method (post-hoc — hypothesis-generating only)

Split V1j flipped cues by direction (train/test label pairs):
- BH = train-beneficial → test-harmful (must ACQUIRE avoidance).
- HB = train-harmful → test-beneficial (must EXTINGUISH avoidance).
Contact-weighted correctness per arm (exact vs lossy), same `wcorr`
logic as the frozen `scoreFlipSplit` (turn rate when test-harmful,
cruise rate when test-beneficial). Pooled across 3 pairs.

## Result (frozen rows, descriptive)

| pair | arm | BH corr | HB corr |
|------|-----|---------|---------|
| 418001→418010 | exact | 0.7678 (2 cues) | 0.3754 (2) |
| 418001→418010 | lossy | 0.7668 (2) | 0.4794 (2) |
| 418019→418028 | exact | 0.8186 (3) | 0.2265 (4) |
| 418019→418028 | lossy | 0.8261 (3) | 0.5789 (4) |
| 418037→418046 | exact | 0.8456 (2) | 0.2480 (4) |
| 418037→418046 | lossy | 0.8521 (2) | 0.4522 (4) |
| **pooled** | **exact** | **0.8110** (7, 11738) | **0.2791** (10, 12861) |
| **pooled** | **lossy** | **0.8209** (7, 12154) | **0.5133** (10, 11355) |

- BH lift: +0.0099 (≈ zero; already high — no wound, no treatment).
- HB lift: **+0.2342** (nearly doubles; 3/3 pairs positive).
- The ENTIRE V1j aggregate lift (+0.1324) comes from HB cues.
- HB exact 0.2791 replicates the floor-attribution 0.29 INSIDE V1j's
  exact arm (consilience: the wound is visible in the control).

## Reading (generates, does not test)

Lossy transplant specifically unlocks UNLEARNING (extinction of
preserved harm-avoidance); acquisition (BH) needs nothing (already
0.81 exact). Mechanism: exact over-preserves avoidance (turning at
0.72 when the cue says cruise); shrinkage (×0.5) weakens the
preserved avoidance → approach emerges. Regularization, not
amnesia (same-val 0.94+ both arms — retention intact).

## License

V1k confirmation line warranted (fresh bank, pre-registered
direction gates: HB lift ≥ +0.1 primary; BH no-harm floor;
same-val retention floor). Post-hoc → pre-registered test.
No V1j rescore (verdict stands); no claim until V1k runs.
