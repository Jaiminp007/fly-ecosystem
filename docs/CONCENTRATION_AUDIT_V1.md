# CONCENTRATION AUDIT V1: the residual is mildly concentrated, transfer narrows it, concentration doesn't predict the tax

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/turn-gated-dev/attempt-*/rows summaries (per-cue
contact/turn/label) + dev-results gaps.
Prior: TURN_GATE_CONCENTRATION (one bank: error mass in ~3 HB cues, top-1
26–43%). This generalizes across all 11 banks/lines/arm types.

## Findings

1. **Train residuals are barely above uniform — everywhere.** Pooled
   across each bank's 3 train histories (18 harmful cue-instances):
   top-1 0.065–0.075, top-3 0.184–0.211, nearly IDENTICAL in all 10
   banks. Uniform expectation is 3/18 = 0.167 for top-3. The original
   26–43% was a single-history artifact (few cues per history inflate
   top shares); the pooled truth is mild concentration.
2. **The unlearned baseline matches train.** Unlearned top-3 0.206–0.230
   vs train 0.184–0.211: misses follow CONTACTS, not learning.
   Learning does not concentrate errors beyond exposure — if anything
   it slightly evens them (turning lifts low-contact cues proportionally
   more). The concentration is a property of the encounter distribution,
   not the policy.
3. **Transfer narrows the residual.** Transferred-uniform top-3 runs
   0.276–0.585 (vs train ~0.20); gain/damage/lossy arms sit in between
   (0.24–0.54); seg2–seg4 chains hold ~0.23–0.29. Post-transfer errors
   live on fewer cues than post-training errors — consistent with
   all-or-nothing per-cue carryover (carried cues turn, dropped cues
   don't) vs graded training. Mechanism: hypothesis only (cues differ
   across codebooks, so no direct train→transfer cue pairing exists).
4. **Concentration does not predict the tax.** corr(bank train top-3,
   bank transfer gap) = −0.166 (n=10). Banks with more concentrated
   training residuals transfer no better or worse.

## Verdict (measurement — correction + extension, no GO/NOGO)

- **CORRECTED:** the single-bank 26–43% top-1 figure does not
  generalize; the pooled train residual is ~20% top-3, at the contact
  baseline. The "attributed floor" (hardest-cue residue) stands as
  mechanism but is SMALLER and more ordinary than reported: the residue
  is where the contacts are.
- **LICENSED:** transfer-narrowing (residual concentrates post-transfer;
  largest in plain uniform transplants, muted by gain/damage/lossy) as
  a descriptive regularity; the null link between residual shape and
  transfer magnitude.
- No bank, instrument, or verdict rescored. Cumulative worlds unchanged.
