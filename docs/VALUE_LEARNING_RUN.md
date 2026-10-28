# Fixed direct-value study: complete, failed, both audits passed

One fresh protocol was frozen on 2026-10-25 after the complete
[preflight](VALUE_STUDY_PREFLIGHT.md), all 263 tests and independent source/
exclusion/quantile checks. All eight development histories are collected. The
[locked development score failed](VALUE_LEARNING_RESULTS.md): 14/26 comparisons,
10/23 survival guards, 8/8 activity and 6/8 nonempty support. Exact captured replay
has passed all eight histories. Independent numerical reconstruction and the
audit-gated factual description also passed; there is no qualified learner.
Sixteen confirmation histories remain
closed. The complete staged goal remains active and unachieved.

Study: `evidence/value-development/20261025-fixed-v1/`.
Protocol SHA-256:
`17f225fae97b2c43d2fb6fec619022f4b8047611a5506f09e48a208a787663ca`.

The freeze binds 42 captured sources, 74 prior registry inputs, 78 engineering
inputs and 4,427 excluded seeds. There are 288 unique fresh seeds across eight
development and sixteen reserved confirmation histories. Node and Python both
verified the protocol, full source closure and exclusion reconstruction before
any outcome. The source-bound authority reference and all learner constants,
26 comparisons, 23 survival guards, activity/nonempty support, 95% retention,
functional pressure, transfer comparators, prices and budgets remain fixed.

The immutable protocol/sources/reserve/exclusion snapshot is portable under
`handoff/value-development-freeze-20261025/manifest.json`: 242 files in one
chunk, hash- and restore-verified. The separately preserved preflight package
has 151 files in two chunks and is also verified/restored. Collecting tapes
are not included in the immutable freeze snapshot; full outcomes, including
failures/partial evidence, must be packaged after collection/auditing.

The completed data are now separately preserved in
`handoff/value-development-data-20261025/manifest.json` (222 files, 116 chunks),
hash- and full-restore-verified. That immutable data package intentionally
excludes the then-running audit outputs. Final audits/logs/summary/description
are preserved in `handoff/value-development-audits-20261025/manifest.json`, a
linked supplement; do not rebuild or overwrite the data
package. See `VALUE_LEARNING_RESULTS.md` for the exact hash and restore command.

The completed collection used this command; do not rerun the failed bank:

```powershell
node evidence/value-development/20261025-fixed-v1/sources/scripts/value-development.mjs collect evidence/value-development/20261025-fixed-v1 development
```

Its log is `.value-development-collection.log`; completed rows and compressed
factual tapes are under `development/rows/` and `development/numerics/`.
The original one-shot workflow `runs/finish-value-development.ps1` completed
collection, scoring and both scientific audits. Its `.value-development-pipeline.log`
preserves a subsequent PowerShell null-exit-code reporting error. The
result-bound summary was generated directly after verifying both completed
approvals; no scientific audit was repeated. The working workflow now opens
native process handles before waiting, and explicit zero/nonzero child checks
pass. The original captured workflow and separate v2 correction are preserved.
Replay/numeric stdout and stderr use separate
`.value-development-replay.*log` and `.value-development-numeric.*log` files.
It never opens confirmation. These collection/audit/description processes have
finished; do not restart them in response to older pending-status entries.
`development/inference-audit.json` is an additional completed endpoint-only
statistical check using the captured independent functions. It agrees with the
failed score and records additional audit runtime. It is not the required full
`numeric-audit.json`, and neither the reserve nor diagnostic accepts it as one.
The audit-gated description completed through
`runs/describe-value-after-audits.ps1`; its log is
`.value-exposure-description-run.log`. It waited for the verified finishing
process, then ran the captured `observer-tools/describe-value-development.py`.
The description itself requires both successful result-bound audit approvals.
The completed outputs and [interpretation](VALUE_EXPOSURE_DIAGNOSIS.md) are
available; do not start a duplicate description.
Before resuming or retrying, inspect the actual process/session. Do not start
a duplicate collector while one is live. Completed rows can be verified and
skipped; an incomplete existing tape is preserved and cannot be overwritten.
A ceiling failure closes this bank without success or replacement.

`prior-reserve-state-audit.json` separately checks six current development-study
protocols against archived manifest records. All five older failed development
results still match archived bytes, and their eighty reserved histories remain
closed. The active protocol matches its immutable freeze snapshot. This is a
reserve/archive-record cross-check, not another physical or statistical audit.

After all eight rows complete, run the captured scorer exactly once, then full
captured-source replay and independent Python reconstruction. Both audits bind
the exact protocol/results hashes. The read-only factual summary script
`scripts/report-value-development.py` requires both successful audits. No
interim result authorizes parameter changes or early reserve opening.

If any development gate fails, keep the sixteen-history reserve closed and
preserve the whole bank, failures, audits and actual collection/audit runtime.
No tuning, reselection, unchanged rerun, sample extension or bank replacement
is authorized by the protocol. If every development requirement and both audits
pass, only then open its fixed sixteen-history confirmation bank.

Even successful fixed-learner qualification supplies no autonomous revision.
Two persistent autonomous learning-method revisions and improved subsequent
search versus copied-improvement and matched-total-budget controls remain later
requirements. No RSI claim follows this run's initialization or software checks.
