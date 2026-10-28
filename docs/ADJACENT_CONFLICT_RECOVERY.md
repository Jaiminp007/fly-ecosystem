# Adjacent-conflict collection recovery

The first collector was stopped after four complete histories when available
disk space fell below 1 GiB. Its per-tape string buffering caused substantial
memory/paging pressure. No evidence was deleted or overwritten: four complete
history rows and the partial fifth history remain in
`evidence/adjacent-conflict-development/20261026-v1`.

The recovery uses the same prespecified histories, task generator, candidate,
controls, prices and probe plan. It hashes and references every artifact of
the four completed histories rather than rerunning or copying them. The partial
fifth history is preserved but recollected in the recovery output, followed by
the three never-completed histories. The replacement collector emits bounded
concatenated gzip members and preserves the exact uncompressed trace hashes;
it changes storage mechanics, not simulated actions. Capture the original
protocol, source hashes, reuse manifest, new sources and recovery provenance.

This is a continuation after some outcomes were visible, not a fresh or
independent sample. Audit both storage locations, all referenced hashes,
decompressed trace hashes, model ancestry, actual credit, costs and replay.
The original benchmark and all qualification gates remain mandatory; no closed
reserve is opened.
