# SHORTCUT AUDIT V1 (rule learned, shortcut rejected, read-only)

Date: 2026-11-02. Zero worlds. Reads frozen C2–C15 train rows
(82 rows, all evaluating/static arms; unlearned excluded).
Tests R353/Wei's shortcut lens against the extinction lens:
did agents ever learn the RULE, or only cue→action shortcuts?

## Result: rule learning is overwhelming (pooled)

- Harmful-labeled cues: mean turn|contact = **0.866** (n=492).
- Beneficial-labeled cues: mean turn|contact = **0.049** (n=492).
- Separation 0.82 — behavior tracks LABELS, not cues, on every
  line's train legs. Agents learn the valence rule cleanly.

## Reading

1. **Shortcut ("never learned the rule") REJECTED.** If transfer
   failure were shortcut-reliance, train behavior would
   concentrate on cues regardless of label. It doesn't — not
   close (0.87 vs 0.05).
2. **Extinction failure CONFIRMED twice over.** Rule learned
   (here) + not unlearned on flip (HB 0.3–0.6; direction
   exclusivity; adoption-decline tracking the wound). The wound
   is pure failure-to-unlearn, not failure-to-learn and not
   shortcut-dependence — within what this test can see.
3. **Scope of the rejection (honest):** this rejects the strong
   shortcut story (no rule). A subtler variant — cue-specific
   thresholds modulating a learned rule — is NOT tested here
   (needs per-cue threshold estimation, unrecorded). The lens is
   narrowed, not fully closed.

No verdict moves (lens adjudication, not a line).
