# P1 results: taste skill can matter. Gate PASSED with deterministic taste decisions

> **Correction (2026-11-14, after a second review by Fable 5.2).** The gate
> statistic is inflated. Threshold mode changes three things at once:
>
> - it removes decision noise;
> - it removes exploration, because a taste example exists only when the fly
>   accepts, so a refusal under threshold is permanent;
> - it breaks the bias-only baseline. A bias-only fly then eats everything or
>   nothing. Its survivors drop from 10.50 under sampled decisions to 6.25.
>
> Fairer contrasts from the same rows (threshold, toxin 1, nutrient 1):
>
> | Contrast | Survivors | Energy |
> |---|---|---|
> | Correct (threshold) vs bias (sampled), factorial | +2.1, 12–3 | +5.1, 15–1 |
> | Correct vs identity, factorial | −0.4, 7–8 | +2.9, 12–4 |
> | Correct vs identity, confirmation | −0.1, 11–5 | +4.3, 14–2 |
>
> The replicated finding is that **the correct code beats identity on
> energy**. It is positive on all 8 rules across both banks.
>
> Three claims below are softened:
>
> - "Doubles to triples survival" holds only against the broken baseline.
>   Against a sampled bias-only fly the gain is about +2 survivors.
> - Toxin strength and scarcity interact with the decision rule. Under
>   threshold, toxin 3 removed the effect, and only one level of each was
>   tested.
> - The "correct" code is not a ceiling. On single-term rules identity had
>   higher discrimination.
>
> Also, rules with one quarter good odors (AND+, OR−) are extinction worlds:
> identity had 0 survivors on AND(1,3)+. Threshold mode is a change to the
> fly's decision policy, shared by every arm. It is not a change to the
> world.

Plan: [P1_SKILL_MATTERS_PLAN.md](P1_SKILL_MATTERS_PLAN.md), committed in
`e66c818` before the runs. Evidence: `evidence/p1-skill-matters/
{factorial,confirm}.{json,log}`.

The test suite shows no new failures. The baseline at `d6ae7c5` has 129
failing tests. The current code has 109, all of them also failing at the
baseline. The baseline checkout lacks the gitignored evidence files, which
explains its extra failures. Default behaviour is unchanged: a stored V7
no-search score recomputes identically, to every digit.

## Factorial (dev bank 992001–992004, 16 paired histories, long worlds)

Means are shown as bias-only / identity / correct. "Correct vs bias" is
wins–losses, with one-sided sign-test p.

| Decision | Toxin | Nutrient | Survivors (of 24) | Energy / founder | Correct vs bias, survivors | Correct vs bias, energy |
|---|---|---|---|---|---|---|
| sampled | 1 | 1 | 10.50 / 10.19 / 11.06 | −49.8 / −49.8 / −49.3 | 9–4, p 0.13 | 9–7 |
| sampled | 1 | 0.5 | 7.81 / 7.38 / 7.06 | −59.6 / −59.6 / −59.8 | 4–9 | 6–10 |
| sampled | 3 | 1 | 5.38 / 5.31 / 5.25 | −57.9 / −58.1 / −57.4 | 2–5 | 4–12 |
| sampled | 3 | 0.5 | 3.88 / 4.19 / 3.56 | −62.2 / −62.4 / −62.3 | 4–5 | 6–10 |
| **threshold** | **1** | **1** | **6.25 / 13.06 / 12.63** | **−53.9 / −47.6 / −44.7** | **13–0, p 0.0001** | **14–2, p 0.002** |
| threshold | 1 | 0.5 | 5.00 / 9.13 / 8.88 | −59.4 / −58.8 / −57.3 | 13–3, p 0.011 | 12–4, p 0.038 |
| threshold | 3 | 1 | 4.81 / 7.56 / 8.25 | −55.7 / −54.6 / −52.8 | 8–4 | 7–9 |
| threshold | 3 | 0.5 | 4.38 / 5.31 / 6.69 | −60.6 / −61.5 / −59.9 | 9–4 | 8–8 |

Two settings qualified. The pre-registered rule (largest survivor
difference) selected **threshold, toxin 1, nutrient 1**.

## Confirmation (fresh bank 993001–993004, chosen setting only)

| Code | Survivors | Energy / founder | Discrimination |
|---|---|---|---|
| bias-only | 1.81 | −61.9 | 0.00 |
| identity | 5.88 | −57.5 | 0.30 |
| correct | 5.75 | −53.3 | 0.49 |

- **Correct vs bias-only:** survivors 14–1 (p = 0.0005), energy 15–1
  (p = 0.0003). Both means are higher. **Gate passed.**
- **Identity vs bias-only** (reported, not gated): survivors 9–5, energy
  11–5.
- **Correct vs identity** (reported, not gated): survivors 11–5, though the
  means are about equal (5.75 vs 5.88). Energy is −53.3 vs −57.5.

## What this means

1. **Why skill was "free".** It came from the sampled taste decision. The
   flies ate with probability 0.05 + 0.9·p, so even a perfect learner ate
   bad food and refused good food by chance. Toxin strength and food
   scarcity were not the cause. Making toxins stronger hurt every code
   equally.
2. **With a deterministic decision** (eat if p > 0.5), taste skill roughly
   doubles to triples survival in these long worlds.
3. **Headroom for RSI is in energy, not survivors.** Starting from the
   identity code, the correct code adds about 3–4 energy per founder. It
   adds about 0 survivors on average. So the next RSI objective should be
   energy per founder. A survivor criterion between two searched libraries
   will have little power, and the P2 plan must say so.

The next step is the P2 RSI plan, which needs the user's approval before it
runs.
