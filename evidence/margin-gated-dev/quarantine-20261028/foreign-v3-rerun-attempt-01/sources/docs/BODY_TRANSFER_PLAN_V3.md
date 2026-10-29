# Body-transfer study V3: slow-direction anchor (FROZEN 2026-10-28, DESIGN ONLY)

## Lineage and hypothesis

V1 FAIL-source → V2 FAIL-body → read-only diagnostic
(`docs/RETENTION_DIAGNOSTIC_V2.md`): no macroscopic handle (buffer
composition, drift magnitude/direction, gain) discriminates retention
outcome; N≡Q mechanistically; retention detail (±0.1) lives in directional
residue no rehearsal-volume dial can see. All 29 exhausted classes reallocated
rehearsal *volume*. V3 is the first line to protect readout *direction*.

**Hypothesis H3**: a slow-direction anchor on the taste readout — regularization
pulling fast taste weights toward their slow EMA *direction* (rotation damped,
magnitudes free) — preserves A-skill direction through B-phase interference
while B magnitudes still learn. Predicts: higher cos(w_C, w_A) alignment,
improved A-retention with B-leg held, then transfer of the retained skill to
body Q. Falsifiable at both phases below.

**Learner identification (explicit revision, not unchanged transfer).**
Base: Gen1 R=4 flags exactly as V1/V2 (greedy/orthogonal/rate-1/ecology/
hold-1/progress/renewal-.1/replayPasses-4/capacity-32/recent-8/strata-1/rate-1/
tournament-1/greedyInference/no-warmstart/tasteLearning/normalize/cueBlind/
consol-0/motorConsol-0/streams-1/hysteresis-0/surpriseGain-0/window-0/slots-1/
slotRate-0.05/margin-0/boost-0/skip-0/evict-0/cruiseSpeed-0). Revision: slow
taste-direction anchor with rate μ and strength λ, default OFF (λ=0 reproduces
Gen1 bit-identically; existing taste-energy tests pin this). Scope: taste
readout only (the dissected skill readout); actor/critic untouched. All anchor
arithmetic billed through `work.scalarOperations` at existing prices
(`OPERATION_ENERGY=5e-6/17`, settlement `1e-5/(17*8)`); anchor state
checkpointed with the learner (persist/backfill like `body`).

Mechanism (frozen): slow vector `s` per learner, init 0; each taste update:
`s ← (1−μ)s + μ·w_fast`; fast update gains `−λ·∇_w(1−cos(w_fast,s))`
(= rotation-only pull; exact form in implementation, billed). Frozen constants:
μ=1e-3; λ ∈ {0 (control), 0.02, 0.08} in Phase D only; ONE λ frozen for Phase Q.

## Bodies and gates

Bodies N (native) + Q (V2 translation-preserving pursuit, byte-identical V2
mapping). P dropped: its descriptive contrast role is spent (measured twice).
Gates: same 7 gates/bars as V2 (`BODY_TRANSFER_PLAN_V2.md` §Gates, unchanged
numbers) on N+Q with the revised learner. Verdicts: PASS (all 7 N+Q) /
FAIL-source (N fails → revised learner unqualified, no body attribution) /
FAIL-body (N passes, Q fails) / INVALID (integrity/exposure/budget breach).
Refusal criteria 1–2 inherited unchanged. No bar moved, no exception.

## Phase D: development exploration (dev seeds, predeclared go/no-go)

- ONE dev bank: 4 histories × 8 seeds = 32 fresh dev seeds, union-excluded from
  all future qual banks automatically (evidence-protocol scan). N-body only,
  6 arms (candidate/λ / unlearned/frozen/reset/acceptCruise/acceptStationary;
  λ arm = revised learner), 1792 ticks, 17-probe batteries, NO direct probes.
  Budget: 3 configs (λ∈{0,0.02,0.08}) × (24 mains + 68 probes) = 276
  executions, cap 90e9 ops. No gates; raw retention + alignment readouts only.
- **Go bar (all required):** best-λ mean A-retention − control mean ≥ +0.15
  AND B-retention not worse than −0.10 AND g1 level not worse than −0.20 AND
  mean cos(w_C,w_A) alignment strictly above control. Else CLOSE the line,
  publish the negative, spend no qual bank. Winner λ frozen on dev; never
  re-tuned on qual seeds.

## Phase Q: single qualification attempt (iff Phase D goes)

- ONE fresh 72-seed qual bank (8 histories, union exclusions incl. Phase-D dev
  bank + all spent banks + synthetics), drawn post-freeze, single attempt,
  no resume beyond V2's verified skip-complete path (new code = new
  instrument rule applies).
- N+Q mains: 6 arms × 8 histories × 2 bodies = 96 mains (1792 ticks) +
  shared nativeFullCruise + 8 N→Q direct probes/history (64). Probes:
  17×8×2 = 272 + 64 = 336. **Total 432 executions**, caps inherited from V1
  (1e9 mains/1e8 probes/65536 bytes/founder, 240e9 aggregate, 600s wall+CPU
  per row, 8 GiB output). Independent Python audit + published results doc
  required for any verdict. One attempt; FAIL/INVALID closes the family.

## Budgets and non-goals

- Total worst case: 276 (D) + 432 (Q) = 708 executions ≈ V2 scale.
- No tuning on qual seeds; no second qual attempt; no moved bars; no RSI
  claim (needs its own 2/2 successive protocol); no Option B execution.
- External literature: no web-search tooling in this environment; mechanism
  basis is the program's own diagnostic + standard slow-weight/consolidation
  background (EWC/SI family: protect important directions, not volumes).
  Cited as background, not as reviewed evidence.
