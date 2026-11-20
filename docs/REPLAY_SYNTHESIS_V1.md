# REPLAY SYNTHESIS V1 (measurement, zero worlds)

Date: 2026-11-02. Analytic only: reads frozen verdicts/ledgers of V1f–V1i
(attempts 06–09), DAMAGE-GATE (attempt-11), THREAT-SIM (attempt-01);
no rescoring, no new worlds. Cross-line reading (pooled-V1 precedent).

## The four replay interventions

| Line | Selection rule | Target | Lift | Verdict |
|---|---|---|---|---|
| V1f–V1i surprise | high-error records | HB extinction | +0.04–0.16 (gain-only +0.104, repl +0.134, E1 +0.163) | GO (deployed) |
| DAMAGE damage | harmful records | BH acquisition | +0.015 | NOGO |
| THREAT threat | harmful-intake records | BH acquisition | +0.004 | NOGO |
| (damage-line comparator) surprise | high-error records | BH acquisition | +0.025 | flat |

## Principle: information selects useful replay; valence doesn't

- Replay AMPLIFIES; its value = live-insufficiency × informativeness.
- **Acquisition (BH) is live-sufficient.** Harmful outcomes produce large
  live prediction errors → big live steps; replaying harmful records
  (threat/damage, engaged — harmShare 0.31, 2841 boosts fired) adds
  ~0.000–0.025 regardless of selection rule. Live already did the work.
- **Extinction (HB) is live-insufficient.** The avoidance policy is
  PRESERVED (strong prior, 0.95 same-val retention); live errors on
  flipped cues update against the preserved prior slowly. Surprise-
  selected replay AMPLIFICATION breaks the preservation (+0.13).
  Threat-in-transfer (valence for extinction) was never tested —
  explicitly open, not implied.
- Surprise works for extinction because it selects HIGH-ERROR records
  (informative), not because surprise is special: the damage-line
  surprise comparator on ACQUISITION is flat (+0.025). Same rule,
  different sufficiency → different outcome. The interaction is
  rule × direction, not rule alone.

## Standing

Replay's program role is settled: deploy surprise-gating for extinction
(V1i E1, sustained); do not gate replay for acquisition (three inert
lines: damage, threat, surprise-comparator). No further replay lines
licensed without new rationale (untested: threat-in-transfer for
extinction — would need its own frozen plan + fresh bank; not claimed
here). No RSI implication beyond the closed lines.
