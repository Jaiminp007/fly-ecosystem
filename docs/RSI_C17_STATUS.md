# RSI C17 STATUS — CLOSED as INVALID 2026-11-02

Line: non-oracle input reassignment (surrogate bank on own beneficial
evidence + retain-or-revert). Frozen: PLAN V1 + Amendment A1.
Fixtures 16/16 green (twice — after fix 2 and fix 3). Triage clean.
Attempt-01: 15/15 mains on fresh bank 472001–472054, 2.46e9 ops.

Verdict: **INVALID** — implementation compared retain counts where the
freeze specifies rates; post-hoc reconstruction shows 4/10
reassignments would have reverted (material). Descriptive numbers
hostile (indexed −0.163, shuffled −0.219, BH flat). See RESULTS V1.

Closure: bank spent (union-exclude 472001–472054 in all future
builders). No re-run under C17 (spent bank + single-attempt rule). A
corrected treatment needs a new line number and a genuinely-new
rationale per the C-bar, not a bugfix. Input-side locus remains open;
no other input-side mechanism is licensed.
