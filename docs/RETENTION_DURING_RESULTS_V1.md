# RETENTION-DURING V1 verdict (2026-11-04) — INCOMPLETE-NOLEARN (void)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 4G before and
after; output 1.3M). Frozen plan `docs/RETENTION_DURING_PLAN_V1.md`.
New line (online frozen-probe retention during B — not taste-backward's
live return-A). Fixtures 6/6 green pre-run (zero worlds; one pre-run fix
disclosed: evidence-walk path bug + BT import source, zero mechanism
impact); bank 474037–474072 minted post-fixtures, verified clean
(whole-token scan). Single attempt, as measured. No rescoring.

## Results (pairs 474037→train/474046→probe, 474055→train/474064→probe)
G1 pass (2 mains + 12 probes, digests match, configs audited).
Pooled post-A baseline 0.487 vs pooled naive 0.881 (margin ×1.1 needs
0.969). Verdict: **INCOMPLETE-NOLEARN** — no above-naive A-skill in
frozen weights even pre-B, so the retention question is vacuous on this
measure. Curve (descriptive): 0.487 → 0.427 → 0.384 → 0.370 → 0.334
(monotone decay, but from below-naive throughout — decay of nothing).
Live train rates: A 0.37/0.39, B-segment 0.61/0.54 (learning never
exceeded naive anywhere, live or frozen).

## Reading (the void is informative, and bounds backward-GO)
- No contradiction with taste-backward GO: regimes differ. Backward's
  return-A is ticks 1536–1792 of a depleting world (food scarce — skill
  matters, naive starves); these probes are 256 ticks on FRESH worlds
  (food full — naive gobbling feasts at 0.88, ceiling). Retention-in-
  weights is measurable only where naive is not at ceiling. This line
  therefore does NOT correct backward to relearning-artifact; it bounds
  it (GO holds for depleted-regime return, untested for fresh-regime).
  The M-RELEARN-ceiling reading (live recovery, not weight content)
  remains consistent but unproven either way.
- Design lesson preserved: fresh-world probes hit the naive ceiling by
  construction (feast favors gobbling; depleted-skill weights look worse
  than init). Any licensed follow-up must probe depleted/poor layouts
  where skill binds — a genuinely new design, not a V2 of this one.
- Cross-line pattern (preserved, not a claim): naive ≥ trained is now
  the third instance — V1/V1b/V1c/surprise transfer (unlearned wins),
  M-RELEARN (wipe costs 0 ticks), here (frozen naive 2.4× live trained
  on fresh layouts). The substrate's learning never beats naive wherever
  both are measured; skill, where it exists (backward depleted return),
  is regime-specific.
- Line CLOSED as voided (no V2 without fresh rationale + depleted-probe
  machinery; the exclusion list is respected — nothing re-run).

## Preservation
`evidence/retention-during-dev/fresh-06/` (bank, now spent) +
`evidence/retention-during-dev/attempt-01/` (untracked raw evidence, 1.3M).
