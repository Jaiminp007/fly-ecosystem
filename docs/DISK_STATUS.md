# Disk status: C: full, program footprint clean (standing note)

Date: 2026-11-02. Standing note (not a verdict; revisit only on change).

## Facts (measured, read-only)

- C: 476G total, ~35G free (93% used) as of 2026-11-02 — exogenous
  pressure keeps easing (100% → 97%/18G → 93%/35G). Still watch:
  halt and escalate if any attempt-write ever blocks.
- Program footprint: repo ~26G (`.git` 5.4G + `evidence/` 15G archived
  tarballs + `runs/` 0.4G + `handoff/` 5.5G). Attempt rows are ~1M each.
- The hog is EXOGENOUS (system/other-users; Temp 3.5G of app .tmp files;
  not investigated further — out of scope, risky to touch).
- Nothing in-repo is safe to delete (tarballs = preserved negatives with
  manifest; handoff = observatory record; node_modules = test dependency).

## What is blocked vs not

- BLOCKED: full-suite triage cold-replays (write checkouts outside the
  repo → ENOSPC). Suite-level failures from ENOSPC are environmental,
  not code (recorded per-turn, not chased).
- NOT blocked: fixtures (in-file, green), fresh-bank builds (KBs),
  single attempts (MB-scale rows; attempt-13/14 wrote fine), audits
  (read-only), literature, planning.
- Future lines proceed normally (freeze → implement → fixtures green →
  attempt → verdict). Full-triage redness is recorded as environmental
  until the drive is freed (user/system action, outside program scope).

## Amendment D (2026-11-02, R355 check)

C: 476G, 94% used, 31G free (was 93%/35G at R318 — 4G exogenous
consumption since; evidence 15G stable, .git 5.5G, working tree clean).
No attempt has ever been blocked; attempts/audits/literature proceed
normally. Escalate-if-blocks stands.

## Rule

No evidence deleted for disk space, ever (preservation discipline stands
above convenience). If space ever blocks an ATTEMPT write (rows-scale),
halt and escalate — do not delete, compress live rows, or shrink caps
to fit the disk.
