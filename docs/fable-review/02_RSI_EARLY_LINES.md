# 02. RSI before the taste-program line (2026-10-24 to 2026-11-08)

All of these lines failed or were closed. Each summary is short, and the
source doc has the full record. They share one pattern: an in-agent
propose → evaluate → adopt loop works mechanically, but what it adopts does
not transfer or replicate. Several lines also ended INVALID or void on
procedure.

## Offline algorithm selector (`docs/ALGORITHM_UPGRADE.md`, 2026-10-24)

- An offline selector chose `{kernel: rbf, update: gradient}` for a
  forecast learner from a declared library, then passed a locked fresh-world
  gate.
- Forecast error dropped by 19–21%, p ≈ 1e-5, on 16 seed pairs.
- It was a single bounded choice, with no repeated improvements and no
  embodied benefit.

## Taste "Gen" line (`docs/RSI_TASTE_GEN*_EVAL.md`, `RSI_TASTE_PLAN_AMENDMENT_V2..V35`, `RSI_TASTE_NEGATIVE_SYNTHESIS_V2.md`)

- There were 20 generations and 35 plan amendments, using about 5,128
  worlds.
- The line produced 8 first accepts across 7 sub-lines. Only one sub-line
  (rate-split) reached 2/2 successive accepts, and its search productivity
  was 0/2.
- **Positive by-products:**
  - a qualified continuing embodied learner;
  - the R=4 base was robust across 14 banks;
  - late revisions beat base on level, but "retention detail is the entire
    game".
- **Verdict:** bounded RSI withheld, and the program closed as exhausted.

## RSI-SELF (`docs/RSI_SELF_*`)

- An in-agent proposal loop on the agent's own state.
- Phase C showed +0.21 on 4 histories. Phase D did not replicate it on 8
  (−0.04). The copied arm was bit-identical to fixed, so the substrate is
  saturated.
- Line closed.

## C-series C1–C17 (`docs/RSI_C*_*`, synthesis `RSI_C_SERIES_SYNTHESIS_V1.md` + addenda V1–V6)

- **C1:** the machinery works.
- **C2–C5:** adopted operators change nothing on fresh learning (a real
  null).
- **C6:** surprise-gating gave the nearest miss (+0.10/+0.16 transfer) and
  failed by 0.004.
- **C7/C8:** selection is real, but majority-blind choice beats
  personalized choice.
- **C9/C10:** "barren banks" (nothing adopts), and no in-agent evaluation
  objective predicts transfer.
- **C11–C16:** see the individual docs.
- **C17:** INVALID. It was frozen with a rate rule but implemented with a
  count rule.
- **Composed anatomy:** the loop is a working actuator, but the evaluation
  objective available in-agent is misaligned with transfer.

## Transfer, reset, surprise and lesion (`docs/RSI_TRANSFER_*`, `RSI_RESET_*`, `RSI_SURPRISE_*`, `RSI_LESION_*`)

| Line | Verdict | Detail |
|---|---|---|
| Transfer V1, V1b, V1c | NOGO | Rate dials, then saturation-triggered self-freeze |
| Reset | Void | The loop never adopted |
| Surprise | NOGO | Fired 27 adopts, but transfer was −0.15 and history-dependent |
| Lesion | NOGO | 12 adopts, −0.19 |

In all of these, the never-learner ("unlearned") arm often scored best on
the transfer measure.

## Status at the end of this era

`docs/VISION_COMPLETE_AUDIT_V1.md` (2026-11-08): 8 of 10 VISION items were
settled. M2-distinct and RSI were open, and C-series design work was closed
as "insufficient even if built (non-compounding menu)".
