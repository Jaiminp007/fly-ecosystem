# Symmetric-gated protection plan V1 (S-GATE line)

Frozen 2026-10-28. Status: DESIGN ONLY until implementation + execution.
Single authorized Phase-D attempt only. Parent: M-GATE
(`docs/MARGIN_GATED_RESULTS_V1.md`: DEV-NOGO) — this plan builds on its
findings, does not re-litigate them.

## Hypothesis (one sentence)

M-GATE confounded treatment with billing chaos (gate-open billed the whole
pull, gate-closed billed nothing, so arms diverged even with the pull never
applied); computing the V3 pull UNCONDITIONALLY and masking only its
APPLICATION restores identical billing at identical states, so a fair
certainty-gated test is possible for the first time.

## Instrument delta (exact, frozen formula; `learning/taste-energy.mjs` only)

1. `anchorTasteDirection(state,m,apply)` gains an unbilled boolean `apply`:
   slowDir EMA + zero-norm early-return + pull computation run EXACTLY as now
   (early-return is state-dependent and gate-independent — pre-existing V3
   semantics, preserved); only the final write is masked:
   `w[j]=clip(state,m.add(w[j],m.mul(apply?lam:0,pull)))`.
   Mask 1 ⟺ current pull bit-exact (`add(w,0)=w` exact; pull finite: norms
   nonzero post-guard, weights clipped ±8, slowDir EMA of clipped values).
2. Call site: `if(strength>0)anchorTasteDirection(state,m,marginGatePass(state,m))`.
   `marginGatePass` is already always-bill-3 on every path (V1b); the flag
   itself is plain JS. Per-decision billed ops are therefore CONSTANT at
   identical states across open/closed/null arms — the symmetry proof is by
   construction audit + fixture exactness (below).
3. Defaults unchanged (`marginGateTau:0` V3-compatible; explicit `null` = off;
   Infinity rejected). Gen1 (`strength=0`) never reaches the call site —
   bit-identical preserved. No new state, no counters, no draws, no other
   callers (verified read-only 2026-10-28: single call site :153; nothing else
   reads `slowDir`; `m.less` returns plain boolean).

## Bank + grid (fresh, union-excluded)

- Dev bank `evidence/symmetric-gated-dev/fresh-01/`: deterministic
  383001–383036 (4 histories × 9), `fixture-seeds-01.json` written post-build
  (V1c ordering lesson); mains BT_TICKS=1792, BT ecology, 6 arms,
  `slowAnchorRate=DEV_MU`, `slowAnchorStrength=0.02`.
- Grid τ ∈ {null (control: compute, never apply), 0 (V3-uniform replication:
  mask≡1 by construction), 0.3}: 3 configs × 24 mains + 3 × 52 probes =
  **228 executions**. τ=0.3 rationale: above G1's top-tercile cut (0.207);
  0.2 never closed once in-bank (M-GATE), so 0.2 is not re-tested.
- Caps (script-enforced, fail-closed): exec ≤300, scalarOps ≤20e9, wall
  ≤3600s, storage ≤200MB. Expected ≈212k ticks / ≈5.1M slots / ≈12e9 ops.

## Conjunctive bars (all pass → GO; any fail → line CLOSED, no Phase Q)

- G1 relevance (control mains, as M-GATE): admitted n≥1000, top-tercile
  target==1 rate − bottom ≥0.10. Fail → gating baseless → NOGO.
- G2 effect (τ-0.3 vs τ-null, V3 aggregates/scales): ΔA≥+0.15 AND ΔB≥−0.10
  AND level≥−0.20 AND alignment up. The fair comparison (symmetric billing).
- G3 fidelity: (i) fixture: open-vs-closed runs through `tasteUpdate`
  bill EXACTLY equal ops, weights differ only by application; (ii) fixture:
  null-vs-strength-0 runs weights-deepEqual with Δops==3×updates;
  (iii′) in-bank non-degeneracy: τ-0.3 anchors differ from τ-null somewhere
  (gate opened ≥once) AND from τ-0 somewhere (gate closed ≥once) —
  determinism makes difference ⟺ application (billing identical
  pre-divergence). Degenerate grid → NOGO (the M-GATE lesson, encoded).
- G4 caps held (ledger). G5: full suite shows no NEW failures vs stashed
  baseline; gate fixture tests (τ ∈ {null,0,0.3} threshold incl. 0.3-split,
  null fail-closed, masked-apply bit-exactness, restore round-trips incl.
  null) green BEFORE execution.

## Not included (unchanged)

No Gen1 fourth arm (fidelity moved to fixture-exactness + (iii′)); no H2,
no ELSEWHERE, no qual/reserve contact, no bank reuse, no rescoring.
Crash-resume only under M-GATE-V1d precedent (bank SHA, dual provenance,
redone disclosure, ledger-exact, no second resume). On GO: DEV-accepted,
Phase-Q proposal separate. On NOGO: S-GATE closes with the chaos question
settled either way.
