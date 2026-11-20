#!/usr/bin/env python3
"""SWF_AUDIT_V1: do mating verdicts survive the welfare function? (total vs average gen-2)

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/mate-*/attempt-*/rows/*.json (births + generations.byGeneration).

For each published arm comparison decided on gen-2 TOTALS, recompute under
AVERAGES (totG2/totBirths) and locate the critical level c* where
CL(c) = totG2 - c*totBirths flips the verdict (Parfit/Blackorby/Dworkin;
if none exists in [0, inf), the verdict is SWF-robust).
"""
import json, glob
from collections import defaultdict

def med(xs):
    xs = sorted(x for x in xs if x is not None)
    if not xs:
        return None
    m = len(xs) // 2
    return xs[m] if len(xs) % 2 else (xs[m - 1] + xs[m]) / 2

agg = defaultdict(lambda: {"b": 0, "g": 0, "n": 0})
for p in sorted(glob.glob("evidence/mate-*/attempt-*/rows/*.json")):
    r = json.load(open(p))
    if r.get("births") is None:
        continue
    by = ((r.get("generations") or {}).get("byGeneration")) or {}
    parts = p.replace("\\", "/").split("/")
    key = (parts[1] + "/" + parts[2], r.get("arm"))
    agg[key]["b"] += r["births"] or 0
    agg[key]["g"] += int(by.get("2", 0) or 0)
    agg[key]["n"] += 1

print(f"(bank, arm) groups: {len(agg)}")
print("\nbank | arm | rows | totBirths | totGen2 | avgRate")
for (bank, arm) in sorted(agg):
    a = agg[(bank, arm)]
    avg = a["g"] / a["b"] if a["b"] else None
    print(f"{bank} | {arm} | {a['n']} | {a['b']} | {a['g']} | {avg}")

# published verdict pairs (armA, armB, bank, verdict-direction on TOTALS)
PAIRS = [
    ("mate-social-dev/attempt-01", "maternal", "copybest", "tie 1=1"),
    ("mate-social-dev/attempt-02", "maternal", "copycond", "maternal wins 5v3"),
    ("mate-social-dev/attempt-02", "maternal", "copyalways", "maternal wins 5v0"),
    ("mate-encounter-dev/attempt-01", "spread", "hub", "hub wins 5v3"),
    ("mate-encounter-dev/attempt-02", "spread", "hub", "hub wins 7v2 (descriptive)"),
    ("mate-encounter-dev/attempt-03", "spread", "duo", "duo wins 10v2"),
    ("mate-encounter-dev/attempt-03", "hub", "duo", "duo wins 10v2"),
    ("mate-leave-dev/attempt-01", "hub", "hubLeave", "hubLeave wins 7v4"),
    ("mate-leave-dev/attempt-02", "hub", "hubLeave2", "tie-ish 4v4 (replication)"),
    ("mate-leave-dev/attempt-02", "hubLeave1", "hubLeave4", "both beat hub (ladder)"),
    ("mate-recombine-dev/attempt-01", "hub", "hubRecombine", "hub wins 5v4 (neutral)"),
    ("mate-disperse-dev/attempt-01", "hub", "hubDisperse", "hub wins 8v1"),
    ("mate-attract-dev/attempt-05", "hub", "hubAttract", "7v8 (neutral)"),
    ("mate-inherit-dev/attempt-02", "exact", "mutant", "mutant wins 3v2 (V1b)"),
    ("mate-inherit-dev/attempt-03", "exact", "mutant", "exact wins 2v1 (V1c)"),
    ("mate-food-dev/attempt-01", "control", "enriched", "enriched wins 1v0"),
]
print("\nverdict | totA-totB | avgA-avgB | flip? | c* (if any)")
for bank, a, b, note in PAIRS:
    A = agg.get((bank, a))
    B = agg.get((bank, b))
    if not A or not B:
        print(f"{bank} {a}v{b}: MISSING DATA")
        continue
    dTot = A["g"] - B["g"]
    avA = A["g"] / A["b"] if A["b"] else None
    avB = B["g"] / B["b"] if B["b"] else None
    if avA is None or avB is None:
        print(f"{bank} {a}v{b}: UNDEFINED AVG (zero births)")
        continue
    dAvg = avA - avB
    flip = (dTot > 0) != (dAvg > 0) and dTot != 0 and abs(dAvg) > 1e-12
    cs = ""
    if flip:
        # CL(c) = (gA-c*bA)-(gB-c*bB) = dTot - c*(bA-bB) = 0 -> c* = dTot/(bA-bB)
        if A["b"] != B["b"]:
            cs = f"c*={dTot/(A['b']-B['b']):.4f}"
        else:
            cs = "c*=inf"
    print(f"{bank} {a}({A['g']}/{A['b']}={avA:.3f}) v {b}({B['g']}/{B['b']}={avB:.3f}) [{note}]: "
          f"dTot={dTot:+d} dAvg={dAvg:+.4f} {'FLIP' if flip else 'same'} {cs}")
