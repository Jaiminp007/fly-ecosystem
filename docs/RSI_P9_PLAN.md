# RSI P9 plan: level 2 over a space that includes the invention operator (frozen before the run)

Level 2 has failed twice: P6 (p = 0.082) and P6b (p = 0.144). P6 and P6b stay recorded as failures.

Its update-rule space U = {N0, rho, credit, explore} only shapes training statistics. Diagnosis on non-bank exploration seeds (94000–94159, 95000–95005), in the calibrated P8 surrogate:

- **Library outcomes split into two groups.** Libraries either invent "extend by evidence" and score about 29, or they don't and score about 10. Under U0, 12 of 16 libraries found it.
- **What limits discovery is the invention operator,** which mutates one gene of the single best move. Two variants change that:
  - mutating two genes found it in 16 of 16 libraries;
  - sampling the parent by Thompson, with rho 0.5, also found it in 16 of 16.
- **The accept-rule variants** (wins ≥ 3/5, no confirmation) moved means by 1–4 points. That is within library-to-library noise, so they are not added.

P9 therefore extends U with two opt-in invention genes. They are null-default: with them unset, the library code reproduces the P6–P8 results exactly (checked).

- `inventParent`: `best` (default) or `sample`.
- `inventGenes`: 1 (default) or 2.

The space was extended after this diagnosis, so the designer knows good options exist in it. What P9 tests is whether **the system's own level-2 search**, using only its own validation data, picks a revision that then beats U0 on fresh libraries and an unseen rule family.

## Setting

- **Surrogate.** The calibrated surrogate from P8: `TASK = {odors 85, encounters 40, noise .07}`.

## Stage 1: level 2 (hill climber over U)

- **Space.** U_SPACE ∪ {inventParent: [best, sample], inventGenes: [1, 2]}.
- **Start.** U0, with the defaults best and 1.
- **Scoring a candidate U.** It trains 12 libraries. Library k uses rules 1501000+10k+i (i = 0..5) and training seed k. Each library is scored frozen on 6 staircase validation rules, seeds 1502001–1502006.
- **Proposals.** 8 of them. Each changes one gene to a different value, drawn with rng 1503001, and skips settings already seen.
- **Accept rule.** A proposal is accepted if its mean validation score is higher than the incumbent's and it has more per-library wins than losses (paired by k). The final incumbent is U*.

## Stage 2: test (frozen U*)

- **Libraries.** 32 fresh libraries. Library k trains on 6 staircase rules, seeds 1505000+10k+i, training seed k. It is trained twice, once with U* and once with U0.
- **Test rules.** 12 unseen "pairs" rules, seeds 1504001–1504012, scored frozen.
- **Unit.** Each library gives one difference: mean U* score − mean U0 score.
- **Statistic.** A one-sided sign-flip test, Monte Carlo with 200,000 draws at seed 1504999.
- **Pass (L2).** U* ≠ U0, mean > 0, and p < 0.05.
- **Reported, not gated.**
  - whether U* changed an invention gene;
  - the discovery rate: top term move is extend/evid/* under U* and under U0.

## How results will be described

- **If L2 passes:** a fixed level-2 hill climber revised the system's own improvement rule (here, its move-invention operator). The revision replicated on fresh libraries and on an unseen rule family, in the calibrated surrogate. With P5, P6 (C2, C3) and P8, each RSI part is then supported in at least one pre-registered test. They are supported across experiments, not jointly in one.
- **If L2 fails:** level 2 stays not shown.

Smoke runs use seeds offset by +500. Runner: `scripts/rsi-p9.mjs`. Outputs: `evidence/rsi-p9/level2.json` and `test.json`.
