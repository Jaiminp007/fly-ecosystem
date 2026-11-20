# 05. Methods and code map (for auditing)

## Evaluator: `learning/taste-program-eval.mjs`

- `makeHistories(bankSeed, count)` gives deterministic world histories per
  bank seed.
- `applyValenceRule(run, rule)` decides whether an odor cue is good or bad.
  It supports `{mask, sign}` (a single Walsh term) and
  `{terms:[[mask,coef]...], bias, sign}`:
  - majority rules use bias 0;
  - AND/OR rules use bias ∓(n − 0.5) over single-bit masks.
- `evaluateOne(program, history, world)` runs one embodied world with 24
  flies.
  - It returns `{score, discrimination, alive, energy, survivors,
    termEvidence[16], ...}`.
  - `discrimination` is the balanced per-family P(accept|good) −
    P(accept|bad), averaged.
  - `termEvidence` is the per-Walsh-term correlation with outcomes in the
    flies' own experience. The `evid` move ranking reads it.
- `Pool` runs `evaluateOne` in a set of child processes.
  - Since `312ae3d` it respawns a dead worker and requeues its job (giving up
    after 50 retries).
  - Evaluation is deterministic.
- Taste learner: `learning/odor-routed-taste.mjs`. `tasteCode: 'masks'` uses
  any subset of the 16 Walsh terms. `identity` uses all 16, and `pairwise`
  uses the legacy 11 features.

## Runners

| Version | Script | Notes |
|---|---|---|
| V1 | `scripts/rsi-search.mjs` | fixed dimension/value menu |
| V2/V3 | `scripts/rsi-compose.mjs` | composable codes, odor-chemistry worlds |
| V4 | `scripts/rsi-guided.mjs` | 10 hand-written operators incl. guidedReduce |
| V5 | `scripts/rsi-v5.mjs` | gene library, invention, hill-climb level 2 |
| V6 | `scripts/rsi-v6.mjs` | identity-start training, 8 problems, power/meanGain, coordinate level 2; also `devcheck`/`sharpcheck` modes |
| V7 | `scripts/rsi-v7.mjs` | budget 12, 72 pairs, neighbour level 2, `resume` mode, test checkpoint |

Inside `rsi-v7.mjs`:

| Function | Role |
|---|---|
| `search()` | level-0 hill climb with dev and confirm gates; this is where invention happens |
| `trainLibrary()` | 8 training problems, with `revise()` after each |
| `evalLibrary()` | frozen-library test |
| `weightOf()` | the update rule U |
| `invent()` | single-gene mutation |
| `paired()` / `signTest()` | the statistics |

## Seed banks used

Each version has its own fresh **test** bank. The training and validation
banks, the training seeds 101–103 and U* were all reused from V6 to V7, so
the trained libraries are identical.

| Purpose | Bank seeds |
|---|---|
| Training (V6/V7) | 970101–970108 |
| Validation (V6/V7) | 975101–975104 |
| Dev check | 978001–978004 |
| V5 test | 985001–985008 |
| V6 test | 987001–987008 |
| V7 test | 989001–989008 |
| V4 tests | 990000, 995000 |
| V7 smoke | 990901.. |

Search seed per row = bankSeed·7 + rep·10 + s.

## Statistics

- One-sided sign test over untied pairs; ties are dropped.
- Rows are not fully independent: the 3 search seeds share one trained
  library and one rule, so the effective N is smaller than the pair count.
- Each library is trained once per replicate (seeds 101–103). Library
  quality varies a lot by training seed: in V7, U*'s replicate means were
  0.517 and then 0.467.

## Prior project constraints worth knowing

- **Pre-registration discipline.** Plans are committed before runs. A used
  test bank is never re-scored or re-run. Failures are reported as failures.
- `docs/RSI_C_SERIES_SYNTHESIS_ADDENDUM_V6.md`: "count-rules are
  retention-automatic". Window conventions must be pre-registered.
