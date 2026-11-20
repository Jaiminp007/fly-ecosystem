# FLIP-DISCRIMINATION PROBE V1 — synthetic, zero bank worlds

Date: 2026-11-02. Synthetic records only (no bank seeds, no worlds);
runs the REAL loop functions (`fireLooperChoice`/`fireLooperFlipChoice`)
on four synthetic experience profiles. Answers the C9 plan's open
gate fixture (``gain wins standard but surprise wins flipped, OR
documents why impossible'').

## Profiles × winners (best-adopted or null)

| Profile | Standard best | Flipped best |
|---|---|---|
| calmPos_flipNeg | surprise | null |
| gainFavors (positives only) | surprise | null |
| surpriseBurst | null | surprise |
| noisyCalm | null | null |

Adopted SETS (all passing, not just best): calmPos standard adopts
all three, flipped none; surpriseBurst standard none, flipped all
three. The evals DIVERGE (neither subsumes the other) — the flip
mechanism fires correctly and independently.

## The gate as literally specified is NOT met — and why

No profile yields gain-wins-standard AND surprise-wins-flipped.
Instead surprise wins EVERY adoption under BOTH evals. The flip
modulates WHETHER anything passes (strictness, direction-dependent),
never WHICH operator wins. Mechanism reason: the surprise branch is
the only live-fit path (gain/skip replay-fit); live-fit learns the
fit set most aggressively, so surprise dominates standard-eval
wherever learning helps at all, and flipped-eval inherits the same
ranking (it tests the same learned weights on flipped labels).
Flip-eval cannot rank transfer-value because both evals rank
learning-aggressiveness. The plan's hoped-for dissociation
(gain↔standard, surprise↔flipped) is structurally unsupported:
surprise↔both, gain↔neither.

## What this reframes (bounds, does not rescore)

- C9/C10 zeroes: consistent with barren banks AND with mechanism
  (nothing to discriminate even where adopted). Both readings
  remain open; neither line can separate them (no standard arm
  fired on C9's bank; nothing fired on C10's).
- C10's G2b is weakened prospectively: had C10's bank adopted,
  both evals would likely have picked surprise (same winner →
  G2b≈0 by mechanism, not by dose). The flip-vs-standard test was
  likely doomed by mechanism, not just by banks. (Prospective,
  synthetic-grounded; C10's verdict stands as bank-null.)
- Requirement (any future eval-objective work): the eval must rank
  operators DIFFERENTLY than learning-aggressiveness — e.g., score
  per-operator transfer proxies, not held-out error. No current
  mechanism does this.

## Standing

- Zero bank worlds (synthetic records, real functions). No verdict
  changes (C9/C10 stand). The C9 plan's open gate fixture is now
  answered: "documents why impossible" (surprise-dominance).
- Cumulative unchanged (8331).
