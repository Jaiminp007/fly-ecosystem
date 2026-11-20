# VOTE-TALLY PRE-REGISTRATION V1 (JURY prescription, executed)

Executes the JURY_AUDIT_V1 prescription (effective-jury-size
vote-tally pre-registration). Zero worlds. This doc binds future
syntheses: how per-line/per-bank verdicts aggregate into
program-level claims. Violations require a new pre-registration
(supersedes, never edits, this one).

## Rules (frozen)

- **R1 unit of vote.** One vote per (line, bank) terminal
  verdict. Seeds within a bank do NOT vote separately
  (correlated draws, shared codebook family). Arms within a
  line do NOT vote separately (same bank, same run).
- **R2 terminal verdicts only.** Superseded verdicts don't
  vote (V1b's GO retired by V1c's pooled NOGO — one vote:
  NOGO. V1g/V1h intermediate GOs don't vote separately from
  the line's terminal verdict). Each line casts exactly one
  vote per bank it ran, at its terminal verdict.
- **R3 floors count once.** JURY finding (11 floors, N_eff=1):
  floor-censored observations (unlearned flat, dead arms,
  void metrics) enter tallies as a single N_eff=1 block,
  never per-occurrence. Eleven zeros are one zero.
- **R4 dependence discount.** Votes sharing a mechanism
  (gain arms across TURN-GATE lines; maternal arms across
  mating lines) are reported BOTH raw and mechanism-pooled;
  program-level claims use the pooled count (κ+0.11 says
  nominal independence overstates evidence ~11%).
- **R5 pre-registered questions only.** A tally answers the
  question frozen BEFORE the votes existed. Post-hoc tallies
  ("how many GOs total?") are descriptive illustrations,
  never evidence (filed with the map, not the ledger).
- **R6 symmetric franchise.** GO and NOGO/INVALID/INCOMPLETE
  vote identically (one terminal verdict, one vote). No
  weighting by outcome (winners don't count double; nulls
  are not abstentions).

## Standing tally (illustrative, per R5 — not evidence)

Terminal line verdicts to date (selected): TURN-GATE GO;
V1b GO-V1B→V1c NOGO-V1C (1 vote: NOGO); V1f–V1i GO×5
(deployed gain); V1j GO (lossy); DAMAGE NOGO; M-POP V2
INVALID; MATE-WINDOW INCOMPLETE; SOCIAL V2 NOGO; etc.
No program-level inference is drawn here (that requires a
pre-registered question + R1–R6 application, separately).

## Status

- Prescription discharged. Binds all future syntheses.
- Amendments (if needed) as V2 (supersede, never edit).
