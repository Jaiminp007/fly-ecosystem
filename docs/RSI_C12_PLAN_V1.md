# RSI C12 PLAN V1 (learning-rate revision: the update rule itself) — FROZEN, DESIGN ONLY

Date: 2026-11-02. Status: FROZEN before code. License: new operator
FAMILY (untried) + VISION hook (``it does not yet redesign its
learning algorithm'' — tasteRate IS the update rule; replay gains
are data selection). All C-lines revised replay/skip/shrink/surprise;
none touched the learning rate. First line to propose revising HOW
FAST the agent learns, not what it replays.

## Mechanism story (falsifiable both ways)

Transfer-extinction = unlearn old + learn new on flipped
contingencies. A higher tasteRate accelerates BOTH (bigger live
steps) → faster relearning → higher HB. Counter-story: too-high
rates oscillate/overshoot (worse). The sandbox arbitrates per-agent
(adopts 2.0 iff 5% better on held-out); the transfer test decides
which story holds. Either outcome is informative (rate-helps vs
rate-harms vs rate-irrelevant).

## Design (C5-verbatim EXCEPT menu index 7)

Per chain (H0/H1/H2), same-arm exact transplant + voted op carryover,
proposal tick {1024}, lifetime 1/run, temporal sandbox split,
majority-vote carryover, 2 chains × 10 runs = 20 mains, 0 probes,
flip-split HB scorer, G0/G1/G2a/G2b/G2c/G2d, verdicts C12-*.
- New loop menu index 7 = **{kind:'tasteRate',rate:2.0}** (2× BT
  baseline 1.0; append-only, indices 0-6 untouched, prior lines
  bit-identical; fired only when proposed+adopted).
- `looper-train` proposes op1=**menu 7**; `looper-T1` proposes
  op2=**menu 7** (same operator twice: successive internal adoption
  of faster relearning).
- Static/copier arms + unlearned as in C4–C11 (copier: baseline
  construction + voted `copierMenuIndex`, TRUE dose-match with C7
  regression guard in fixtures).
- Sandbox branch (mirrors replayGain): clone.config.tasteRate =
  operator.rate; replay fitRecs (rate applies in both modes —
  `tasteUpdate` reads `config.tasteRate` up front); held-out error
  as usual; flat V1c fee. Live adoption: config-only (free) —
  no state init needed (unlike surprise; rate is read per-update).
- **G2a**: looper-T1 HB − static-T1 HB ≥ +0.1 AND looper-T2 HB −
  static-T2 HB ≥ +0.1 AND looper-T2 ≥ looper-T1.
- **G2b**: pooled looper HB − pooled copier HB > 0.

## Fixtures (16), bank, caps, attempt discipline

- C5/C11-adapted (menu-7 kind+value assertions (C4 lesson);
  transplant integrity; scorer; bank; caps; dose-match guard) +
  rate-branch fixtures (sandbox sets clone rate + learns; adopt
  sets live config, no state touched, bills 0 extra; C1 bound
  7→8 intent-preserving like C6).
- Fresh-28 bank `evidence/rsi-c12-dev/fresh-28/`, 9-schema, 6×9,
  range **466001–466054**. VERIFIED clean 2026-11-02 (zero hits
  docs/scripts/tests/learning/engine pre-freeze). attempt-01 +
  fresh-28 verified free pre-freeze. Builder re-verifies, post-bank
  refusal, union-excluded (spent through 465xxx + own).
- Caps 20/0/35840/860160/4.0e9/10800s. ONE authorized attempt-01.
- Pre-registered bank-null reading (C9/C10 precedent): zero
  adoptions → NOGO with mechanism intact (bar binds, not breakage).

## What GO/NOGO mean

- GO: faster relearning lifts real transfer (≥2 successive +
  productivity) → RSI CLAIM (first ever if met; bars unmoved).
- NOGO (flat/negative vs static): rate revision doesn't transfer
  (update-rule family joins replay as live-workable but
  transfer-null; the learning-algorithm redesign stays unshown).
- NOGO (static high): ceiling informative.
