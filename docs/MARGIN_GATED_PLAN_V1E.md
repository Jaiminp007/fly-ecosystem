# M-GATE plan amendment V1e (G3′ withdrawal → G3″ mechanism proof + rescore)

Frozen 2026-10-28, BEFORE any rescore. Execution is COMPLETE (ledger: 96
mains + 156 probes = 252 exec, 211968 ticks, 5.09M slots, 11.99e9 ops — all
within caps; 16 rows + 32 anchors on disk). The run crashed only at the G3′
step, after all worlds; NOTHING is missing except `dev-results.json`.
Zero new worlds are authorized or needed: the verdict is recomputed
analytically from disk (V3/M-ACTOR rescore precedent).

## Finding that forces the change (read-only, from ledgered anchors)

G3′ (tau-null vs gen1 weights bit-identical) FAILED on history 1
(`weights.taste diverged` ~0.1–0.2). The anchors prove the mechanism was
never applied AND the divergence source:

- tau-null `slowDir` is zeros for the checked learners (the EMA+pull live
  inside the gated function → gate never opened) — yet weights diverged.
- SAME dead-founder sets ([2,4,7,9,16,23] both arms — no death cascade).
- SAME `feedRngState`+`motorRngState` (gate adds no draws — draw-count
  identity holds), but `retentionRngState`+`replayRngState` diverged
  (eviction/replay activity shifted → observation streams shifted).
- Cause: billed-ops asymmetry (gate bills 3/update in gated arms, 0 in
  strength-0 arms) perturbs `charge.outstandingEnergy` → `own.energy` →
  terminal-tick `motorUpdate` (energy-delta targets, the only energy-coupled
  learner) + replay/eviction counts → shared-world cascade. V3/M-ACTOR never
  faced this: their pulls applied uniformly (identical billing every arm).

Lesson (preserved regardless of verdict): decision-gated interventions bill
asymmetrically per decision, so embodied comparisons confound treatment with
billing-driven chaos. Gating must bill symmetrically to be comparable — a
constraint on any future gated line.

## G3″ (replaces G3′, conjunctive)

For each history, tau-null-C vs gen1-C anchors (raw JSON):
(i) EVERY learner's `slowDir` === zeros(11) in tau-null (gate never applied);
(ii) gen1 `slowDir` undefined (machinery absent — sanity);
(iii) tau-0 anchors show nonzero `slowDir` somewhere in-bank (machinery
engages — sanity, checked once globally);
(iv) `feedRngState`+`motorRngState` identical per agentId (no extra draws);
(v) tau-null candidate ops STRICTLY greater than gen1 (gate billed).
(vi) REPORTED (not gating): alive-set equality + billed-equality resid
(|Δvalue + Δops×opE/24|), documenting the chaos magnitude.

## Rescore procedure

New `rescoreMarginGatedDev({bankPath,output})`: verify bank SHA vs
attempt.json; assert ledger 96/156; recompute G1 (pooled relevance), perTau +
`gateGoNoGo`, G3″ from disk; write `dev-results.json` with
`executionSources` (attempt start) + `scoringSources` (current) + redone as
ledgered. Conjunctive go = g1.go && g2.go && g3″.go && caps. Any failure →
line CLOSED, negatives published.
