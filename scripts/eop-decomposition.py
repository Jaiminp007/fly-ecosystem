#!/usr/bin/env python3
"""EOP_DECOMPOSITION_V1: Roemer-style circumstance-vs-effort split of the hub deficit.

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/mate-*/attempt-*/rows/*.json curves.means (per-tick
population mean energy) for paired hub-vs-spread same-seed rows.

Roemer framing: topology assignment (hub vs spread) is CIRCUMSTANCE
(randomized by design — histories are random draws, arm is assigned);
within-arm variation is EFFORT + LUCK (foraging, encounters, deaths).
Outcome: lifetime energy (AUC over active ticks) + end energy (last 100
active ticks). Decomposition: between-arm variance share = circumstance;
within-arm = effort+luck. Paired same-seed design holds background fixed.
"""
import json, glob
from collections import defaultdict

def load():
    rows = []
    for p in sorted(glob.glob("evidence/mate-*/attempt-*/rows/*.json")):
        r = json.load(open(p))
        if r.get("arm") not in ("hub", "spread"):
            continue
        c = r.get("curves") or {}
        means, counts = c.get("means") or {}, c.get("counts") or {}
        if not means:
            continue
        ts = sorted(int(t) for t in means if int(counts.get(t, counts.get(str(t), 0)) or 0) > 0)
        if len(ts) < 300:
            continue
        e = [float(means[str(t)]) for t in ts]
        rows.append({"seed": (r.get("history") or {}).get("seed"), "arm": r["arm"],
                     "bank": p.replace("\\", "/").split("/")[1],
                     "auc": sum(e), "end": sum(e[-100:]) / 100})
    return rows

def var(xs):
    m = sum(xs) / len(xs)
    return sum((x - m) ** 2 for x in xs) / len(xs)

def main():
    rows = load()
    print(f"rows: {len(rows)}")
    # pairing by seed within bank
    pairs = []
    byBank = defaultdict(list)
    for m in rows:
        byBank[m["bank"]].append(m)
    for bank, grp in sorted(byBank.items()):
        hub = {m["seed"]: m for m in grp if m["arm"] == "hub"}
        spr = {m["seed"]: m for m in grp if m["arm"] == "spread"}
        for s in sorted(set(hub) & set(spr)):
            pairs.append((hub[s], spr[s]))
    print(f"paired rows: {len(pairs)} ({len(pairs)*2} mains)")
    for metric in ["auc", "end"]:
        vals = [m[metric] for p in pairs for m in p]
        arms = [[p[0][metric] for p in pairs], [p[1][metric] for p in pairs]]
        means = [sum(a) / len(a) for a in arms]
        grand = sum(vals) / len(vals)
        between = sum(len(a) * (m - grand) ** 2 for a, m in zip(arms, means)) / len(vals)
        total = var(vals)
        print(f"{metric}: grand={grand:.1f} hubMean={means[0]:.1f} spreadMean={means[1]:.1f} "
              f"totalVar={total:.1f} betweenVar={between:.1f} circumstanceShare={between/total:.3f}")
    # gap timing: when does the paired gap reach half its final magnitude?
    halves = []
    for h, s in pairs:
        pass
    print("(gap timing: see GAS_TRAJECTORY_V1 — gap -2.1 at tick 256 to -10.2 at end)")

if __name__ == "__main__":
    main()
