# RSI C2 SKETCH V1 (pre-freeze working notes; NOT frozen, zero worlds)

Date: 2026-11-02. C1 is implemented (loop machinery, fixtures green,
triage green). C2 = frozen execution with verdict (dev bank + single
attempt). This sketch resolves C2's structure BEFORE freezing; nothing
here is decided until the C2 plan freezes it.

## The structural problem: "successive" needs ≥2 adoption→validation cycles

The RSI gate (unmoved) needs ≥2 SUCCESSIVE accepted revisions. One
train→transfer run yields ONE validation (transfer HB). Options:

- **(a) Seg-chain successive (recommended).** Per history: seg1 = train
  with loop (propose op1, sandbox-evaluate, live-adopt) → seg2 =
  transfer1 on H_te1 (validate op1) + loop proposes op2 → seg3 =
  transfer2 on H_te2 (validate op2). Successive = op2-transfer2 ≥
  op1-transfer1 ≥ baseline-transfer (improvement chain, V1l seg
  machinery). Each validation is a fresh-history transfer (no
  re-testing on spent data).
- **(b) Two-pair successive.** 2 pairs × (train + T1 + T2), same
  chain logic spread over pairs. Equivalent to (a) with pair
  structure; prefer (a) (fewer histories, V1l precedent verbatim).
- **(c) Single-adoption (REJECTED).** Cannot satisfy "successive";
  would make C2 invalid as an RSI execution. A single-adoption pilot
  could be a separate line but NOT C2 (bars unmoved, no C3 loophole).

## Copy-control form for operators (adapted from V1d)

- **Looper**: internal proposals + sandbox filter + live adoption.
- **Copied**: receives the looper's ADOPTED operators on a one-seg lag,
  no sandbox (tests whether the sandbox filter adds value over blind
  adoption of the same operators).
- **Static**: fixed BT options + billed sandbox-fee equivalent as extra
  replay passes? NO — net-of-fees comparison (looper must win DESPITE
  its sandbox spend; stronger, honest). Static pays no fee, gets no
  operators.
- Gating yardstick (+0.1, V1d G6a form) applies looper-vs-static AND
  looper-vs-copied (both must clear: product must beat doing nothing
  AND beat blind adoption).

## Sandbox→transfer generalization (the honest risk, pre-registered)

The sandbox evaluates on retained TRAIN experience; the payoff is
TRANSFER HB. This proxy gap is UNPROVEN (sandbox ranks train-error,
transfer needs extinction). Live validation catches mismatch (adopted
operators that don't transfer fail the transfer gate → rejected).
The sketch does NOT assume the proxy works — that's what C2 tests.
If sandbox-adopted operators systematically fail transfer while
hand-set ones succeed (V1h), the finding is "proxy failure" (NOGO
with mechanism), not "loop broken".

## Task choice (headroom-gated, from scoping)

HB-extinction on transfer (proven headroom: hand-set gain +0.13,
lossy +0.4; loop rediscovers or fails informatively). NOT train
(saturated 0.915) or BH (live-dominated). Metric: flip-split HB
(V1m scorer, imported frozen). Same-val/BH guardrails (no-impairment).

## Open questions for the freeze

1. Proposal ticks within segs (512/1024/1536? fewer to bound fees?).
2. Lifetime cap in C2 (C1 allows 4; execution suggests ≤3 — pre-register).
3. Sandbox split rule (fit-older/test-newer temporal? interleaved?).
4. Mains math (chains × tags × pairs; caps from V1l/V1m scale + fees).
5. Bank range (next clean after 455054; verified at freeze, printed only in the frozen plan).

## Status

SKETCH (zero worlds). Next: freeze C2 under its own plan resolving
1–5, then implement instrument + fixtures + triage + bank + attempt.
No RSI claimed (nothing executed).
