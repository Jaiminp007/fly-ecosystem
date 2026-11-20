# GEN1-WIPE V1 verdict (2026-11-04) — GO (edge disappears on wipe; carrier = weights)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 3G before and
after; output ~1M). Frozen plan `docs/GEN1_WIPE_PLAN_V1.md`. Same
train/probe instrument as RETAIN + placeCleared (copy for integrity,
then zeroWeights blank + freeze + energy48 + re-baseline). Fixtures
7/7 green pre-run (zero worlds; no repairs needed); triage train +
intact/cleared on throwaway 490190–490198 (digests move + direct
zero-read proves wipe + both complete) BEFORE bank mint. Bank
474559–474576 minted post-triage, verified clean. Single attempt
(2 trains + 8 probes), as measured. No rescoring.

## Results (pairs 474559, 474568; frozen probes, 48 energy; repro off)
A-content PASSES. A-skill genuine: aprobeT 0.0080 vs naive 0.0017.
Intact (post-B): 0.0077 vs naive (>×1.1 ✓ — edge replicates; 96% of
A-skill, consistent with RETAIN). Cleared: 0.0017 vs naive 0.0017 —
EXACT TIE (no positive edge — disappears when wiped). Bar (intact>
naive×1.1 AND cleared≤naive): both hold → **GO**
(`GEN1-WIPE-GO-V1`). All survival 1.0 (256 ticks too short — rates
carry it).

## Reading (the carrier is the values)
- Zeroing post-B weights drops the skill to EXACTLY naive level —
  the retained edge lives in the weight values, not in placement,
  world, freeze, or store (all identical). Cleared ties rather than
  beats naive, so init noise is not a handicap here (nothing to
  unlearn); the intact edge is genuinely learned content that blank
  zeros lack. Carrier closed: values, verified by erasure.
- Line closed as scored. No transmission/transfer/RSI/population claim.

## Preservation
`evidence/gen1-wipe-dev/fresh-32/` (bank, now spent) +
`evidence/gen1-wipe-dev/attempt-01/` (untracked raw evidence, ~1M;
A/postB snaps + 8 probe rows with sums/causes/ledgers).
