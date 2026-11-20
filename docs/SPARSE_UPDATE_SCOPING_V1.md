# SPARSE UPDATE (SU) SCOPING V1 — DESIGN ONLY

Date: 2026-11-02. Status: DESIGN ONLY (no license, no bank, no code).
Motivation: R311 Ganguli/TFGN (replay-free retention via
input-conditioned parameter-efficient updates); open list's "no new
operator known" now has one candidate. This scopes it; freezing is a
separate turn with its own range verification + 14+ fixtures.

## The candidate (menu index 8, append-only)

`{kind:'sparseUpdate', fraction:f, rule}` — on adoption, live
updates touch only a top-f subset of weights; the rest stay frozen
that tick. Two mask rules (freeze must choose ONE, pre-registered):
(a) activation-magnitude (top-f by |input|-weight product);
(b) gradient-magnitude (top-f by |proposed delta|). Null-default:
absent = bit-identical (index never offered unless armed).
Billing: mask computation billed through `m` (comparisons +
masked muls); fee as usual.

## Why it might differ from the 12-line arc (channel argument)

All tried operators modulate the SAME full-weight delta (scale /
gate / re-time / re-rate it). Sparse update selects update TARGETS
— target-selection vs gain-modulation. TFGN's existence proof
(retention without replay, at scale, across distinct domains) says
selectivity can do the work scheduling does. If interference
between old and new codebooks lives in shared weights, freezing
most weights per tick should cut it — the FIRST operator aimed at
the wound's mechanism (directional overwrite) rather than its
schedule.

## Honest risks (falsifiable three ways — required of any freeze)

1. GO: sparse retains transfer-relevant weights → successive lifts.
2. NOGO-flat: trains fine, transfers null (selectivity irrelevant).
3. INCOMPLETE-destructive: sparsity starves ACQUISITION (G0 fails) —
   informative (selectivity-vs-acquisition tradeoff), not a wash.
   The freeze must pre-register the G0-branch reading.

## Freeze requirements (noted now, executed at freeze)

- TRUE dose-match (C7 CORRECTION applies: baseline construction;
  both-evaluate or blind-carry, no construction-config).
- Tick-per-vote + {incErr,candErr} (OPEN CELLS §3) default in.
- Menu-8 kind assertions + mask-rule assertion in fixtures.
- Fresh bank (next free range, verified) + single attempt-01.
- Arm shape deferred (C5-pattern looper/static/copied vs
  C13-pattern double/single/static); freeze chooses with reasons.

## What this does NOT do

- Not licensed (scoping only). Not a C14 freeze (watch bar still
  holds; this candidate is parked here until frozen).
- Doesn't unblock DTR (needs trunk/heads regardless).
- Doesn't claim the channel is right — TFGN is transformers, ours
  is chemotaxis; the analogy is structural (selectivity), and the
  freeze must state the disanalogy risk.
