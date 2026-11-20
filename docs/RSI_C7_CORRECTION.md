# RSI C7 CORRECTION — implementation deviation (dose-matching NOT executed)

Date: 2026-11-02 (found during C8 implementation review). The C7 plan
specified: ``copier auto-applies the voted op @1024 blind (same tick)''.
The C7 instrument did NOT do this: copier steps passed
`opConfig(op)` as construction options with `menuIndex=undefined`,
so `copierMenuIndex` was never set and the @1024 fire never ran —
C7's copier was full-dose-from-tick-0 (the C6 design repeated), not
dose-matched. The experiment's copier fire path (built for C7) was
therefore NEVER EXERCISED by C7's bank run (only its false branch).

## What changes

- C7 RESULTS' claim ``Dose-matching WORKED (C6's −0.03 → +0.0001)''
  is WITHDRAWN. The gap closed for other reasons (bank variance /
  noise around a small-or-zero gap), not by design. C7 tested the
  SAME confounded comparison as C6 (full-dose blind vs half-dose
  selected) and got identity.
- C7's verdict (NOGO) STANDS: G2a failed as written regardless
  (lift2 +0.061, T2 decline); G2b's +0.0001 is now read as
  full-vs-half-dose identity, even less informative than published.
- C8 is therefore the FIRST true dose-matched test (copier gets
  baseline construction + voted `copierMenuIndex`; no construction
  op). C8's fixtures gate the fire path the C7 line never exercised
  (exported `fireTickProposal` + routing fixture).
- No rescore, no re-run (C7 bank spent, line CLOSED). Single-attempt
  discipline preserved; the error is owned here, not hidden.

## Standing

- The C6 dose-monotone story is DOWNGRADED to bank-noise hypothesis
  (C7's identical-dose... rather identical-RESULT under the same
  confounded design shows the −0.03 was not a stable dose effect).
- C8's G2b is now the only licensed dose-matched reading.
- Cumulative unchanged (correction is analytic, zero worlds).
