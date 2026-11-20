# RSI C12 RESULTS V1 — C12-NOGO (rate adopted, transfers flat-to-negative)

Date: 2026-11-02. Attempt-01 (single authorized): 20/0/35840/860160/
3.290e9, `redone: []`, caps respected. Bank fresh-28 (466001–466054)
SPENT. No incident (menu-7 assertions held; TRUE dose-match verified:
baseline construction + voted `copierMenuIndex`; C7 guard green).

## Verdict: C12-NOGO (gates fail as written)

| Gate | Result |
|---|---|
| G1 join+integrity | TRUE |
| G0 looper-train ≥0.5 | TRUE |
| G2a successive | FALSE (lift1 UNMEASURABLE (null); lift2 +0.017) |
| G2b productivity | FALSE (−0.063; vacuous-unanimous, worst yet) |
| G2c / G2d | TRUE / TRUE (same 0.88) |

## What happened

- TasteRate-2.0 adopted live (train 8/48 proposals, T1 12; both
  chains `tasteRate`) — the update rule itself is proposable and
  adoptable. Mechanism ✓.
- Transfers flat-to-negative: chain0-T1 (measurable): looper 0.365
  vs static 0.416 (−0.051, adoption HURTS); T2 pooled +0.017.
- T1 half-void again, BH-side this time (chain1 seed 466037: zero
  BH contacts, all arms; HB thin 1.3–1.7k vs chain0's 3.5–4k).
  History property, not arm effect — second consecutive bank with a
  T1 void (C11 HB-side 465010, C12 BH-side 466037).
- G2b −0.063 with UNANIMOUS adoption (all votes index 7): same op,
  same tick → noise + weight-history, no selection difference.
  Fourth vacuous pass (C7 +0.0001, C10 +0.028, C11 −0.015).

## Standing

- Update-rule family joins replay as live-workable but
  transfer-null (adopted 20 votes, lifts −0.05/+0.02). The VISION
  "learning algorithm" redesign stays unshown — a rate dial is not
  a redesign (lesson sharpened, not evaded).
- C-series remains exhausted; C13 needs a genuinely new rationale
  (none licensed). No RSI claim. Cumulative 8371 (+20 C12).
