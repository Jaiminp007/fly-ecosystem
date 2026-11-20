# RSI C4 RESULTS V1 — C4-INVALID-IMPLEMENTATION (real data, wrong operators)

Date: 2026-11-02. Attempt-01 (single authorized): 20/0/35840/860160/
3.282e9, `redone: []`, caps respected (4.0e9/10800s). Bank fresh-20
(458001–458054) SPENT. No incident in the second launch (first launch
died pre-transplant on a digest-form bug — digest taken over learner
objects instead of weight snapshots; result-independent one-line fix
with dual provenance (this file records both launches); 3 train rows
resumed via complete-on-disk; no row re-executed under changed inputs).

## Verdict: C4-INVALID (implementation deviation — plan said gains)

The frozen plan specifies menu 0/1 (gains, direct C2 comparability).
The instrument executed menu 3/4 (skips, carried from the C3 rename;
the code comment even claims "(gain 0.5, gain 1.0)" while the values
are 3/4 — my implementation error, disclosed, not hidden). Chains
confirm `op1/op2: replaySkip`, adopted 3+2. The tested manipulation ≠
the planned manipulation, so C4's question (gains + transplant = the
C2 direct follow-up) is UNTESTED and UNANSWERED. No rescore, no
re-run (bank spent, single attempt). Line CLOSED as INVALID.

## The data are nevertheless real (skips + transplant = C3-follow-up)

- Transfer framing FIXED vs C2/C3: exact transplants carried learned
  weights (digests verified per link, same-arm only), and the WOUNDS
  REPLICATED — looper-T1 0.275 / static-T1 0.289 (V1m exact 0.29 to
  0.01). Flip-split HB is real transfer-extinction here.
- Skips adopted (3+2) change nothing: lift1 −0.014, lift2 −0.022,
  looper−copied −0.006; same-val 0.89 intact.
- NOGO-shaped for skips+transplant (would have failed G2a/G2b as
  written): skips join gains/damage/threat as null for transfer
  work even when weights are carried (fourth null; V1h surprise-gain
  stands alone as the only operator with transfer signal).

## Standing

- C4's question (gains+transplant) is LICENSED as C5 (fresh rationale
  already exists: C2-fresh vs C4-transplant isolates transfer; fresh
  plan + fresh bank required; menu indices asserted in fixtures).
- No RSI claim (bars unmoved and unmet). Cumulative 8211 (+20 C4).
