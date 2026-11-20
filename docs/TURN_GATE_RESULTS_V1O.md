# TURN-GATE RESULTS V1O — multi-codebook training (INCOMPLETE-UNTRAINED)

Date: 2026-11-02. Single authorized attempt-15, 15/0 mains/probes,
`redone: []`, ledger 15/0/26880/645120/2.49e9 (caps 15/0/4.2e9/10800s
held). Fresh-15 bank 470001–470054 spent. Verdict: **PHASE-O-
INCOMPLETE-UNTRAINED** (fail-closed on G0).

## Gates

- G1 (join+integrity, incl. pseudo-scheme proof): PASS.
- G0 (both trains ≥0.5 all pairs): FAIL → INCOMPLETE.
  train-single: 0.820/0.814/0.815 (learned fine).
  train-multi: 0.667/0.365/0.508 — pair 2 (470019) at 0.365.
- G2a-MULTI (descriptive only): lift +0.0404 (hbMulti 0.9262 −
  hbSingle 0.8858), nonDegraded 3/3 — directionally positive,
  misses +0.10 by 0.06. NOT a pass (G0 failed; recorded, not gated).
- G2b (unlearned flat): PASS. G2c (BH ≥0.7): PASS (0.83–0.90).
  G2d (same ≥0.5): PASS (0.83–0.94).

## Reading (descriptive, no verdict moves)

1. Multi-training COST train performance (0.67/0.51 vs 0.82/0.82
   on pairs 1/3; 0.36 on pair 2): switching codebooks mid-training
   disrupts rule consolidation — the thirds chain ends worse than
   uninterrupted single training. Pseudo-by-permutation acts as
   interference, not enrichment, within 1792 ticks.
2. Transfer baseline replicates: lossy-0.25 single-transfer HB
   0.886 (V1j/V1m replication — the working baseline holds).
3. The +0.04 lift with 3/3 non-degradation is consistent with
   nothing (noise at bar like C6/C13): G0-failed, ungated.
4. No contradiction with the wound: exact-transplant HB gap
   stands; lossy cures it here as before.

## Line status

CLOSED as INCOMPLETE-UNTRAINED. Family #2's simplest form is
UNTESTED (not NOGO — the question never completed): a future
multi-codebook line must first solve multi-train learning itself
(G0) before any transfer lift can be gated. Inference-gating
(family #1) unaffected. No rescoring, no second attempt, bars unmoved.

## Post-hoc lens (R369; explains, does not rescore — verdict stands)

Doan/NTK-overlap: forgetting grows with task alignment. A/A2/A3
(same rule, permuted cues) are maximally aligned → maximal
interference → multi-train G0 fails. The pseudos were too similar.
A future multi-codebook line wants DISSIMILAR pseudos (low overlap)
or gradient-alignment machinery (Bai/Abbes/Dherin — all unlicensed).
Second lens (R375/Gai ACTIVE FORGETTING): conservative learning can
actively forget the learnt skill — V1o's thirds-training may have
caused unlearning, not just interference. Compatible, untested.
Third lens (R383/Hiratani): high INPUT similarity + LOW readout
similarity is analytically the catastrophic cell — A/A2/A3 share
the world but remap the readout. V1o sat exactly in it.
Compatible, untested; verdict stands.
Fourth lens (R401/Hu): shared-routing projections collapse to vanilla
forgetting — only adaptive DECOUPLED routing survives. V1o's
thirds in miniature (shared weights, no decoupling). Filed;
verdict stands.
