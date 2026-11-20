# MATING-FAILURE diagnostic plan V1 (FROZEN, read-only, zero new worlds)

Status: FROZEN 2026-10-26 (date convention: 2026-10-30). No code changes, no
bank, no worlds, no rescoring under this plan. Verdict only.

## Why

M-POP (3 mains) + feasibility probe (4 mains): 0 births everywhere despite
maxE 71.49 ≥ 65 (mating energy bar). Population track closed
INFEASIBLE-BEHAVIORAL — but the mechanism was never traced. The engine
reproduction loop (`engine.mjs`, per-tick) demands ALL of, simultaneously:
world `reproduction:true`; female (sex 0) + male (sex 1) within 26 units;
BOTH energy ≥ 65, age ≥ maturity, cooldown ≤ 0; BOTH with
`actions.get(id)[3] > 0` (a deliberate action channel); population below cap.
The energy bar was demonstrably cleared (71.49); everything else is
unexamined. In particular it is UNKNOWN whether BT actuation can ever emit
action-channel 3 — if not, the failure is structural (can't), not
behavioral (won't), and the fix direction is actuation, not motivation.

## Questions (pre-registered; answered from frozen artifacts only)

- Q0 (decisive, code trace): agent output → experiment action mapping →
  engine action vector. Under BT TasteExperiment actuation
  (`controller:'episodic-actor'`, `actuator:'move'`), can action-channel 3
  ever be > 0? Trace the exact path; quote the mapping code.
- Q1 (endpoints, descriptive): across the 7 mating-track mains (M-POP
  attempt rows + feasibility rows): survivors distribution, maxEnergy
  distribution, founderCount. Was a mating-capable pair ever plausibly
  co-alive? (Cannot assess proximity — rows lack positions; recorded as a
  hard limit, not worked around.)
- Q2 (conditional): IF Q0 says reachable — what drives channel 3 (which
  agent output / controller path), and is there evidence it ever fired
  (endpoint counters, event logs in rows if present)? IF Q0 says
  unreachable — specify the MINIMAL actuation change that would allow it
  (design sketch only, no implementation, no new line started here).

## Verdict classes (fail-closed)

- STRUCTURAL: channel 3 unreachable under BT actuation → mating impossible
  regardless of energy/proximity; fix direction is actuation plumbing.
  Licenses PROPOSING an actuation line (fresh plan + fresh bank + fresh
  goal), never starting one here.
- OPPORTUNITY: channel reachable but endpoints/events show the joint
  conditions never co-occurred → fix direction is behavior/opportunity.
  Licenses PROPOSING an opportunity line under the same constraints.
- INCONCLUSIVE: frozen artifacts cannot discriminate (e.g., no position or
  action-channel logs anywhere) → records exactly what instrumentation a
  future observation run would need; licenses PROPOSING an instrumented
  observation run (fresh plan, minimal worlds, no intervention).

No verdict may claim births achievable, no verdict re-opens M-POP or the
feasibility conclusion, no verdict spends worlds. The diagnostic is
adjudication, not resurrection.

## Corpus (frozen, read-only)

- `learning/taste-experiment.mjs` step/action mapping; `engine.mjs`
  reproduction loop + action channels; controller/actuator plumbing
  (`learning/episodic-actor.mjs`, `learning/behavior-policy.mjs` as needed).
- `evidence/m-pop-dev/attempt-01/rows/*.json` (3 mains),
  `evidence/feasibility-probe/*/rows/*.json` (4 mains): endpoints only.
- Zero new executions; zero file modifications; values read, never altered.
