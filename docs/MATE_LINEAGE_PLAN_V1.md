# MATE-LINEAGE PLAN V1 — FROZEN (taste-edge inheritance across generations)

Date: 2026-11-03. Status: FROZEN (design only until implemented).
Single authorized bounded world run (disk floor 1 GB; ~4G at freeze).

## Rationale (new question, not a replication)
MATE-COMPOUND asked whether offspring inherit the taste edge but produced
zero gen-2s in either line — the one-generation window voided its own
question (all verdict weight fell on founder births). This line fixes the
window, not the question: mutated maternal transmission (N(0,0.05),
V1b-inherit plumbing, null-default exact-copy preserved) is the ONLY
setting with replicated gen-2 presence (V1b mutant 3 + exact 2; V1c exact
3 + first gen-3), combined for the first time with the learning contrast
(candidate vs unlearned founders — never run under mutation). If the
taste edge is heritable, candidate lineages should out-reproduce AND
out-persist unlearned lineages where generations exist to compare.
Different transmission from compound (mutated vs exact), different bank,
different verdict (persistence-gated). Not a reopen of INHERIT V1c (that
closed the mutation-vs-exact question with no learning contrast).

## Design (frozen; proven plumbing only — no engine changes)
- Instrument: `scripts/mate-lineage-dev.mjs` (new; mate-compound pattern
  + V1b transmissionNoise plumbing). 2 histories × 2 arms
  (mutant-candidate / mutant-unlearned, maternal + N(0,0.05) both arms)
  = 4 mains, ZERO probes, enriched nutrient 5.0, bar 50,
  matingActionRequired false, reproduction true, BT_TICKS, BT_FOUNDERS,
  body N. Candidate line learns every generation; unlearned line frozen
  every generation (constructor + newborn paths); mutation symmetric.
- Metric (frozen): per-line totals (founders + all descendants) + max
  generation + gen-2+ counts. GO iff candidate-line total births >
  unlearned-line total AND candidate maxGen ≥ unlearned maxGen
  (persistence required — the inheritance question; thin n=2, licenses
  replication ONLY). All-zero → INCOMPLETE-NOBIRTHS (void). Else NOGO.
- Bank: `evidence/mate-lineage-dev/fresh-01/` 473226–473243 (2 × 9),
  verified clean pre-freeze (0 exact hits evidence + tracked), builder
  re-gates at mint. First use is the single run.
- Fixtures (new `tests/mate-lineage-dev.test.mjs`, green required):
  bank tmp-mint shape/exclusion, scorer GO/NOGO/INCOMPLETE branches on
  synthetic rows, noise-option contrast (mutant vs exact transmission
  params at tick 0, synthetic seed) + maternal wiring, generation
  summarizer + maxGen parity. Triage-analogue = zero-tick.
- Caps: mate values; expected output <2M. `df` pre/post, abort under 1 GB.
- Single attempt, no rescoring (compound/inherit/selection/decomp stand).

## Gates (frozen)
- G1: ledger exact (4 mains / 0 probes, 2 per arm).
- G2: config audit (maternal + noise 0.05 both arms, bar 50, nutrient 5.0,
  births integers, generations valid, founder accounting intact).
- Verdict: as above. Descriptive only: per-history tables, gen-1 lifespan,
  maxGen per line, per-seed gen-2 lists.
- Scope: NO population/learning/RSI/retention claim beyond the licensed
  next step. No cross-line pooling.
