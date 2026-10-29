# PR #3 merge decision (AUDIT + RECOMMENDATION — NOT merged)

Date: 2026-10-29. Branch: `handoff/afterwing-astra-research-20261024` →
base `main` (assumed; verify on the PR page). 44 commits / 695 new objects
ahead of `origin/handoff/...`; 65 commits / 1986 files / +227k lines vs main.

## What's in it (the whole recent program arc)

Body-transfer V3 (DEV-NOGO) → retention-mechanism R1 → M-ACTOR (DEV-NOGO) →
margin-readback D1-FIX V1–V4 (instrument + acceptance) → M-GATE (DEV-NOGO +
foreign-run quarantines) → S-GATE (DEV-NOGO, symmetric billing) →
WHAT-RETAINS (4 diagnostics, direction closed permanently) → M-ORIGIN
(thrash-and-starve) → M-RELEARN + V1a (ceiling proven, 0-tick relearning) →
M-DISCRIMINATE (gate OPEN, 10-context arena) → F-RISK (choice defect, 8/8) →
VISION_GAP.md + HANDOFF manifest notes. Plus: gate instruments
(marginGateTau, masked apply), fixture tests, dev scripts, all frozen plans,
all RESULTS/STATUS docs, force-added evidence (attempt ledgers/anchors).

## CI/tests status

- CI: none — `.github/workflows/` deleted by program discipline (no CI
  credits policy); verification is local-only by design.
- Tests: last full `npm test` triage GREEN modulo the 6 shifted-pristine
  failures (names match the stashed-pristine baseline exactly, twice
  verified). ZERO engine/test changes since that triage (`git log`
  9f185a5..HEAD on learning/+tests/ = empty) → triage stands as of this doc.
- New fixture suites (margin-gated 7/7, symmetric-gated 4/4, anchor 6/6) all
  green at commit time (see their STATUS docs).

## Risks / notes for the merger

- Push size: ~695 objects incl. force-added evidence (ledgers, anchors,
  quarantine sets) — expect a large push (order 100MB+); do not squash
  (history is the audit trail).
- No code on main is touched except by the documented arc; no migrations,
  no infra changes, no secrets.
- Known environment anomaly (CLI-path shadow running body-transfer-dev,
  quarantined x3, disclosed in M-GATE RESULTS) is NOT part of this diff's
  behavior — no action, informational only.

## Recommendation: APPROVE FOR MERGE — execution gated on explicit sign-off

The stack is the complete, audited record of six closed lines + two licensed
proposals + all instruments and evidence. Nothing in it is half-done: every
line ends in a frozen verdict with its artifacts committed. Merge when ready.

**Do NOT merge in any turn without an explicit user sign-off line in chat.
This doc is the recommendation, not the merge.**
