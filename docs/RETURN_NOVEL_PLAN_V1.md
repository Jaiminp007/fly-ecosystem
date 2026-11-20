# RETURN-NOVEL PLAN V1 (FROZEN 2026-11-04 — single authorized bounded run)

## Question
Take the intact A→B→C-trained agent and return it to a NOVEL task-A
layout (fresh world — new positions, full food, no shared history), live.
Does the return-A benefit persist (general skill) or vanish (old-world
familiarity)? Against unlearned in the same fresh world.

## Why this test (V1b's prediction, untested cell)
- V1b decomposed the joint benefit as +trajectory-familiarity
  −weight-harm +store-null (deterministic matching). Prediction: remove
  the familiar world → familiarity gone, weight-harm remains → intact
  should do WORSE than naive on a fresh layout (or tie). If instead
  intact > naive persists, V1b's familiarity account is wrong and the
  benefit is portable skill.
- Not retention-during (that was FROZEN transplant → naive ceiling;
  this is LIVE to match backward's live return-A measure, learning on
  for both arms). Not V1-transfer (different train: backward A/B/C to
  1536, not full foraging; different probe: 256-tick A-mapping, not
  1792 transfer). Not backward (different world: fresh, not continuous).
  The combination (backward-train → fresh-live-A-probe) is unscored.
- Pre-registered reading rules out the ceiling cop-out: BOTH arms run
  live on the SAME fresh probe history (matched layout/richness), so any
  gap is weights, not world. Naive learns live (M-RELEARN), so a tie
  means weights add nothing (familiarity), not that the probe is broken.

## Design (4 histories: 2 train + 2 probe; 4 mains + 4 probes per... total)
- Per pair: train history H (backward full run, candidate intact +
  unlearned, 1792; snapshot weights at 1536 pre-return; retA rate for
  guard) + probe history P (novel A layout: fresh run transplanting
  intact-1536 weights, LIVE, advance 256; + fresh naive run, LIVE,
  advance 256, same P).
- Metric: 256-tick live food rate on P (endpoint totals diff? No —
  fresh run, totals from 0: rate = food/256; same as backward retA
  construction on a fresh world). Guard: in-world retA intact > naive
  ×1.1 else INCOMPLETE-NOBENEFIT (void — nothing to test; bank-dependence
  disclosed since fresh-12).
- Ledger: 4 mains (backward full runs) + 4 probes (256-tick fresh
  worlds: 2 transplanted + 2 naive). Caps: BT. Single attempt.
- Bank: fresh-13, 474199–474234 (36 seeds: pair = train + probe),
  minted post-fixtures, verified clean. No triage runs (justified: all
  ops verbatim precedents — snapshot/transplant/live-probe; fixtures
  cover scorer + bank + transplant round-trip).
- Verdict (pooled n=2, margin 1.1): GO (`RETURN-NOVEL-GO-V1`) iff fresh
  probe intact > fresh probe naive ×1.1 (portable skill, not
  familiarity). Else NOGO (`RETURN-NOVEL-NOGO-V1`) — benefit is
  old-world familiarity (V1b confirmed). No transfer/RSI/population claim.
