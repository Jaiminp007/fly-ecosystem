# Embodied-kernel track scoping V1 (DESIGN, not frozen — no bank, no code, no worlds)

Follows `docs/EMBODIED_KERNEL_FEASIBILITY_V1.md` (INFEASIBLE-AS-PORT).
This doc scopes what a feasible new-track attempt would contain. Scoping
precedes freezing; nothing here is authorized (no plan, no bank, no run).

## Goal (from ALGORITHM_UPGRADE "Next goal requirements")

Test a kernel-based learner for better PHYSICAL choices (action quality /
survival) in a live fly, qualified on fresh worlds. The accepted
RBF-gradient revision proved forecasting; embodiment is unproven.

## Non-goals

- Replace tick-AC wholesale (too big; destroys the measured baseline).
- Port RBF as-is (infeasible per feasibility V1: 6 mismatches).
- Any claim before a frozen plan + fresh bank + single attempt.

## Candidate A: kernel-critic hybrid (recommended for first freeze)

- Keep the actor (4 logits, tick-AC-exact). Replace the critic scalar
  with a kernel prediction of return, trained on the fly's own
  TD-errors / Monte-Carlo returns (forecasting, but OF control-relevant
  quantities — the category bridge).
- Projection 33 tick features → ≤20 kernel dims (|v|≤1 enforced by
  construction: fixed random projection with clamping, frozen constants,
  billed). Projection choice is new behavior — must be frozen, not tuned.
- Records: the fly's own transitions, bounded 256, evict-oldest (same
  capacity class as the accepted learner). Update cadence TBD (every tick
  O(256×20)=5120 coordinate-products may exceed per-tick budget —
  analytic bound first, then sub-sample (every-N-ticks) if needed.
- Transplant rule (flagged, V1b precedent applied): coefficients carried
  (like weights), records CLEARED (like replay buffers — refill from the
  test world within ~40 ticks). Records are experience, not model.
- Null-default: kernel-off ≡ tick-AC bit-identical (new flag default off;
  golden tests untouched when off — the null-default discipline).

## Candidate B: kernel-as-advisor (parked, larger)

- Kernel predicts intake/return; actor takes it as a 34th input.
  Changes TICK_AC_PARAMETERS (golden breakage) → new learner variant,
  larger schema migration. Parked unless A fails for cause.

## Gate sketch (for the future frozen plan, not binding here)

(a) Embodied superiority vs tick-AC baseline on a fresh bank (turn|harm
or survival — metric TBD at freeze); (b) cost within caps (per-tick +
aggregate, billed); (c) null-hygiene (kernel-off = baseline exactly);
(d) single attempt, redone[] expected, repair only result-independent.

## Budget class

New-track build ≈ V1-scale (instrument + 10-13 fixtures + triage +
fresh bank + 12-18-main attempt). Worlds only when frozen.

## Status

SCOPING (thinking, not freezing). Next: freeze Track-K1 (candidate A,
minimal) after this sits — NOT this turn (freeze-after-think; the
scoping must survive a night before it becomes a plan).
