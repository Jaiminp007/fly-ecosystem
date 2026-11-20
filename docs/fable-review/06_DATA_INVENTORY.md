# 06. Data inventory (all local; `evidence/` is mostly gitignored)

| Run | Data files | Size / runtime |
|---|---|---|
| RSI V1 search | `evidence/rsi-search/run-20261111.{json,log}` | 42 min, ~2,300 worlds |
| RSI V2 compose | `evidence/rsi-compose/run-20261111.{json,log}` | |
| RSI V3 compose (gain credit) | `evidence/rsi-compose/run-v3-gain.{json,log}` | |
| RSI V4 guided | `evidence/rsi-guided/run-v4.{json,log}` | 91 min |
| RSI V5 | `evidence/rsi-v5/run-v5.{json,log,err}`, `smoke.json` | 7,578 s |
| V6 design checks | `evidence/rsi-v6/devcheck.json` (the sharpcheck output is in that session's log) | |
| RSI V6 | `evidence/rsi-v6/run-v6.{json,log,err}`, `smoke.json`, `smoke7.json` (V7 smoke) | 16,344 s |
| RSI V7, first launch (crashed, OOM) | `evidence/rsi-v7/crashed-run-v7.{log,err}` | |
| RSI V7, second launch (killed by reboot) | `evidence/rsi-v7/rebooted-run-v7.{log,err}` | level 2 complete + replicate 101 means |
| RSI V7, final (resumed) | `evidence/rsi-v7/run-v7.{json,log,err}`, `run-v7.json.ckpt.json` (trained test libraries + every test row) | |
| M2 distinct | `evidence/m2-identity-retention/bank-2026111{1,2}-n32.json` | |
| Earlier lines (Gen, SELF, C-series, transfer/reset/surprise/lesion) | directories and tarballs under `evidence/` named after each line | `evidence/_spent-seed-registry` lists every spent bank |

## JSON structure (V5–V7)

The `run-v*.json` files contain:

- `config`, and `train`/`valid`/`test` (exact problem definitions);
- `meta[]`: each level-2 proposal, its validation comparison and its
  trained-library summaries;
- `libs{U0, Ustar, UstarNoInv}[]`: each test replicate's full weighted move
  list (`ops: [id, weight, invented]`) and its accepted moves;
- `rows{L0, U0, Ustar, UstarNoInv}[]`: every test row, with the problem,
  search seed, final program, accepted ops, score (discrimination), energy
  and survivors;
- `noSearch[]`, `summary` (the C1/C2/C3 verdicts and all paired
  comparisons), and `log`.

## Docs per version

| Version | Plan | Results |
|---|---|---|
| V1–V3 | (none) | `RSI_SEARCH_RESULTS_V1.md` |
| V4 | `RSI_GUIDED_PLAN_V1.md` | `RSI_GUIDED_RESULTS_V1.md` |
| V5 | `RSI_V5_PLAN.md` | `RSI_V5_RESULTS.md` |
| V6 | `RSI_V6_PLAN.md` | `RSI_V6_RESULTS.md` |
| V7 | `RSI_V7_PLAN.md` | `RSI_V7_RESULTS.md` |

Project-wide progress and history: `docs/PROGRESS.md`, `docs/VISION.md`,
`docs/VISION_MILESTONE_LEDGER_V1.md`, and `git log`.
