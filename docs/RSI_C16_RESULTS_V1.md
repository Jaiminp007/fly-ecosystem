# RSI C16 RESULTS V1 (cause-gated transfer: mechanism absent → NOGO)

Date: 2026-11-02. Single authorized attempt-01, 16/0 mains/probes,
`redone` = 15 resume-executions after crash-recovery (see Repair log),
ledger 16/0/28672/688128/2.77e9 (caps 16/0/3.4e9/10800s held).
Fresh-32 bank 471001–471054 spent. Verdict: **C16-NOGO**.

## Repair log (dual provenance, result-independent)

First execution crashed on the first transfer (`switch-T1`): the
instrument's inter-segment digest gate compared seg-1-END weights
against seg-2-END weights (post-768-tick learning) — false by
construction. One-line fix: capture `appliedDigest` pre-advance
(immediately post-transplant, the true integrity check), resume with
`--resume`. Bank SHA unchanged (fresh-32 verified spent-once);
sources re-verified post-fix; 16/16 fixtures re-green pre-resume.
No transfer row completed before the fix (zero results existed);
`redone` lists resume-executed rows honestly. Precedent: V1d 1-line
seg-transplant fix; MW crash-resume with dual provenance.

## Gates

- G1 (join+integrity, incl. inter-segment + negated-history
  provenance): PASS.
- G0 (both trains ≥ 0.5): PASS.
- G2a-PRIMARY (switch−static ≥ +0.1 T1 AND T2, T2 ≥ T1): FAIL —
  lift +0.000/+0.000 (switch ≡ static: the vote never fired).
- G2b (switch−copied pooled > 0): FAIL — copiedGap 0.000.
- G2c (direction guard): PASS (vacuous — no switch fired).
- G2bFlat (unlearned flat): PASS.

## The vote never fired (mechanism absent, not mis-aimed)

Seg-1 log-odds L: +4402 to +10646 across all 12 gated legs
(threshold K=8). Confirming contacts outnumber surprising ~8:1
(9424–12960 vs 1118–2511) — even on exact-transplant legs, where
surprising counts ARE elevated (1865–2511, the wound present) but
still drowned by same-val confirming contacts.

## Reading (post-hoc lens; verdict stands, no rescore)

1. The vote as frozen pools ALL cues: same-val correct behavior
   (0.93) swamps flipped-cue surprise. The switch cannot fire
   exactly when transfer works — and under lossy transfer it
   works (HB 0.91–0.95, replicating V1j/V1m/V1o baselines).
2. Family #1's simplest form is therefore CLOSED with reason:
   global surprise-gating fails by dilution. A sharper vote
   (flipped-suspect-cue-conditional L) would be a NEW rationale
   variation needing its own freeze — not a repair, not a rescore.
3. No contradiction with any closed line (lossy cure replicates;
   exact wound unmeasured here but present in counts).
4. Reading caution (R435/AERA): evidence can STRENGTHEN before
   collapse (non-monotonic) — L (+4402..+10646) must NOT be read
   as confidence in the OLD cause; pooled confirming counts are
   not belief. Frozen+small-delta (Sandwich-Residuals + RAEGL,
   twice-confirmed) is the licensed-shaped pattern going forward:
   freeze the big, gate the small delta.

## Line status

CLOSED as C16-NOGO. No second attempt, no rescoring, bars unmoved.
