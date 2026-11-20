#!/usr/bin/env python3
"""TIMING_AUDIT_V1: when do first matings happen? Early-or-first test.

Analytic-only. Zero new worlds, zero new seeds, zero bank draws.
Reads frozen evidence/mate-*/attempt-*/rows/*.json firstMatingTick
(first mating tick per seed x arm; null/absent = never-or-unrecorded)
+ births + survivors.
Disclosed: timing data in 7/13 lines (field added V1c-era; older
schemas + social-dev lack it); birth TIMING (all births, not first)
absent everywhere — first-mating only.
"""
import json, glob, statistics
from collections import defaultdict

def main():
    pools = defaultdict(list)
    nofield = defaultdict(int)
    for p in sorted(glob.glob("evidence/mate-*/attempt-*/rows/*.json")):
        q = p.replace("\\", "/").split("/")
        try:
            r = json.load(open(p))
        except Exception:
            continue
        k = (q[1], r.get("arm", "?"))
        v = r.get("firstMatingTick", "ABSENT")
        if v == "ABSENT":
            nofield[k] += 1
            continue
        pools[k].append((v, r.get("births", 0)))
    print("line | arm | n_timed | fmt_min/med/max | null_frac | births_med")
    for (line, arm) in sorted(set(list(pools)) | set(nofield)):
        rows = pools.get((line, arm), [])
        nf = nofield.get((line, arm), 0)
        real = [x[0] for x in rows if isinstance(x[0], (int, float))
                and x[0] == x[0] and x[0] >= 0]
        nullfrac = (sum(1 for x in rows
                         if not (isinstance(x[0], (int, float))
                                 and x[0] == x[0] and x[0] >= 0))
                    / len(rows)) if rows else 1.0
        if real:
            med = statistics.median(real)
            print(f"{line} | {arm} | {len(rows)}(noField:{nf}) | "
                  f"{min(real)}/{med:.0f}/{max(real)} | {nullfrac:.2f} | "
                  f"{statistics.median([x[1] for x in rows]):.1f}")
        else:
            print(f"{line} | {arm} | 0(noField:{nf}) | no timing data | - | -")

if __name__ == "__main__":
    main()
