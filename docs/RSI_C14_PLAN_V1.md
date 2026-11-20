# RSI C14 PLAN V1 (sparse update: input-conditioned target selection) — FROZEN

Date: 2026-11-02. Status: FROZEN before code. Rationale license:
SPARSE_UPDATE_SCOPING_V1 (outside-box: TFGN/Ganguli + Panetta +
Tiwari/Krawczyk, R311/R313) + C14-bar ruling (below). First line
that varies update TARGETS instead of update GAINS.

## C14-bar ruling (recorded)

Forced-first-fire KILLED (C13-with-forced-start); majority-carry
successive KILLED (same-cell aggregation). Sparse update QUALIFIES:
new revision channel (target-selection vs 12 lines of
gain-modulation), mechanism-aimed (directional overwrite of shared
weights), outside-box precedent (TFGN replay-free retention;
Panetta saliency; Tiwari coreset; Krawczyk adiabatic). The bar
("new task/gap/channel") is met by channel, not by task or gap.

## Design (seg-chain, 2 chains × 10 runs = 20 mains, 0 probes)

Per chain (H0/H1/H2), same-arm exact transplant, single fire @1024,
temporal sandbox split, lifetime ≤ OL_LIFETIME_MAX, flip-split HB
scorer, G0/G1/G2a/G2c/G2d, verdicts C14-*.
- Menu (frozen, single-op): **8 (sparseUpdate, fraction 0.5, rule
  'activation')** — top-half weights by |input|-weight product stay
  plastic per tick; rest frozen that tick. Mask recomputed per tick
  from current phi (input-conditioned, TFGN-faithful). Rule (a)
  chosen for motivation-fidelity (input-conditioned; Panetta);
  rule (b) gradient-magnitude (Tiwari) recorded as the specified
  alternative for a future line, NOT offered here.
- `sparse-*`: C6-pattern looper (fire menu 8 @1024, adopt iff pass).
- `copied-*`: TRUE dose-match blind (C7-pattern: auto-adopt menu 8
  @1024, no sandbox/fee; same config when adopted — dose matched on
  the operator).
- `static-*` + `unlearned` as in C4–C13.
- **G0**: sparse-train HB ≥ 0.5. INCOMPLETE-DESTRUCTIVE branch
  pre-registered: G0 fail = sparsity starves acquisition
  (informative tradeoff, not a wash).
- **G2a**: sparse-T1 − static-T1 ≥ +0.1 AND sparse-T2 − static-T2
  ≥ +0.1 AND sparse-T2 ≥ sparse-T1.
- **G2b (evaluation value)**: sparse − copied pooled > 0.

## Loop + experiment changes (null-default additions, at implement)

`rsi-operator-loop.mjs`: OL_MENU append index 8
`{kind:'sparseUpdate',fraction:0.5,rule:'activation'}` (indices 0–7
untouched); `adoptOperatorLive` branch (config-only: set
sparseUpdate{...}; billed +2 like surprise-init? — NO state to
init; config-only like gain/skip: fee only); live update path
applies per-tick mask (computed from current phi, billed);
`sandboxEvaluate` applies the same mask on clones (fidelity:
sandbox tests what live does). `taste-experiment.mjs`: no new arm
('looper' arm reused with looperMenuIndex=8; no new tick). All
other arms byte-identical.

## Fixtures (18), bank, caps, attempt discipline

- Loop (10): menu-8 kind/fraction/rule assertions (append-only,
  indices 0–7 pinned); mask top-half selection on synthetic
  weights; mask recomputed per tick (phi change → mask change);
  adoption config-only (no weight change, fee billed);
  live masked update (frozen half bit-identical, billed mask ops);
  sandbox masked fidelity (sandbox masked delta == live masked
  delta on same clone); masked update bills more than unmasked by
  exactly the mask ops; fire-once adopts/skips boolean; insufficient
  records skip.
- Instrument (8): scorer GO (successive + G2b); NOGO-flat;
  INCOMPLETE-destructive on G0 fail; INVALID join; bank tmpdir-build
  (pre-bank) → refusal (post-bank); transplant integrity; mains-caps
  (10×2=20) + structural guards (runner references 'sparse-T2',
  '468001'; experiment gates proposals by role).
- Fresh-30 bank `evidence/rsi-c14-dev/fresh-30/`, 9-schema, 6×9,
  range **468001–468054**. VERIFIED clean 2026-11-02 (zero hits
  docs/scripts/tests/learning/engine pre-freeze). attempt-01 +
  fresh-30 verified free pre-freeze. Builder re-verifies, post-bank
  refusal, union-excluded (spent through 467xxx + own).
- Caps 20/0/35840/860160/4.0e9/10800s. ONE authorized attempt-01.
- Tick-per-vote + {incErr,candErr} default into the instrument
  (OPEN CELLS §3 requirement — C14 is the "next freeze").

## Verdict readings (anti-hype pre-registered)

- GO: FIRST successive transfer lift by selectivity (licenses a
  C15 replication/successive line; does NOT claim RSI — the V2 rule
  needs ≥2 successive persistent revisions + productivity).
- NOGO-flat: selectivity irrelevant to transfer (channel closed).
- INCOMPLETE-DESTRUCTIVE: sparsity starves acquisition (tradeoff datum).
- All NOGO/INVALID readings preserve negatives; no rescoring.
