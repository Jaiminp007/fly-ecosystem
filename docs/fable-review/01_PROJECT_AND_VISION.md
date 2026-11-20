# 01. Project and vision status

## What the project is

`fly-ecosystem` (Afterwing) is a Node (ESM) artificial-life sandbox. It
contains:

- simulated flies with bodies, senses, energy and death;
- a compact learned controller, plus a separate MaleCNS connectome runtime
  (a distinct model track);
- odor/taste worlds, where flies learn which odor cues mean food (good) or
  harm (bad);
- an observatory/dashboard;
- a long series of pre-registered experiments. There are about 1,980
  commits, almost all of them experiment plans, runners and verdicts.

The long-term goal is in [`docs/VISION.md`](../VISION.md). Its central open
item is **recursive self-improvement (RSI)**: an agent proposes and
evaluates changes to its own learning or decision system, and gets better
at improving.

## Milestone status (as of 2026-11-13)

| Milestone | Status | Main evidence |
|---|---|---|
| M1: lifetime benefit on held-out tasks; the benefit is lost under memory reset | Met, and replicated on 9+ fresh banks | `docs/VISION_M1_VERDICT.md`, `docs/VISION_STANDING_RECHECK_V*.md` |
| M2: persistent adaptation within a task (changing codebooks) | Met | `docs/VISION_M2_VERDICT.md` |
| M2: persistent adaptation across distinct tasks | Met for the odor-taste skill | `docs/M2_DISTINCT_RESULTS_V1.md` |
| M3: bounded, checkpointable controller-change proposals | Met | `docs/VISION_M3_VERDICT.md`, `docs/RSI_SEARCH_RESULTS_V1.md` |
| M4: richer bodies only after simpler models are explained | Gate correctly shut (body transfer failed) | `docs/BODY_TRANSFER_RESULTS_V*.md`, `docs/VISION_M4_POSITION.md` |
| M5: population, social and cultural studies with controls | Met as studies, with stated bounds | `docs/VISION_M5_VERDICT.md` + addendum |
| Observatory and separate model tracks | Met | `docs/VISION_OBSERVATORY_VERDICT.md` |
| **RSI** | **Not met** | Docs 02–04 in this folder |

Details on two rows:

- **M2 across distinct tasks.** The orthogonal Walsh "identity" taste code
  keeps 104–109% of earlier tasks' skill, against 84–93% for the old
  pairwise code, on two banks of 32 histories. Survival is unchanged.
- **M3.** Proposals are evaluated on fresh worlds, under budgets.

Human-like cognition, planetary worlds and long-run societies are stated
aspirations. No experiment claims them.

## History of the RSI claim (important for judging)

- Up to 2026-11-08, RSI was withheld after a very long negative program. See
  doc 02.
- 2026-11-11 to 11-12: the taste-program search line produced V1–V4. V4
  passed its own pre-registered gate, and VISION was briefly marked "RSI
  met".
- The user challenged this. V4's moves were hand-written, its update rule
  was fixed, and it was tested only within one world family. The RSI row
  was reverted to "Not met", and three stronger criteria were set:
  - **C1:** the update rule itself is revised, and the revision helps.
  - **C2:** the system generates new kinds of change (moves it invents), and
    they help.
  - **C3:** the gain carries over to an unseen world family.
- V5, V6 and V7 test exactly these three criteria. V5 failed all three. V6
  passed C2 and C3 but missed C1. V7: see doc 04.
