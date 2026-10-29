# Body-transfer study V2 — results (frozen attempt, audited verdict)

Status: **Frozen COMPLETE — verdict FAIL-body** (audited, single authorized attempt).
Plan: `docs/BODY_TRANSFER_PLAN_V2.md` (frozen 2026-10-28). Bank:
`evidence/body-transfer/v2/fresh-01/protocol.json` (sha256 `47b44c62…`, 8 histories /
72 seeds, 19,943 excluded). Attempt: `evidence/body-transfer/v2/attempt-01/`.

## Verdict

**FAIL-body**: the N source requalified on all 7 gates, but the Q gated body failed
gate 5 (A-retention −0.13, 3/8) and the N→Q direct-transfer skill quotas
(A every-history floor −1.69, B every-history floor −0.85). No PASS, no FAIL-source,
no INVALID, no second attempt, no tuning, no RSI claim.

## Gate table (means over 8 fresh histories; bars = V2 plan §7 = V1 bars)

| gate | N (gated) | Q (gated) | P (descriptive control) |
|---|---|---|---|
| g1 lifetime | **+5.83**, 8/8 PASS | **+3.89**, 8/8 PASS | +1.39, 7/8 (info only) |
| g2 vs frozen | **+4.62**, 8/8 PASS | **+2.85**, 8/8 PASS | +0.94, 7/8 |
| g3 vs reset | **+1.38**, 8/8 PASS | **+0.50**, 7/8 PASS | +0.66, 8/8 |
| g4 skills | **A+1.74 / B+1.31 / acq+0.74**, 8/8 PASS | **A+1.33 / B+0.73 / acq+1.06**, 8/8(7) PASS | A+0.16 / B+0.23 / acq+0.08 (fails) |
| g5 retention | **A+0.49 (6/8) / B+0.35 (6/8)** PASS | **A−0.13 (3/8)** / B+0.17 (6/8) **FAIL** | A−0.15 (3/8) / B−0.06 (3/8) |
| g6 within (odor-free) | 0.00 PASS (tie expected) | 0.00 PASS (tie expected) | 0.00 |
| g6 direct | — | **A −0.35 (floor −1.69) / B −0.24 (floor −0.85) FAIL** | A −1.37 / B −0.83 (descriptive) |
| gate 7 integrity | residual 1.37e-9, 0/384 revivals, P≥1 exposures (min 15,495), Q≥100 diffs (min 24,621), zero nonzero cruise translations, 195 MB < 8 GiB — **PASS** | | |

N passes everything including the retention gate that killed V1 (V1 N aRet −0.076, 5/8;
V2 N aRet +0.49, 6/8): **V1's FAIL-source does not replicate — it was bank luck, and
the qualification recipe requalifies.** The mechanism question is therefore cleanly
attributable to the body, not the source.

## Mechanism contrast (descriptive, predeclared as non-rescuing)

Per-history Q-vs-P direct gaps average **+1.02 (A) / +0.58 (B)** in Q's favor
(minima −0.19 / −0.29 — Q≈P on the worst history, ahead everywhere else):
the translation-preserving Q recovers roughly one energy unit of transport in
skill A and +0.6 in skill B** relative to the harsh P body. The V2 hypothesis is
confirmed as a real effect — translation loss was a large, genuine part of V1's
collapse (P lifetime +1.39 vs Q +3.89 vs N +5.83).

But it does not rescue the verdict: Q still misses the A-retention quota on 5/8
histories and the direct-transport floors on at least one history per skill. Heading
coupling alone still breaks skill transport. The failure moved from "everything
collapses" (V1/P) to "lifetime mostly holds, retention + direct transport fail on
tails" (V2/Q).

## Budget and integrity ledger

152 mains × 1792 + 536 probes × 256 = **409,600 world-ticks / 9,830,400 founder-ticks
exactly as planned**; burned 23,320,277,722 scalar ops ≤ 240e9 cap (9.6× headroom);
per-row runtimes ≈164/168/164/54 s wall (all « 600 s caps; aggregate ≈9.2 min «
40-min ceiling). 72/72 fresh seeds spent, ledger-complete 152/536.

Provenance notes (both disclosed, zero science impact):
- Collection ran to completion under the frozen runner (`6f3d51f`); the final log line
  crashed on a bare variable reference. Repaired in `f5999a9` (log line only +
  resume-hygiene: redone-sections recorded on resume only, results.json overwrite for
  the resume path). `--resume` re-verified bank SHA + single-changed-file rule,
  skipped all 32 complete sections (0 new executions), rescored bit-identically.
- Label runtimes in `results.json`/`ledger.json` are resume skip-pass artifacts (~0 s);
  authoritative collection times are the pre-resume ledger values + row-file mtime
  bounds recorded above.

## Independent audit (Python, separate path)

Recomputed from row/anchor JSONs: N g1 +5.8276 (8/8), Q g1 +3.8864 (8/8), direct-Q
A/B every-history floors −1.6888/−0.8525 — all exact matches. Revival recheck over
all 384 probes (320 battery + 64 direct): **0 violations**. Exposure: P min 15,495
(≥1), Q min 24,621 (≥100), QmovesMax 0. Bank SHA match. Verdict logic rechecked:
nPass ∧ ¬qPass → FAIL-body.

## Consequences (per plan §12)

- V2 FAIL-body (not FAIL-source) → **the V1 family stays CLOSED, the V2 family is now
  CLOSED**: no Option B execution under this goal, no RSI reopening (0/2 stands), no
  second attempt on these seeds.
- Negative synthesis: translation-preserving actuation recovers ~1 energy unit but
  heading-coupled direct transport still fails floors — a **new gated body (Option B,
  new sense) remains the only principled reopen**, requiring a NEW goal.
