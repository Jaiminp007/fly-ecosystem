# Decision after Astra's independent review

Recorded 2026-10-24. The consultation completed in the [existing Astra thread](t3-thread://v1/mcp:1c9455cc-ca9f-4a5b-9ce3-5195a55afb00). [Original brief](ASTRA_REVIEW_BRIEF.md) · [Complete response](ASTRA_REVIEW_RESPONSE.md).

## Evidence and correction

Astra reviewed source and archived results read-only; it did not run simulations or rerun the complete audits. Root checked the archived overlap artifact rows: 3,024/3,584 later-task examples duplicate the earlier task in the migration bank (84.375%), and 2,950/3,584 in the recursive target bank (82.310267857%). Both sequences contain at most 224 examples per learner against capacity 256. Explicit post-hoc corrections now appear in ALGORITHM_UPGRADE.md, RECURSIVE_SEARCH.md and AUTONOMY_PROGRESS.md. Original protocols, numerical results and acceptance decisions are preserved. These tests do not demonstrate sustained retention under distinct-task interference or memory pressure.

Astra also reports little demonstrated selector headroom, a short-versus-long action-horizon mismatch, and limited per-agent propensity-weighted support. Its additional calculations are preserved with attribution in the complete response; they are not root-independent physical replays.

## Adopted direction

1. Defer the large IPW/DR qualification study and further unchanged kernel-menu searches. Keep the tested estimator and policy-recovery code as offline research tools.
2. Prepare one bounded intervention study comparing behavior-selected and independently randomized action labels on the same checkpoint distribution, with a separate privileged paired-outcome reference. Compare current observations with permitted own-history features, and eight-tick with 256-tick outcomes. Terminal outcomes must remain in the denominator. Fork labels support diagnosis, not claims of deployed own-experience learning.
3. Qualify an actual learner controlling its body on continuous, distinct A→B→C tasks with a return to A. Impose memory pressure within the existing lifetime. Include frozen-acquisition, acquired-reset, incumbent, fixed-action and reactive controls; specify per-skill and survival noninferiority margins before results. Account explicitly for matrix storage, inference, updating and migration.
4. Build persistent algorithm and improvement-procedure state across generations. At an accepted revision, copy the same improved learner and accumulated facts to a comparison branch, then vary only the improvement procedure. Measure subsequent retained embodied improvement per total budget against that branch and fixed/static/random search. Require at least two successive accepted revisions and a causally attributable search-productivity advantage before claiming bounded RSI.

## Before any new performance run

Freeze the exact assignment mechanism, feature histories, death/terminal scoring, endpoint, candidate selection, multiplicity control, independent inference unit, storage/compute accounting and fresh-seed registry. Separate development, acceptance and final task families; acceptance feedback cannot be repeatedly reused as fresh evidence.

Astra's numerical budgets are proposals, not measured runtime or a locked protocol. The proposed multi-arm recursive campaign needs a concrete conversion from cheap screens to whole-sequence evaluation equivalents before its total cap is meaningful. No performance run is authorized by a passing software test, and no new scientific performance run has started as part of this consultation.

The next implementation target is the intervention protocol and collector. RSI remains unachieved. Architectural changes and larger experiments remain hypotheses until their declared controls and gates pass.
