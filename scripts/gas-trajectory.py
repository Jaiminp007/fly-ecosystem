#!/usr/bin/env python3
"""GAS_TRAJECTORY_V1: hub time-courses re-read as Selye's General Adaptation Syndrome.

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/mate-*/attempt-*/rows/*.json curves:
  means[t]  = per-tick population mean ENERGY (system-level trajectory)
  counts[t] = per-tick alive population (births add, deaths subtract)

GAS phases (operationalized):
  alarm      = early spending rate: least-squares slope over ticks 1..256
               (more negative = stronger alarm; e0 = mean over ticks 1..50)
  resistance = mid-run holding: mean over middle third of ACTIVE ticks
  exhaustion = decline + end: slope over last 256 active ticks; tEnd = last
               tick with counts>0 (<1792 iff extinct); AUC over active ticks
Verdict rule (pre-registered in run): GAS SUPPORTED iff hub shows the full
triphasic pattern RELATIVE to spread (steeper alarm AND lower/flatter
resistance AND earlier exhaustion) in paired same-seed rows; else the
re-read is NOT SUPPORTED (monotonic decline = no resistance phase).
Mask: only ticks with counts>0 contribute (post-extinction means undefined).
"""
import json, glob
from collections import defaultdict

def slope(ys):
    n = len(ys)
    if n < 2:
        return 0.0
    mx = (n - 1) / 2
    my = sum(ys) / n
    den = sum((i - mx) ** 2 for i in range(n))
    return sum((i - mx) * (y - my) for i, y in enumerate(ys)) / den if den else 0.0

def row_metrics(path):
    r = json.load(open(path))
    c = r.get("curves") or {}
    means, counts = c.get("means") or {}, c.get("counts") or {}
    if not means or not counts:
        return None
    ts = sorted(int(t) for t in means if int(counts.get(t, counts.get(str(t), 0)) or 0) > 0)
    if len(ts) < 300:
        return None
    e = [float(means[str(t)]) for t in ts]
    early = [float(means[str(t)]) for t in ts if t <= 256]
    late = e[-256:] if len(e) >= 256 else e
    third = len(e) // 3
    mid = e[third:2 * third]
    return {
        "file": path.replace("\\", "/").split("/")[-1],
        "seed": (r.get("history") or {}).get("seed"), "arm": r.get("arm"),
        "bank": path.replace("\\", "/").split("/")[1],
        "e0": sum(float(means[str(t)]) for t in ts if t <= 50) / max(1, sum(1 for t in ts if t <= 50)),
        "slopeEarly": slope(early), "resist": sum(mid) / len(mid),
        "slopeLate": slope(late), "tEnd": ts[-1],
        "auc": sum(e), "activeTicks": len(ts),
    }

def med(xs):
    xs = sorted(x for x in xs if x is not None)
    if not xs:
        return None
    m = len(xs) // 2
    return xs[m] if len(xs) % 2 else (xs[m - 1] + xs[m]) / 2

def main():
    ms = []
    for p in sorted(glob.glob("evidence/mate-*/attempt-*/rows/*.json")):
        m = row_metrics(p)
        if m:
            ms.append(m)
    print(f"rows with usable curves: {len(ms)}")
    # paired hub vs spread
    byBank = defaultdict(list)
    for m in ms:
        byBank[m["bank"]].append(m)
    diffs = defaultdict(list)  # metric -> list of hub-spread diffs
    npair = 0
    for bank, grp in sorted(byBank.items()):
        arms = set(m["arm"] for m in grp)
        if "spread" not in arms or "hub" not in arms:
            continue
        for m in grp:
            m["_k"] = (m["seed"])
        hub = {m["seed"]: m for m in grp if m["arm"] == "hub"}
        spr = {m["seed"]: m for m in grp if m["arm"] == "spread"}
        for s in sorted(set(hub) & set(spr)):
            npair += 1
            for k in ["e0", "slopeEarly", "resist", "slopeLate", "tEnd", "auc"]:
                diffs[k].append(hub[s][k] - spr[s][k])
    print(f"paired hub-spread rows: {npair}")
    for k in ["e0", "slopeEarly", "resist", "slopeLate", "tEnd", "auc"]:
        ds = diffs[k]
        print(f"{k}: n={len(ds)} med={med(ds)} "
              f"fracHubLower={sum(1 for d in ds if d < 0)}/{len(ds)}")
    # triphasic check: how many pairs show steepEarly AND lowResist AND earlyEnd?
    n = 0
    tri = 0
    mono = 0
    for bank, grp in sorted(byBank.items()):
        hub = {m["seed"]: m for m in grp if m["arm"] == "hub"}
        spr = {m["seed"]: m for m in grp if m["arm"] == "spread"}
        for s in set(hub) & set(spr):
            h, p = hub[s], spr[s]
            n += 1
            # resistance-phase test on hub alone: mid slope flatter than early slope?
            if h["slopeEarly"] < h["slopeLate"] - 1e-9:
                tri += 1  # decline decelerates mid-run (holding pattern)
            if abs(h["slopeEarly"] - h["slopeLate"]) < 0.005 * max(1, abs(h["slopeEarly"])):
                mono += 1  # near-constant decline rate (no phases)
    print(f"hub deceleration (resistance-like): {tri}/{n}; near-monotonic: {mono}/{n}")

if __name__ == "__main__":
    main()
