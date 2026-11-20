# MATE-ACT results — Phase V1 NOGO (no qualified co-location; actuation exonerated)

Frozen: `docs/MATE_ACT_PLAN_V1.md`. Single authorized attempt: 8 mains
(2 arms × 4 histories, fresh bank 401001–401036), 0 probes. No crashes,
no resume (`redone: []`).

## Verdict: MATE-ACT-NOGO (pre-registered branch, executed exactly)

- G1 integrity ✓: 8/8 mains complete; ledger exact
  (8/0/14336/344064/1.35e9); `redone` empty; endpoints carry survivors.
- G2 audit ✓: all rows carry the correct flag per arm; all birth counts
  are integers ≥ 0.
- G3 outcome: decoupled total **0**, control total **0** → NOGO
  ("zero decoupled births — no qualified co-location (opportunity lack),
  not actuation"). Control-zero replicates the structural block live
  (channel 3 never fires, as diagnosed); decoupled-zero tests the
  opportunity question and answers it: no qualifying pair ever co-occurred.
- No INVALID (control never birthed — the diagnostic premise holds).

## What this decides (and what it rules out)

ELIMINATED as explanations, by read-only audit of frozen code + artifacts:
- Actuation (this line's target): the flag correctly removes the only
  agent-dependent gate; remaining conditions are proximity/energy/age/
  cooldown/sex/capacity. Straight-line code downstream would fire
  deterministically on a qualified pair — no crash, no skip path.
- Sex/age/cooldown gates: founders are mixed-sex (`i%2`), maturity is
  18–28 ticks (negligible), cooldowns start 0. None can block.
- Energy: founders start AT 65 and feasibility showed 71.5 — achievable.
- Behavior confound: decoupled and intact rows are BIT-IDENTICAL per seed
  (same survivors, same level to 0.1) — the flag is behaviorally neutral
  when no mating occurs (matches the null-default fixture). The runs are
  otherwise healthy BT mains (levels −57 to −61, normal).

REMAINING: proximity. Two flies ≥65, mature, cooled-down, opposite-sex,
within 26 units, same tick — never co-occurred in 8 mains. The
encounter-rate analysis (queued, zero new worlds) will quantify whether
this is expected from diffusion in 1000×640 with ~24 aging flies; the
snowflake-yeast precedent already points at density as the binding
constraint, not behavior.

## Program consequence

The actuation fix is proven CORRECT (gate removed cleanly, null-safe) but
INCONSEQUENTIAL in BT: Avida-decoupled mating in a sparse, short-lived
population yields zero encounters. The follow-up is NOT more actuation —
it is density/ecology (more flies, smaller world, longer-lived, or
attractant-mediated co-location) and/or the queued inheritance design
(newborns currently get zeroed weights — even a birth would not transmit
anything). Nothing here claims population viability, learning effects, or
RSI. The structural diagnostic (MATING-DIAG) stands reinforced: the block
was real, the fix is real, and the ecology has no matings to unlock.

## Standing rule applied

Bank fixture converted to rebuild-refusal guard post-spend (sixth
instance). Triage: 6 pristine failures only.

## Cumulative: 7491 + 8 = 7499 (all ledgered, zero duplicates)
