# Motor-anchor study — results V1 dev (FROZEN, DEV-NOGO)

Frozen 2026-10-28. Single authorized Phase-D attempt executed once under
`docs/MOTOR_ANCHOR_PLAN_V1.md`. Verdict: **DEV-NOGO**. The line closes with
zero qualification spent (V3 precedent). No Phase Q, no second attempt.

## Execution (frozen record)

- Bank: `evidence/motor-anchor-dev/fresh-01/protocol.json`
  (`fccc7e36…`), 36 unique fresh dev seeds, drawn once, union-excluded from
  all spent banks (v1-fresh, v2-fresh, v3-dev) plus all engineering/fixture
  tokens including the new instrument files.
- Attempt: `evidence/motor-anchor-dev/attempt-01/` — 12 rows (4 histories ×
  3 λ), 12 anchor pairs (atA/atC), `ledger.json`, `dev-results.json`,
  `attempt.json` (bank SHA + 40-file source snapshot), per-row files.
- Ledger (exact, asserted in-run): **72 mains + 156 probes = 228 executions**,
  168,960 world-ticks, 4,055,040 founder-slots, 9,702,658,421 scalar ops
  (cap 90e9). Per-row wall/CPU/byte caps held; sources unchanged end-to-end
  (`motorAnchorDevSources()` deep-equal); snapshot hashes match the frozen
  committed files (audited post-run, all OK).
- Audit: independent recompute from raw `rows/*.json` reproduces all four
  estimands for all three λ to <1e-9 (all OK). Anchors 12/12 present.

## Outcome

| λ | meanAret | meanBret | meanLevel | meanAlign |
|---|---|---|---|---|
| 0 (control) | +0.475 | +0.113 | +4.35 | 0.823 |
| 0.02 | −0.301 | −0.112 | +5.78 | 0.744 |
| 0.08 (best by A-ret) | +0.183 | +0.190 | +3.72 | 0.921 |

Per-history A-ret: control [1.305, 0.432, −0.078, 0.243]; λ=0.02
[0.094, −0.368, −0.471, −0.461] (uniformly worse); λ=0.08
[0.234, 0.376, 0.157, −0.035].
Best-λ Δ vs control: **dA = −0.292** (bar ≥ +0.15: FAIL),
dB = +0.077 (bar ≥ −0.10: pass), **dL = −0.631** (bar ≥ −0.20: FAIL),
alignUp true (0.921 > 0.823: pass — near-definitional, as in V3).
Margin bars: no data (instrument gap, below) → marginOk=false,
threshOk=false (fail-closed). Verdict **DEV-NOGO**, over-determined:
behavioral bars fail with or without the margin conditions.

Unlike V3 (bit-identical energy across λ — sub-threshold null), the actor
anchor moves behavior substantially (level +1.43 at λ=0.02, −0.63 at
λ=0.08; alignment non-monotone: 0.744 / 0.921 vs 0.823) — and moves it the
WRONG way on retention. Directional protection of the actor readout does
not rescue A-retention; at λ=0.08 it costs 0.63 level while still losing
0.29 A-retention.

## Margin-readback instrument gap (D1 unanswered)

The probe-side margin/block collector recorded **zero events in all 12
rows** (`margins:{}` everywhere; sham key likewise absent), so D1 has no
data and the margin bars failed closed. Main-run block logging worked
(102k cruise events). Wiring audited: battery wraps `{probe,event}`,
`runTasteProbe` threads emit to `restore`, `record()` is emit-guarded and
canonical-safe, snapshots confirm the run used the threaded code, probes
were alive (e.g. 10 survivors, value −3.25). The break is therefore
downstream of the runner — most likely probe-mode motor-progress emission
never reaching `run.emit` — and diagnosing it would require stepping
restored spent-bank anchors (extra executions on a spent bank: forbidden)
or new-bank worlds (forbidden in this goal). The gap is preserved here, not
patched around: no rescoring, no re-run. It does not affect the verdict
(behavioral bars fail decisively) but D1 stays open as a question.

## H1m descriptive (D3)

Block-visit logs (candidate mains, all events, pooled 4 histories):
block 1 (contact + saturated prediction) is heavily shared across phases —
e.g. λ=0: A 10,679 / B 10,280 / C 10,028 visits; blocks 0/2 likewise shared.
H1m's shared-block premise is descriptively SUPPORTED, yet protecting the
shared readout's direction still fails behaviorally. The overwrite story is
either wrong about the mechanism (magnitude vs direction) or irrelevant to
the retention loss. Either way, the M-ACTOR line is exhausted: taste-anchor
(V3) null, motor-anchor (here) harmful. Recommended fall-through remains
ELSEWHERE (sensing line: `localResourceSense`-class new sense must first
beat its offline screen per C2), or H2 body-structure follow-up.

## What is spent / preserved

- Spent: the 36-seed dev bank (single use, now union-excluded from all
  future banks). Synthetic fixture seeds 378001–378006 (unit tests, scanned
  via `tests/*.mjs`) and 379001–379009 (probe-emit plumbing check: one
  8-tick synthetic main, 879 emit events, anchor null — recorded here and in
  `SPENT_FIXTURE_SEEDS`, scanned via `scripts/motor-anchor-dev.mjs`).
- Preserved: negatives (this document), raw attempt (out of git, hashed),
  frozen plan, instrument, fixtures. No qual bank drawn, no qual seeds
  touched, nothing tuned.

Cumulative program total: 5128 + 440 + 688 + 228 + 100 + 228 = 6812 worlds
(+1 synthetic fixture main).
