# TRAIN-SCALE RESULTS V1 — TRS-NOGO (structural plateau)

Date: 2026-11-02. Attempt-01 (single authorized, fresh run after pre-verdict
instrument repair — see incident note): 18/0/53760/1290240/4.035e9,
`redone: []`, caps respected (6.0e9/10800s). Bank fresh-17 (455001–455054)
SPENT. Crash debris (12 rows, digest-ordering slip, guard caught it)
preserved at `evidence/train-scale-dev/attempt-01-debris-ordering-slip/`.

## Verdict: TRS-NOGO (both answers negative)

| Gate | Result |
|---|---|
| G1 join+integrity | TRUE |
| G0 short ≥0.5 | TRUE (0.9142) |
| G2a-PRIMARY restart − long ≥ +0.1 | FALSE (+0.0138: 0.9280 vs 0.9142) |
| G2b survival ≥30% | TRUE (0.42/0.44) |

## Findings

- **Time adds exactly zero.** Long (3584) 0.9142 vs short (1792) 0.9142
  (Δ=0.0000 to 4 decimals, 6 matched histories). NOT underfit: training
  hits a hard structural ceiling at ~0.91 regardless of ticks.
- **Perturbation adds ~+0.01.** Restart 0.9280 vs long 0.9142 (+0.0138,
  far below the +0.1 yardstick). Lossy-restart is not a revision with
  advantage at matched budget.
- **The 0.95 remains unexplained by time or same-history perturbation.**
  Lossy-transfer to a NEW history reaches 0.95; same-history restart
  reaches 0.93. Candidates: history-novelty, fresh-optimizer reset, or
  metric mismatch (see synthesis correction below). Needs new rationale —
  not a defect of this line (both NOGO branches are answers).

## Incident (pre-verdict instrument slip, fail-closed worked)

First attempt-01 crashed at 12/18 on `restart transplant digest mismatch`:
the digest assert ran AFTER `run2.advance` (post-learning weights vs
transplant snapshot). The guard caught it before any verdict output.
Repair: mechanical reorder (digest pre-advance, V1m order), dual
provenance (debris sources preserved; clean-run sources in attempt.json).
Fresh attempt-01, single verdict. 12 debris worlds counted (+12).

## Synthesis correction (metric hygiene, analytic)

`docs/DOSE_RESPONSE_SYNTHESIS_V1.md` finding 2 ("negative tax +0.11")
mixed metrics: train POOL-GAP (h−b ≈ 0.82) vs transfer HB CORRECTNESS
(≈0.95). In comparable correctness units (c ≈ (1+g)/2): train ≈ 0.91
vs transfer 0.95 → tax ≈ −0.01–0.04 (V1m −0.009, V1n −0.041, T1-direct
−0.039). Direction holds (transfer still exceeds train), magnitude is
~3× smaller than stated. Dose curve itself (all-HB) unaffected. The
synthesis doc carries this correction; its verdicts never depended on
the magnitude.

## Cumulative: 8148 worlds (8118 + 12 debris + 18 train-scale mains).
