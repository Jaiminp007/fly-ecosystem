# MEMORY-RESET PLAN V1B (FROZEN 2026-11-04 — single authorized bounded run)

## Why re-use (explicitly ordered; no new seeds)
- Memory-reset V1 voided (fresh-12 NOBENEFIT — intact ≈ naive, nothing
  to erase) and showed the benefit is bank-dependent (2/3 banks positive).
  The reset question ("does the benefit disappear?") is only askable
  where the benefit EXISTS. The joint bank (fresh-11: 474163, 474172) is
  benefit-positive (return-A 0.49 vs 0.13, same seeds both measures).
- This V1b runs the V1 instrument VERBATIM (same driver, same 5 arms,
  same factorial, same bars) on the joint histories via a re-use protocol
  (copy of joint histories + re-use scope — NOT a new bank, NOT re-minted,
  zero new seed exposure). The joint first-use stands; this is a second
  measurement on the same histories, disclosed here and in-attempt.
  Re-use is by explicit user order (the exclusion was "that bank"
  = fresh-12, and "that joint" = the joint instrument — neither bars
  this V1b measurement).
- Not the dev reset-probe (same disclaimer as V1: return-A factorial,
  not continued-learning benefit).

## Design (identical to V1; only the histories change)
- Same 5 arms (intact/wreset/sreset/both/unlearned), same ops, same
  advance(1536) → op → advance(256), same retA metric (imported backward
  core), same pooled bars (guard NOBENEFIT; GO iff both-reset ≤ naive
  ×1.1; else NOGO), same ledger (10 mains), same caps.
- Re-use protocol: evidence/memory-reset-dev/reuse-01/protocol.json
  (joint histories verbatim + re-use scope). Driver asserts reuse seeds
  == joint bank seeds (read-back check, no hardcode). No minting scan
  (nothing new to exclude), no fixture-seeds file (re-use guard is the
  joint-match assert), no triage (V1-verbatim ops + runs; fixtures cover
  the reuse reader + scorer smoke).
- Single attempt. Disk floor 1 GB (free ~1.05G; output ~1.1M; stop if <1G).
