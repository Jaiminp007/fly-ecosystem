# GEN1-RETAIN V1 verdict (2026-11-04) — GO (91% of verified skill survives distinct B)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 3G before and
after; output ~1M). Frozen plan `docs/GEN1_RETAIN_PLAN_V1.md`. Same
train/probe instrument as SWAP2 + B-phase continual (A512+B512, never
frozen) + post-B snapshots + 4 frozen A-probes. Fixtures 7/7 green
pre-run (zero worlds; no repairs needed); triage train + A-pair on
throwaway 490181–490189 (A/B digests move + phase transition + probes
complete + 4× skill edge) BEFORE bank mint. Bank 474541–474558 minted
post-triage, verified clean. Single attempt with one fix-forward resume
(R9/density pattern: first launch crashed on a probe-row scoping typo
(`trainDigest` binding; train row unaffected — different code path —
kept; remaining 9 rows ran fresh; `redone` tracked; executionSources
≠ scoringSources dual-provenance), as measured. No rescoring.

## Results (pairs 474541, 474550; frozen probes, 48 energy; repro off)
A-content PASSES (both digests moved). A-skill genuine on this bank:
aprobeT 0.0094/tick vs aprobeN −0.0002 (positive edge ✓ — not
vacuous). Post-B: bprobeT 0.0086 vs bprobeN −0.0002. Bar (bprobeT >
bprobeN×1.1): 0.0086 > → **GO** (`GEN1-RETAIN-GO-V1`; absolute edge
0.0088, substance not just letter). Retention ratio 0.0086/0.0094 ≈
91% — distinct-task B (512 ticks, weights moved) barely dented A-skill.
Survival 1.0 all probes (256 ticks too short — rates carry it).

## Reading (first retention GO — interference is near-zero here)
- Transplant-verified cue skill survives 512 ticks of distinct-task
  learning at 91%: no catastrophic forgetting (B-family learning leaves
  A-mapping almost intact — orthogonal-enough patterns and/or spare
  capacity). This is the open VISION item (continual retention across
  distinct tasks) SATISFIED in this instance: learn A, learn B, A still
  beats naive 40-to-1 frozen. Contrasts with the frozen-content nulls
  (transfer moves nothing) and the live-dynamics GOs (nothing frozen):
  here the CONTENT itself persists across an intervening task.
- Line closed as scored. No transmission/transfer/RSI/population claim.

## Preservation
`evidence/gen1-retain-dev/fresh-31/` (bank, now spent) +
`evidence/gen1-retain-dev/attempt-01/` (untracked raw evidence, ~1M;
A/postB snaps + 8 probe rows with sums/causes/ledgers + dual-
provenance sources).
