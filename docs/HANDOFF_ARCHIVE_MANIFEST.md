# Handoff disk-triage record (ATTEMPTED AND REVERTED, 2026-10-29)

## What was tried

Archived all 27 handoff topic dirs the same way as the last evidence pass
(`tar -czf` + `gzip -t` + `sha256sum`, `rm -rf` only after verify, manifest
table with orig/archive bytes/sha/entries — 27 rows verified).

## Result: saved 0.1% (5.42G → 5.41G) — REVERTED IN FULL

Reason: the topic dirs are ALREADY verified compressed chunks (each carries
its own `archives/research-evidence.tar.gz.part-*` + `manifest.json` +
`verification.json`; 45 files tracked in git). Re-wrapping compressed splits
in another gzip layer saves nothing and disturbs tracked manifests.
All originals restored (`tar -xzf` of the new archives + `git checkout` of
tracked files; zero pending deletions; sizes match byte-for-byte), new
tarballs deleted. Nothing lost, nothing kept.

## Standing exclusions (kept as-is, verified)

- `handoff/archives/` — tracked split archive + `evidence-manifest.json`
  (already-archived form; never touched).
- `handoff/runtime-snapshot/` (173M) — possibly current-trackable,
  index-referenced; left uncompressed and browsable.
- Top-level `environment.json`, `evidence-manifest.json`, `verification.json`
  — tiny manifests, untouched. Two stray `*.log` files removed (precedent).

## Conclusion for the backlog item

Disk-triage on `handoff/` is CLOSED with no change: the directory is already
optimally packed (verified chunks), and C: headroom must come from elsewhere
or nowhere — the last evidence pass already took the big wins (57G→22G repo,
`evidence/` 47G→15G). C: remains ~96% full (~21G free); do NOT re-attempt
handoff archiving without new information.
