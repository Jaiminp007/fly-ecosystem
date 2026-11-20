# M-POP RESULTS V2 — INVALID-FEASIBLE again: bar-50 does not rescue the lineage substrate

Single authorized attempt-02: Stage-0 triple only (history 445001 ×
candidate/unlearned/frozen), 3 mains / 0 probes, `redone: []`, ledger
5376 ticks / 129024 founder-slots / 0.45e9 ops (caps held). Bank
preserved: 51 of 54 histories unspent, never to be spent under this line.
Cumulative 7974 + 3 = 7977.

## Stage-0 triple (frozen gate: ≥1 birth across the triple)

| arm | births | deaths | survivors (of 24) | energy/founder |
|---|---|---|---|---|
| candidate | 0 | 10 | 14 | −59.8 |
| unlearned | 0 | 23 | 1 | −64.9 |
| frozen | 0 | 20 | 4 | −63.7 |

Total births: 0 → G1 fails → **INVALID-FEASIBLE**, line CLOSED, no Phase 1,
no rescoring, no second attempt. Duel-provenance run; guardrails intact
(physical conservation residuals <1e-7 all rows; op cap unthreatened).

## Reading (what the rerun decided)

The V2 rationale — *the feasibility blocker was the bar* — is REFUTED on its
own terms: lowering the mating bar 65 → 50 changes nothing (0 births, same
thrash-and-starve signature as V1 at bar 65: mass early death, deeply
negative endowments, no mating ever reached). The blocker is NOT the
energy threshold; it is upstream of it (founders die before any mating
can occur; cf. MATE-ENERGY where food-rich bar-50 founders lived to breed).
One new datum: learning keeps founders alive longer (candidate 14 survivors
vs frozen 4, unlearned 1) — retention-relevant, establishment-irrelevant.
It does not convert survival into lineage.

## What this closes, what stays open

- M-POP V2 CLOSED (second INVALID-FEASIBLE on a fresh bank with a different
  bar). No Phase B. No V3 without a new rationale that is NOT about the
  energy bar (candidates, untested and unclaimed: topology that
  concentrates encounters; enriched nutrients; any mechanism that gets
  founders alive *together* rather than merely alive).
- Track B (Vision milestone 5 vehicle) remains unbuilt: the M2-reading and
  the population substrate both still lack a feasible substrate. This
  verdict narrows the search (not-energy-bar) rather than ending it.
- No RSI claim (lineage selection ≠ agent self-modification — restated).
  Fixtures 5/5 pre-execution; suite 958/6 pre-existing unchanged;
  live-bank refusal guard verified post-build; no bank reuse/regeneration.
