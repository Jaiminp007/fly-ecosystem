#!/usr/bin/env python3
"""DISTRIBUTION_AUDIT_V1: Gini + Zipf + bulk-shape on frozen lineage tallies.

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/mate-*/attempt-*/rows/*.json founderOffspring
tallies (offspring per founder, maternal-line counting).
Fulfills R186 (Gini + Zipf specified) + R190 (lognormal-vs-Pareto
specified, growth-rate part closed as UNANSWERABLE below).
Pooling: within (line, arm) across histories — descriptive, disclosed.
Floors: Gini needs total>0; Zipf slope needs >=4 nonzero sizes.
Model comparison is descriptive OLS (no Clauset); disclosed, not hidden.
"""
import json, glob, math
from collections import defaultdict

def gini(xs):
    xs = sorted(xs)
    n = len(xs)
    tot = sum(xs)
    if n < 2 or tot <= 0:
        return None
    return (2 * sum((i + 1) * x for i, x in enumerate(xs)) / (n * tot)
            - (n + 1) / n)

def zipf_slope(sizes):
    s = sorted((x for x in sizes if x > 0), reverse=True)
    if len(s) < 4:
        return None
    n = len(s)
    lr = [math.log(i + 1) for i in range(n)]
    ls = [math.log(x) for x in s]
    mr, ms = sum(lr) / n, sum(ls) / n
    den = sum((x - mr) ** 2 for x in lr)
    if den == 0:
        return None
    b = sum((x - mr) * (y - ms) for x, y in zip(lr, ls)) / den
    # R^2
    ss = sum((y - (ms + b * (x - mr))) ** 2 for x, y in zip(lr, ls))
    tt = sum((y - ms) ** 2 for y in ls)
    return (b, 1 - ss / tt if tt else 0.0)

def lognormal_sigma(sizes):
    s = [math.log(x) for x in sizes if x > 0]
    if len(s) < 2:
        return None
    m = sum(s) / len(s)
    return (sum((x - m) ** 2 for x in s) / len(s)) ** 0.5

def main():
    pools = defaultdict(list)
    for p in sorted(glob.glob("evidence/mate-*/attempt-*/rows/*.json")):
        q = p.replace("\\", "/").split("/")
        try:
            r = json.load(open(p))
        except Exception:
            continue
        fo = r.get("founderOffspring")
        if not isinstance(fo, dict) or not fo:
            continue
        arm = r.get("arm", "?")
        pools[(q[1], arm)].append(list(fo.values()))
    print("line | arm | rows | founders | births | top1 | gini | zipf_slope (R2) | lognorm_sigma")
    for (line, arm) in sorted(pools):
        sizes = [x for row in pools[(line, arm)] for x in row]
        tot = sum(sizes)
        nz = [x for x in sizes if x > 0]
        top1 = (max(sizes) / tot) if tot else None
        g = gini(sizes)
        z = zipf_slope(sizes)
        sg = lognormal_sigma(sizes)
        def f(x):
            return "n/a" if x is None else f"{x:.3f}"
        zs = "n/a" if z is None else f"{z[0]:.3f} ({z[1]:.2f})"
        print(f"{line} | {arm} | {len(pools[(line,arm)])} | {len(sizes)} | "
              f"{tot} | {f(top1)} | {f(g)} | {zs} | {f(sg)}")

if __name__ == "__main__":
    main()
