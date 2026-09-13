# Release plan and acceptance criteria

## Published baseline: 1.0.0

A versioned research software release, with tests and limitations. Version numbers
identify reproducible code; they do not certify biological fidelity or production
readiness. Existing measured experiments apply to their recorded engine digest.

## Implemented in 1.1.0: persistence and observability

- [x] Retain rolling full checkpoints, not only the latest autosave.
- [x] Never overwrite a corrupt recovery file with a silently created new world.
- [x] Add per-sex counts, reproductive eligibility and death-cause telemetry.
- [x] Preserve original run evidence and label model changes with a new version.
- [x] Test restart recovery, retention, malformed recovery and extinction behavior.

## Hosted-release gate

- Render Free demo first; persistent hosting remains a separate gate.
- Durable storage, bounded compute and retained checkpoints.
- Public read access separated from authenticated owner controls.
- Server-restart recovery preserving intentional pause and extinction.
- No laptop dependency; verify operation after clients disconnect.
- Browser layout/interaction verification, control authorization tests and backup
  restoration drill before calling deployment production-ready.

## Scientific evaluation gate

Compare descendant and founder performance on held-out habitats across multiple
seeds. Ablate lifetime learning and inheritance/topology growth independently.
Report failures and resource costs. More neurons, survival of a single population,
and a full-connectome execution assay are not intelligence claims.

Completion of these gates defines the initial hosted release. Future research is
open-ended; do not silently run paid workloads or promise unattended development.
