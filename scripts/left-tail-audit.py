#!/usr/bin/env python3
"""LEFT_TAIL_AUDIT_V1: left-tail quantiles alongside means, all frozen rows.

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/mate-*/attempt-*/rows/*.json endpoints
(births, survivors, budgetAdjustedEnergyPerFounder per seed x arm)
+ evidence/turn-gated-dev/attempt-*/dev-results.json per-seed gaps.
Executes R178 queued item (report left-tail quantiles alongside means).
Disclosed: seeds per arm are few (5-18); tails are coarse — reported
as sorted values + min/med/max, no smoothing, no model.
"""
import json, glob, statistics
from collections import defaultdict

def qsorted(xs):
    xs = sorted(xs)
    n = len(xs)
    if n == 0:
        return None
    med = statistics.median(xs)
    return {"n": n, "min": xs[0], "med": med, "max": xs[-1],
            "frac_zero": sum(1 for x in xs if x == 0) / n,
            "all": xs if n <= 12 else None}

def main():
    mate = defaultdict(lambda: {"births": [], "surv": [], "energy": []})
    for p in sorted(glob.glob("evidence/mate-*/attempt-*/rows/*.json")):
        q = p.replace("\\", "/").split("/")
        try:
            r = json.load(open(p))
        except Exception:
            continue
        ep = r.get("endpoint") or {}
        arm = r.get("arm", "?")
        k = (q[1], arm)
        mate[k]["births"].append(r.get("births", 0))
        mate[k]["surv"].append(ep.get("survivors", 0))
        mate[k]["energy"].append(ep.get("budgetAdjustedEnergyPerFounder", 0.0))
    print("=== MATING left tails: line | arm | births[min/med/max|f0] | surv[min/med/max|f0] | energy[min/med/max]")
    for (line, arm) in sorted(mate):
        b = qsorted(mate[(line, arm)]["births"])
        s = qsorted(mate[(line, arm)]["surv"])
        e = qsorted(mate[(line, arm)]["energy"])
        print(f"{line} | {arm} | {b['min']}/{b['med']}/{b['max']}|{b['frac_zero']:.2f} | "
              f"{s['min']}/{s['med']}/{s['max']}|{s['frac_zero']:.2f} | "
              f"{e['min']:.1f}/{e['med']:.1f}/{e['max']:.1f}")
    print("=== TURN-GATE per-seed gaps: bank | train[min/med/max] | transferred[min/med/max] | worst-seed transfer")
    for att in sorted(glob.glob("evidence/turn-gated-dev/attempt-*/dev-results.json")):
        try:
            d = json.load(open(att))
        except Exception:
            continue
        def gaps(v):
            return [g["gap"] if isinstance(g, dict) else g for g in (v or [])]
        tg = gaps(d.get("trainGaps"))
        xg = gaps(d.get("transGaps"))
        if not tg or not xg:
            continue
        bank = att.replace("\\", "/").split("/")[-2]
        t = qsorted(tg)
        x = qsorted(xg)
        print(f"{bank} | {t['min']:.3f}/{t['med']:.3f}/{t['max']:.3f} | "
              f"{x['min']:.3f}/{x['med']:.3f}/{x['max']:.3f} | worst={x['min']:.3f}")

if __name__ == "__main__":
    main()
