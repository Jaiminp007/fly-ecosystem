# Development reset-probe V3 verdict (2026-11-03)

## Authorization
User-authorized single bounded world run (disk floor 1 GB; 5G before and
after; output 6.0M). Frozen plan `docs/DEVELOPMENT_RESET_PROBE_V3_PLAN.md`:
replicate the V2 comparison on the next two unspent histories (4–5) of the
same audited bank. Fixtures 32/32 green pre-run. Single attempt, as measured.

## Results, histories 4–5 (candidate − arm; positive = candidate wins)
- Sequence vs unlearned: [+0.249, +0.206], mean +0.228, 2/2, survivors +3.
  developmentSignal TRUE.
- Probe acquiredA: [+1.820, +0.234], 2/2.
- vs frozen: [+0.162, +0.234], mean +0.198, 2/2, survivors 0.
- vs reset: [+0.574, +0.132], mean +0.353, 2/2, survivors +1.
- extendedDevelopmentSignal TRUE (this run's frozen criteria met).
- Retention A/B descriptive95Percent FALSE/FALSE; transfer 0/2 (mean −0.50).

## Verdict: frozen V3 criteria MET — but the cross-run pattern is INCONSISTENT
Histories 2–3 (V2): continued learning LOSES to frozen 2/2 (mean −0.41,
survivors −5), reset mixed 1/2. Histories 4–5 (V3): candidate BEATS frozen
2/2 (+0.198) and reset 2/2 (+0.353). Combined over 4 histories: vs frozen
2/4 (mean −0.107), vs reset 3/4 (mean +0.051). The replication did NOT
confirm the V2 pattern — the effect is history-dependent, not a stable
lifetime-learning benefit. Criterion 1 remains UNSATISFIED as a general
claim at development scale; the probe-memory effect (acquiredA 4/4 across V2+V3)
persists while the sequence-level benefit flips sign by history. No milestone
changes. No RSI claimed. Development-grade only (qualified:false).

## Preservation
`evidence/taste-development/dev-reset-probe-03/` (untracked raw evidence;
same audited bank, histories 4–5 now spent for this question).
