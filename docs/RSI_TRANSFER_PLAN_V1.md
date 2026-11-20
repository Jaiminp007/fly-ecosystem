# RSI-TRANSFER PLAN V1 — FROZEN (self-proposed rate change + independent transfer eval)

Date: 2026-11-03. Status: FROZEN (design only until implemented).
Single authorized bounded world run (disk floor 1 GB; ~5G at freeze).

## Rationale (new combination, not a variation)
The SELF line proved the mechanism (V1a GO: loop fires/sandbox-adopts/
checkpoints persist) and closed the selection question on TRAIN gaps
(V1b harmful, V1d null). But NO line has ever scored a SELF-PROPOSED
change under TRANSFER eval: V1a-d scored train endpoints only (their
banks' transfer seeds were never run); the C-series transfer-tested
EXTERNAL revisions only. This instrument reuses V1a's proven loop
verbatim (selfPropose + checkpoints + fees, imported not rewritten)
and adds the missing independent eval: transplant each train-final
weight set to a held-out paired history at the ADOPTED rate and score
transfer endpoints. Three-way independence: proposal from live
trajectory / selection-free (no sandbox filter on transfer) / verdict
on held-out histories never seen in training. Same-codebook transfer
(V1m paired-history pattern); cross-codebook stays a licensed
follow-up, not claimed here.

## Design (frozen; no engine changes — reuse + transplant pattern)
- Instrument: `scripts/rsi-transfer-dev.mjs` (new; V1a train loop
  copy-adapted with weights snapshot + finalRate reconstruction, plus
  probe phase). 2 pairs × (3 train arms + 3 transfer probes) = 12 mains,
  ZERO probes, BT_TICKS, BT caps, legacy nutrients, no reproduction.
- Train arms: selfmod (loop proposes rate direction per founder,
  adopts iff candErr<incErr×0.99, lifetime-capped, fees billed —
  V1a-verbatim) / fixed (learns, never proposes) / unlearned (never
  learns; floor control). TasteExperiment arm 'candidate' for
  selfmod+fixed (selfMod flag gates firing), 'unlearned' for unlearned.
- Transfer probes: for each train row, fresh TasteExperiment on the
  pair-transfer history with learnerOptions.tasteRate = row.finalRate
  (selfmod: median of founders' final adopted rates, reconstructed from
  proposal logs; fixed/unlearned: default 1.0), transplant
  snapshotWeights with checkTransplantIntegrity + digest match, advance
  full ticks, score endpoint energy. Probe rows carry transfer digests,
  probeRate, endpoint (no weight storage).
- Bank: `evidence/rsi-transfer-dev/fresh-01/` 473064–473099 (4 × 9 =
  2 pairs), verified clean pre-freeze (0 exact hits evidence + tracked),
  builder re-gates at mint. First use is the single run.
- Fixtures (new `tests/rsi-transfer-dev.test.mjs`, green required):
  bank tmp-mint shape/exclusion, finalRate reconstruction from synthetic
  proposals, transplant digest round-trip on synthetic learners,
  scorer GO/NOGO/VOID branches on synthetic rows, zero-tick selfPropose
  skip branch (no worlds pre-run).
- Caps: V1a values; expected output <8M. `df` pre/post, abort under 1 GB.
- Single attempt, no rescoring (V1a-d stand; train gaps descriptive only).

## Gates (frozen)
- G1: ledger exact (12 mains / 0 probes) + train phaseRows complete
  (4 ids every train row) + every probe row has digest-matched transplant.
- G2: config/integrity audit (probeRate == logged finalRate/default;
  sourceDigest == appliedDigest all 6 probes; founder accounting; default
  rate 1.0 for fixed/unlearned probes).
- Verdict on transfer means (n=2 pairs): no adopts anywhere →
  INCOMPLETE-NOFIRE (void — transfer test vacuous); else
  mean(selfmod_te) > mean(fixed_te) AND mean(selfmod_te) >
  mean(unlearned_te) → GO (self-proposed change transfers; thin n=2,
  licenses replication ONLY); else NOGO with stop-rule analogue.
- Scope: NO successive-revision/RSI/retention/population claim.
  Descriptive only: per-pair tables, per-agent rate spread, train gaps.
