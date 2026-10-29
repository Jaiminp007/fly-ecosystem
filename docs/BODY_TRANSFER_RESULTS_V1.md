# Body-Transfer Study V1 — Results (Option A, pursuit body)

Frozen 2026-10-28. Status: COMPLETE (audited verdict, no PASS claimed).

## Verdict: FAIL-source

The native-body source (unchanged Gen1 R=4 taste-ecology learner) failed to
requalify on the fresh 72-seed bank: gate N-g5 A-retention mean **−0.0755**
(needs strictly > 0). Per the plan's refusal criterion 1, no PASS result may
be declared and **no body attribution may be made**. The P-body and direct
transfer results are published below as observations only, not as evidence
for or against the pursuit body.

## Provenance

- Plan: `docs/BODY_TRANSFER_PLAN_V1.md` (`04f66e61…`), frozen 2026-10-28.
- Bank: `evidence/body-transfer/v1/fresh-01/protocol.json`, sha256
  `d21fb50a…`, 8 histories / 72 seeds, 19,791 excluded seeds, 1,359 evidence
  registries, 75 handoff sources. Drawn once post-freeze; never regenerated.
- Attempt: `evidence/body-transfer/v1/attempt-01/` (protocol, attempt,
  failure, rows, anchors, sources, results, results-superseded, audit).
- Learner flags verified against
  `evidence/taste-qualification/20261027-v2/attempt-01-ecology/attempt.json`
  (greedy/orthogonal/rate-1/ecology/hold-1/progress/renewal-.1/greedyInference/
  no-warm-start/cruise-0/1792 ticks) + replayPasses 4.
- Expenditure: 104 mains + 336 probes = 440 unique executions (ledger exact);
  16.04e9 scalar ops burned (cap 137.6e9); runtimes row-N 209s/217s, row-P
  219s/221s, shared-direct 25s/25s (all within 600s caps; aggregate ≈452s).

## How the attempt ran (preserved incidents)

1. First process died at the first history of row-P with EEXIST: row files
   used `wx` exclusive writes but legitimately accumulate N → P → direct.
   Row-N complete and intact (8 rows, 48 mains + 136 probes). 23 P executions
   for one history ran unsaved (6 mains + 17 probes); anchors only.
   Record: `failure.json` + partial rows + stdout log, all preserved.
2. Repair (reviewable via git): `writeOver` for progressive artifacts,
   `--resume` with bank-sha + source-manifest verification (only the runner
   file differs), skip-complete phases, unique-completion ledger + burned-ops
   compute record. Resume ran every remaining execution exactly once; the 23
   lost executions were deterministically redone. No world ran twice except
   those 23 unsaved redos; no tuning knobs exist anywhere in the instrument.
3. First scoring returned INVALID on 62 "revival violations" — an instrument
   measurement bug: the gate-7 check compared early-A/early-B probes
   (restored from atA/atB, 24 alive) against atC (18 alive). Corrected to
   per-source-anchor references (the plan's "no revival" means no
   resurrection relative to the restored checkpoint). Per-anchor recount:
   **0 violations in 320 probes**. Original INVALID preserved verbatim in
   `results-superseded.json`; corrected verdict produced by the analytic
   `--rescore` mode (no executions, no bank contact).

## Gate table (V and Vsettled; settled ≈ V at plan pricing)

Native N: g1 +4.9547 8/8 PASS · g2 +3.3912 8/8 PASS · g3 +0.5447 8/8 PASS ·
g4 aSkill +0.9687 8/8, bSkill +1.3457 8/8, bAcq +1.0268 8/8 PASS ·
**g5 aRet −0.0755 (5/8), bRet +0.3581 (8/8), survA −5 → FAIL** ·
g6transfer T = 0.0000 every history, surv 0 PASS.

Pursuit P: g1 +1.5329 8/8 PASS · g2 +0.1629 5/8 FAIL · g3 +0.6434 8/8 PASS ·
g4 aSkill −0.0476, bSkill −0.1152, bAcq −0.1019 FAIL ·
g5 aRet −0.1726, bRet −0.0153 FAIL · g6transfer T = 0.0000 PASS.

Direct N→P: transfer part T = 0.0000 every history PASS; skill transport
A: meanKX +0.6079 7/8 but everyDiffMin −1.0662 FAIL; B: meanKX +0.6451 6/8
but everyDiffMin −2.8415 FAIL.

Gate 7: maxResidual 9.2e-10 (< 1e-7) · revival 0/320 · nondegMin 15446
(pursuit exposure present in every history) · output 129.6 MB (< 8 GiB) ·
all caps honored → PASS.

nPass FALSE (N-g5) → **FAIL-source**. pPass/dPass moot; no attribution.

## Independent audit (`audit.json`)

Separate Python code path recomputed 26 gate values from raw row JSONs:
all match to <1e-9 (one transient mismatch during the audit was the
auditor's own pricing error, 0.1 vs plan 5e-6/17 — corrected, then all
matched). Revival rechecked against 24 anchor files: 0/320. Bank seeds ==
row seeds, none in the exclusion list. Ledger 104/336 exact. Bank hash
matches. Verdict logic rechecked: FAIL-source correct.

## Interpretation (within the plan's anti-footguns)

- The study is a clean FAIL-source, not an inconclusive: the source
  requalification bar (retained v2 bars, strict positive headroom) was not
  met on this bank, driven by A-retention (−0.0755) — the same ±0.1-scale
  retention fragility seen across the RSI program, now reproduced on a fresh
  bank with a frozen learner. Interesting, not a pass.
- P lifetime trails N by ≈3.4 energy/founder and P skills go negative; with
  the source disqualified these numbers are descriptive only. They do not
  show the pursuit body is worse (or better) — the comparison is unevaluable
  until a source requalifies.
- Odor-free transfer ties reset exactly (T = 0.0000, 8/8, both bodies,
  direct) — consistent with the fallback being stationary everywhere, and
  consistent with the plan's expectation that the tie case is uninformative.
- No RSI claim, no Option B execution, no second attempt on these seeds.
  The 72 seeds are spent; the family closes here unless a new plan is
  frozen under a new goal.
