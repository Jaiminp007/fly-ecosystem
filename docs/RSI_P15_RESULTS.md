# P15 results: the sip body (FAILED)

The plan, [RSI_P15_PLAN.md](RSI_P15_PLAN.md), was frozen in `1a486fa` before the run. Output: `evidence/p15/run.json` (kept locally). The run took 995 s.

| Arm | Survivors (of 24) | Tastings per founder | Energy |
|---|---|---|---|
| S0 (native body) | 9.31 | 98 | −54.5 |
| SIP (sip + label) | 9.27 | 315 | −54.8 |
| SHAM (sip, no label) | 8.64 | 96 | −55.6 |
| TRUE (reference) | 14.17 | 109 | −46.8 |

| Gate | Result | Pass |
|---|---|---|
| G1: SIP − S0 survivors ≥ 2, p < .01 | −0.04 (sd 0.76), 5/12, p = 0.58 | no |
| G2: SIP − SHAM ≥ 2, p < .01 | +0.64 (sd 0.72), 9/12, p = 0.007 | no (below the size bar) |
| G3: SIP tastings > S0 in ≥ 11/12 | 12/12 | yes |

**P15 fails.**

- **The body change worked mechanically.** It tripled the fly's taste labels.
- **The extra labels did not raise survival.** Against the sham, the labels are worth +0.64 survivors (p = 0.007), but that is far below the +2 bar.
- **Sipping has a cost.** The sips themselves cost about 0.7 survivors, because SHAM is below S0. The information gain cancels that cost.
- **Why more labels don't help:** with single-bit features the learner cannot represent the rule, whatever data it gets. TRUE beats every arm by about +5 with ordinary data. The bottleneck is the representation, not label count. That fits P12, where finding the right features was what paid.

As the plan states, this was the last line, run once with no retuning.
